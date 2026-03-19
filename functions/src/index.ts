import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import crypto from "crypto";
import cors from "cors";

// Initialize Firebase Admin
admin.initializeApp();

// CORS middleware configuration
const corsHandler = cors({ origin: true });

// Get MTN API credentials from Firebase config (functions.config())
const mtnConfig = functions.config().mtn || {};
const MTN_API_URL = mtnConfig.api_url || "https://api.mtn.com/v2";
const MTN_API_KEY = mtnConfig.api_key;
const MTN_SUBSCRIPTION_KEY = mtnConfig.subscription_key;
const MTN_COLLECTION_ACCOUNT = mtnConfig.collection_account;
const MTN_CURRENCY = "UGX"; // Uganda Shilling

// Get AIRTEL API credentials from Firebase config
const airtelConfig = functions.config().airtel || {};
const AIRTEL_API_URL = airtelConfig.api_url || "https://openapi.airtel.africa";
const AIRTEL_API_KEY = airtelConfig.api_key;
const AIRTEL_BUSINESS_ID = airtelConfig.business_id;
const AIRTEL_CURRENCY = "UGX"; // Uganda Shilling

const resendConfig = functions.config().resend || {};
const RESEND_API_KEY: string | undefined = resendConfig.api_key;
const RESEND_FROM_EMAIL: string | undefined = resendConfig.from_email;

const otpConfig = functions.config().otp || {};
const OTP_SECRET: string | undefined = otpConfig.secret;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_PER_HOUR = 5;
const OTP_MAX_ATTEMPTS = 5;

// Validate required config early to avoid opaque INTERNAL errors
function ensureMTNConfig() {
  if (!MTN_API_KEY || !MTN_SUBSCRIPTION_KEY || !MTN_COLLECTION_ACCOUNT) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "MTN configuration is missing. Please set mtn.api_key, mtn.subscription_key, and mtn.collection_account in functions config.",
    );
  }
}

function ensureAirtelConfig() {
  if (!AIRTEL_API_KEY || !AIRTEL_BUSINESS_ID) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Airtel configuration is missing. Please set airtel.api_key and airtel.business_id in functions config.",
    );
  }
}

interface SendMoMoPaymentRequest {
  phoneNumber: string;
  provider: string;
  amount: number;
  purpose: string;
  transactionId: string;
  email?: string;
}

interface SignupOtpRequest {
  email: string;
  studentRecordId?: string | null;
}

interface SignupOtpVerifyRequest {
  email: string;
  otp: string;
}

function isRunningInEmulator(): boolean {
  return process.env.FUNCTIONS_EMULATOR === "true";
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function validateEmail(email: string): void {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "A valid email address is required.",
    );
  }
}

function generateOtpCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

function buildOtpHash(email: string, otp: string, nonce: string): string {
  const secret = OTP_SECRET || "";
  return crypto
    .createHash("sha256")
    .update(`${email}|${otp}|${nonce}|${secret}`)
    .digest("hex");
}

async function sendOtpEmail(email: string, otp: string): Promise<void> {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    if (isRunningInEmulator()) {
      console.log(`[OTP][EMULATOR] ${email} => ${otp}`);
      return;
    }

    throw new functions.https.HttpsError(
      "failed-precondition",
      "OTP delivery is not configured. Set resend.api_key and resend.from_email.",
    );
  }

  const payload = {
    from: RESEND_FROM_EMAIL,
    to: [email],
    subject: "Your Nexus University verification code",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin: 0 0 12px 0;">Verification Code</h2>
        <p>Use the code below to continue your Nexus University signup:</p>
        <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700; margin: 16px 0;">${otp}</p>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this code, you can safely ignore this email.</p>
      </div>
    `,
  };

  await axios.post("https://api.resend.com/emails", payload, {
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
}

// Public callable used during signup before user authentication.
export const sendSignupOtp = functions.https.onCall(
  async (
    data: SignupOtpRequest,
    _context: functions.https.CallableContext,
  ) => {
    const email = normalizeEmail(data?.email || "");
    validateEmail(email);

    if (!OTP_SECRET && !isRunningInEmulator()) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "OTP secret is not configured. Set otp.secret in functions config.",
      );
    }

    const db = admin.firestore();
    const now = Date.now();
    const oneHourAgo = admin.firestore.Timestamp.fromMillis(now - 60 * 60 * 1000);
    const cooldownAgo = admin.firestore.Timestamp.fromMillis(
      now - OTP_RESEND_COOLDOWN_MS,
    );

    const recentQuery = await db
      .collection("otp_verifications")
      .where("email", "==", email)
      .where("purpose", "==", "signup")
      .where("createdAt", ">=", oneHourAgo)
      .get();

    if (recentQuery.size >= OTP_MAX_PER_HOUR) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Too many OTP requests. Please try again later.",
      );
    }

    const cooldownQuery = await db
      .collection("otp_verifications")
      .where("email", "==", email)
      .where("purpose", "==", "signup")
      .where("verified", "==", false)
      .where("createdAt", ">=", cooldownAgo)
      .limit(1)
      .get();

    if (!cooldownQuery.empty) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Please wait at least 60 seconds before requesting another OTP.",
      );
    }

    const otp = generateOtpCode();
    const nonce = generateNonce();
    const otpHash = buildOtpHash(email, otp, nonce);
    const expiresAt = admin.firestore.Timestamp.fromMillis(now + OTP_TTL_MS);

    await db.collection("otp_verifications").add({
      email,
      student_record_id: data?.studentRecordId ?? null,
      purpose: "signup",
      otp_hash: otpHash,
      nonce,
      verified: false,
      attempts: 0,
      max_attempts: OTP_MAX_ATTEMPTS,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
    });

    await sendOtpEmail(email, otp);

    return {
      success: true,
      deliveryChannel: "email",
      otp: isRunningInEmulator() ? otp : "",
    };
  },
);

// Public callable used during signup before user authentication.
export const verifySignupOtp = functions.https.onCall(
  async (
    data: SignupOtpVerifyRequest,
    _context: functions.https.CallableContext,
  ) => {
    const email = normalizeEmail(data?.email || "");
    const otp = (data?.otp || "").trim();

    validateEmail(email);

    if (!/^\d{4}$/.test(otp)) {
      return {
        valid: false,
        reason: "invalid-format",
      };
    }

    const db = admin.firestore();
    const latestSnapshot = await db
      .collection("otp_verifications")
      .where("email", "==", email)
      .where("purpose", "==", "signup")
      .where("verified", "==", false)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (latestSnapshot.empty) {
      return {
        valid: false,
        reason: "not-found",
      };
    }

    const otpDoc = latestSnapshot.docs[0];
    const record = otpDoc.data() as {
      nonce?: string;
      otp_hash?: string;
      attempts?: number;
      max_attempts?: number;
      expiresAt?: admin.firestore.Timestamp;
    };

    const attempts = record.attempts ?? 0;
    const maxAttempts = record.max_attempts ?? OTP_MAX_ATTEMPTS;

    if (attempts >= maxAttempts) {
      return {
        valid: false,
        reason: "max-attempts",
      };
    }

    const expiresAtMillis = record.expiresAt?.toMillis?.() || 0;
    if (Date.now() > expiresAtMillis) {
      return {
        valid: false,
        reason: "expired",
      };
    }

    if (!record.nonce || !record.otp_hash) {
      return {
        valid: false,
        reason: "invalid-record",
      };
    }

    const candidateHash = buildOtpHash(email, otp, record.nonce);
    const isMatch = candidateHash === record.otp_hash;

    if (!isMatch) {
      await otpDoc.ref.update({
        attempts: attempts + 1,
      });

      return {
        valid: false,
        reason: "invalid-code",
      };
    }

    await otpDoc.ref.update({
      verified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      valid: true,
    };
  },
);

/**
 * Generate MTN API request header signature
 */
function generateMTNSignature(requestBody: string): string {
  return crypto
    .createHash("sha256")
    .update(requestBody + MTN_API_KEY)
    .digest("hex");
}

/**
 * Cloud Function: Initiate Real MTN MoMo Payment
 * Sends USSD prompt to user's phone for real payment processing
 */
export const sendMTNPaymentPrompt = functions.https.onCall(
  async (
    data: SendMoMoPaymentRequest,
    context: functions.https.CallableContext,
  ) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be authenticated to initiate payments.",
      );
    }

    const userId = context.auth.uid;

    // Ensure MTN credentials are configured
    ensureMTNConfig();

    const { phoneNumber, provider, amount, purpose, transactionId, email } =
      data;

    // Validate inputs
    if (!phoneNumber || !provider || !amount || !transactionId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields",
      );
    }

    // Validate phone number (must be 9-10 digits for Uganda)
    if (!/^\d{9,10}$/.test(phoneNumber)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid phone number format. Use 9-10 digits.",
      );
    }

    const fullPhoneNumber = `256${phoneNumber}`; // MTN format without +

    try {
      // Create MTN API request payload
      const requestPayload = {
        amount: amount,
        currency: MTN_CURRENCY,
        externalId: transactionId,
        payer: {
          partyIdType: "MSISDN",
          partyId: fullPhoneNumber,
        },
        payerMessage: `Payment for ${purpose}`,
        payeeNote: `Nexus University - ${purpose}`,
        description: `University Payment - ${purpose}`,
      };

      const requestBody = JSON.stringify(requestPayload);
      const signature = generateMTNSignature(requestBody);

      // Make request to MTN API
      const response = await axios.post(
        `${MTN_API_URL}/collection/v1_0/requesttopay`,
        requestPayload,
        {
          headers: {
            "X-Reference-Id": transactionId,
            "X-Callback-Url": `${
              process.env.CLOUD_FUNCTION_URL || ""
            }/callbacks/mtn-payment`,
            "Ocp-Apim-Subscription-Key": MTN_SUBSCRIPTION_KEY,
            Authorization: `Bearer ${MTN_API_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Log the payment initiation
      console.log(
        `MTN payment initiated. Reference: ${transactionId}, Phone: ${fullPhoneNumber}`,
      );

      // Store payment record in Firestore
      const db = admin.firestore();
      await db
        .collection("mtn_payments")
        .doc(transactionId)
        .set({
          userId: userId,
          phoneNumber: fullPhoneNumber,
          provider: provider,
          amount: amount,
          currency: MTN_CURRENCY,
          purpose: purpose,
          transactionId: transactionId,
          email: email || context.auth?.token?.email,
          status: "pending", // PENDING -> USER_ACCEPTS/USER_DENIES/SUCCESSFUL
          mtnReference: response.headers["x-reference-id"] || transactionId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: new Date(Date.now() + 4 * 60 * 1000), // 4 minutes
        });

      return {
        success: true,
        transactionId: transactionId,
        mtnReference: response.headers["x-reference-id"],
        message: `USSD prompt sent to +256${phoneNumber}. Please complete payment on your phone.`,
        expiresIn: 240, // seconds
      };
    } catch (error: any) {
      console.error(
        "Error initiating MTN payment:",
        error.response?.data || error.message,
      );

      // Store failed attempt
      const db = admin.firestore();
      await db
        .collection("mtn_payments")
        .doc(transactionId)
        .set({
          userId: userId,
          phoneNumber: fullPhoneNumber,
          provider: provider,
          amount: amount,
          purpose: purpose,
          transactionId: transactionId,
          status: "failed",
          error: error.response?.data?.message || error.message,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      throw new functions.https.HttpsError(
        "internal",
        `MTN Payment Error: ${error.response?.data?.message || error.message}`,
      );
    }
  },
);

/**
 * Cloud Function: Check MTN Payment Status
 * Polls MTN API to check if user accepted/denied the payment
 */
export const checkMTNPaymentStatus = functions.https.onCall(
  async (
    data: {
      transactionId: string;
    },
    context: functions.https.CallableContext,
  ) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be authenticated to check payment status.",
      );
    }

    // Ensure MTN credentials are configured
    ensureMTNConfig();

    const { transactionId } = data;

    if (!transactionId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Transaction ID is required",
      );
    }

    try {
      // Check payment status from Firestore
      const db = admin.firestore();
      const paymentDoc = await db
        .collection("mtn_payments")
        .doc(transactionId)
        .get();

      if (!paymentDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Payment record not found",
        );
      }

      const paymentData = paymentDoc.data();

      if (paymentData?.userId && paymentData.userId !== context.auth.uid) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You are not allowed to access this payment status.",
        );
      }

      // Check if already successfully processed
      if (paymentData?.status === "successful") {
        return {
          success: true,
          status: "successful",
          message: "Payment completed successfully",
          transactionId,
        };
      }

      // Check if failed/expired
      if (
        paymentData?.status === "failed" ||
        paymentData?.status === "expired" ||
        paymentData?.status === "rejected"
      ) {
        return {
          success: false,
          status: paymentData.status,
          message: paymentData.error || "Payment was not completed",
        };
      }

      // Query MTN API for current status
      const response = await axios.get(
        `${MTN_API_URL}/collection/v1_0/requesttopay/${transactionId}`,
        {
          headers: {
            "X-Reference-Id": transactionId,
            "Ocp-Apim-Subscription-Key": MTN_SUBSCRIPTION_KEY,
            Authorization: `Bearer ${MTN_API_KEY}`,
          },
        },
      );

      const mtnStatus = (response.data as { status?: string })?.status;

      // Update Firestore with current status
      await db
        .collection("mtn_payments")
        .doc(transactionId)
        .update({
          status: mtnStatus?.toLowerCase() || "pending",
          mtnStatus: mtnStatus,
          lastChecked: admin.firestore.FieldValue.serverTimestamp(),
        });

      return {
        success: mtnStatus === "SUCCESSFUL",
        status: mtnStatus?.toLowerCase() || "pending",
        message:
          mtnStatus === "SUCCESSFUL"
            ? "Payment completed successfully"
            : `Payment status: ${mtnStatus}`,
        transactionId,
      };
    } catch (error: any) {
      console.error(
        "Error checking payment status:",
        error.response?.data || error.message,
      );
      throw new functions.https.HttpsError(
        "internal",
        `Failed to check payment status: ${error.message}`,
      );
    }
  },
);

/**
 * Cloud Function: Handle MTN Payment Callback
 * Webhook endpoint that MTN calls when payment is completed
 */
export const mtnPaymentCallback = functions.https.onRequest(
  async (req: functions.https.Request, res: functions.Response) => {
    try {
      const { referenceId, status, amount } = req.body;

      console.log(`Received MTN callback: ${referenceId} - ${status}`);

      // Update payment status in Firestore
      const db = admin.firestore();
      await db
        .collection("mtn_payments")
        .doc(referenceId)
        .update({
          status: status?.toLowerCase() || "unknown",
          callbackReceived: true,
          callbackAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Return success to MTN
      res.status(200).json({
        status: "ok",
        referenceId,
      });
    } catch (error) {
      console.error("Error handling MTN callback:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to process callback",
      });
    }
  },
);

/**
 * Cloud Function: Initiate Real AIRTEL Money Payment
 * Sends USSD prompt to user's phone for AIRTEL payment
 */
export const sendAIRTELPaymentPrompt = functions.https.onCall(
  async (
    data: SendMoMoPaymentRequest,
    context: functions.https.CallableContext,
  ) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be authenticated to initiate payments.",
      );
    }

    const userId = context.auth.uid;

    // Ensure Airtel credentials are configured
    ensureAirtelConfig();

    const { phoneNumber, provider, amount, purpose, transactionId, email } =
      data;

    // Validate inputs
    if (!phoneNumber || !provider || !amount || !transactionId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields",
      );
    }

    // Validate phone number (must be 9-10 digits for Uganda)
    if (!/^\d{9,10}$/.test(phoneNumber)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid phone number format. Use 9-10 digits.",
      );
    }

    const fullPhoneNumber = `256${phoneNumber}`; // AIRTEL format

    try {
      // Create AIRTEL API request payload for push payment
      const requestPayload = {
        reference: transactionId,
        subscriber: {
          country: "UG",
          currency: AIRTEL_CURRENCY,
          msisdn: parseInt(fullPhoneNumber), // Remove + and make it numeric
        },
        transaction: {
          amount: amount,
          country: "UG",
          currency: AIRTEL_CURRENCY,
          id: transactionId,
          type: "MobileMoneyCollection",
        },
      };

      // Make request to AIRTEL API - Push Payment endpoint
      const response = await axios.post(
        `${AIRTEL_API_URL}/merchant/v2/payments/`,
        requestPayload,
        {
          headers: {
            Authorization: `Bearer ${AIRTEL_API_KEY}`,
            "Content-Type": "application/json",
            "X-Country": "UG",
          },
        },
      );

      // Log the payment initiation
      console.log(
        `AIRTEL payment initiated. Reference: ${transactionId}, Phone: ${fullPhoneNumber}`,
      );

      // Store payment record in Firestore
      const db = admin.firestore();
      await db
        .collection("airtel_payments")
        .doc(transactionId)
        .set({
          userId: userId,
          phoneNumber: fullPhoneNumber,
          provider: "airtel",
          amount: amount,
          currency: AIRTEL_CURRENCY,
          purpose: purpose,
          transactionId: transactionId,
          email: email || "unknown@university.ac.ug",
          status: "pending",
          airtelReference:
            (response.data as { id?: string })?.id || transactionId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: new Date(Date.now() + 4 * 60 * 1000), // 4 minutes
        });

      return {
        success: true,
        transactionId: transactionId,
        airtelReference: (response.data as { id?: string })?.id,
        message: `USSD prompt sent to +${fullPhoneNumber}. Please complete payment on your phone.`,
        expiresIn: 240, // seconds
      };
    } catch (error: any) {
      console.error(
        "Error initiating AIRTEL payment:",
        error.response?.data || error.message,
      );

      // Store failed attempt
      const db = admin.firestore();
      await db
        .collection("airtel_payments")
        .doc(transactionId)
        .set({
          userId: userId,
          phoneNumber: fullPhoneNumber,
          provider: "airtel",
          amount: amount,
          purpose: purpose,
          transactionId: transactionId,
          status: "failed",
          error: error.response?.data?.message || error.message,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      throw new functions.https.HttpsError(
        "internal",
        `AIRTEL Payment Error: ${
          error.response?.data?.message || error.message
        }`,
      );
    }
  },
);

/**
 * Cloud Function: Check AIRTEL Payment Status
 * Polls AIRTEL API to check if user accepted/denied the payment
 */
export const checkAIRTELPaymentStatus = functions.https.onCall(
  async (
    data: {
      transactionId: string;
    },
    context: functions.https.CallableContext,
  ) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be authenticated to check payment status.",
      );
    }

    // Ensure Airtel credentials are configured
    ensureAirtelConfig();

    const { transactionId } = data;

    if (!transactionId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Transaction ID is required",
      );
    }

    try {
      // Check payment status from Firestore
      const db = admin.firestore();
      const paymentDoc = await db
        .collection("airtel_payments")
        .doc(transactionId)
        .get();

      if (!paymentDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Payment record not found",
        );
      }

      const paymentData = paymentDoc.data();

      if (paymentData?.userId && paymentData.userId !== context.auth.uid) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You are not allowed to access this payment status.",
        );
      }

      // Check if already successfully processed
      if (paymentData?.status === "successful") {
        return {
          success: true,
          status: "successful",
          message: "Payment completed successfully",
          transactionId,
        };
      }

      // Check if failed/expired
      if (
        paymentData?.status === "failed" ||
        paymentData?.status === "expired" ||
        paymentData?.status === "rejected"
      ) {
        return {
          success: false,
          status: paymentData.status,
          message: paymentData.error || "Payment was not completed",
        };
      }

      // Query AIRTEL API for current status
      const response = await axios.get(
        `${AIRTEL_API_URL}/merchant/v2/payments/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${AIRTEL_API_KEY}`,
            "X-Country": "UG",
          },
        },
      );

      const airtelStatus = (response.data as { status?: string })?.status;

      // Update Firestore with current status
      await db
        .collection("airtel_payments")
        .doc(transactionId)
        .update({
          status: airtelStatus?.toLowerCase() || "pending",
          airtelStatus: airtelStatus,
          lastChecked: admin.firestore.FieldValue.serverTimestamp(),
        });

      return {
        success: airtelStatus === "SuccessfulTransactionStatus",
        status: airtelStatus?.toLowerCase() || "pending",
        message:
          airtelStatus === "SuccessfulTransactionStatus"
            ? "Payment completed successfully"
            : `Payment status: ${airtelStatus}`,
        transactionId,
      };
    } catch (error: any) {
      console.error(
        "Error checking AIRTEL payment status:",
        error.response?.data || error.message,
      );
      throw new functions.https.HttpsError(
        "internal",
        `Failed to check payment status: ${error.message}`,
      );
    }
  },
);

/**
 * Cloud Function: Handle AIRTEL Payment Callback
 * Webhook endpoint that AIRTEL calls when payment is completed
 */
export const airtelPaymentCallback = functions.https.onRequest(
  async (req: functions.https.Request, res: functions.Response) => {
    try {
      const { reference, status, transaction } = req.body;

      console.log(`Received AIRTEL callback: ${reference} - ${status}`);

      // Update payment status in Firestore
      const db = admin.firestore();
      await db
        .collection("airtel_payments")
        .doc(reference)
        .update({
          status: status?.toLowerCase() || "unknown",
          callbackReceived: true,
          callbackAt: admin.firestore.FieldValue.serverTimestamp(),
          airtelTransactionData: transaction,
        });

      // Return success to AIRTEL
      res.status(200).json({
        status: "ok",
        reference,
      });
    } catch (error) {
      console.error("Error handling AIRTEL callback:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to process callback",
      });
    }
  },
);
