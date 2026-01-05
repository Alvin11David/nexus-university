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

// Validate required config early to avoid opaque INTERNAL errors
function ensureMTNConfig() {
  if (!MTN_API_KEY || !MTN_SUBSCRIPTION_KEY || !MTN_COLLECTION_ACCOUNT) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "MTN configuration is missing. Please set mtn.api_key, mtn.subscription_key, and mtn.collection_account in functions config."
    );
  }
}

function ensureAirtelConfig() {
  if (!AIRTEL_API_KEY || !AIRTEL_BUSINESS_ID) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Airtel configuration is missing. Please set airtel.api_key and airtel.business_id in functions config."
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
  async (data: SendMoMoPaymentRequest, context) => {
    // For now, we accept requests without Firebase auth
    // Auth is handled on frontend via Supabase
    // TODO: Implement Supabase auth token verification

    // Ensure MTN credentials are configured
    ensureMTNConfig();

    const { phoneNumber, provider, amount, purpose, transactionId, email } =
      data;

    // Validate inputs
    if (!phoneNumber || !provider || !amount || !transactionId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields"
      );
    }

    // Validate phone number (must be 9-10 digits for Uganda)
    if (!/^\d{9,10}$/.test(phoneNumber)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid phone number format. Use 9-10 digits."
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
        }
      );

      // Log the payment initiation
      console.log(
        `MTN payment initiated. Reference: ${transactionId}, Phone: ${fullPhoneNumber}`
      );

      // Store payment record in Firestore
      const db = admin.firestore();
      const userId = `user-${transactionId}`; // Placeholder until auth is implemented
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
        error.response?.data || error.message
      );

      // Store failed attempt
      const db = admin.firestore();
      const userId = `user-${transactionId}`; // Placeholder until auth is implemented
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
        `MTN Payment Error: ${error.response?.data?.message || error.message}`
      );
    }
  }
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
    context
  ) => {
    // For now, we accept requests without Firebase auth
    // Auth is handled on frontend via Supabase
    // TODO: Implement Supabase auth token verification

    // Ensure MTN credentials are configured
    ensureMTNConfig();

    const { transactionId } = data;

    if (!transactionId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Transaction ID is required"
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
          "Payment record not found"
        );
      }

      const paymentData = paymentDoc.data();

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
        }
      );

      const mtnStatus = response.data?.status;

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
        error.response?.data || error.message
      );
      throw new functions.https.HttpsError(
        "internal",
        `Failed to check payment status: ${error.message}`
      );
    }
  }
);

/**
 * Cloud Function: Handle MTN Payment Callback
 * Webhook endpoint that MTN calls when payment is completed
 */
export const mtnPaymentCallback = functions.https.onRequest(
  async (req, res) => {
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
  }
);

/**
 * Cloud Function: Initiate Real AIRTEL Money Payment
 * Sends USSD prompt to user's phone for AIRTEL payment
 */
export const sendAIRTELPaymentPrompt = functions.https.onCall(
  async (data: SendMoMoPaymentRequest, context) => {
    // For now, we accept requests without Firebase auth
    // Auth is handled on frontend via Supabase
    // TODO: Implement Supabase auth token verification

    // Ensure Airtel credentials are configured
    ensureAirtelConfig();

    const { phoneNumber, provider, amount, purpose, transactionId, email } =
      data;

    // Validate inputs
    if (!phoneNumber || !provider || !amount || !transactionId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields"
      );
    }

    // Validate phone number (must be 9-10 digits for Uganda)
    if (!/^\d{9,10}$/.test(phoneNumber)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid phone number format. Use 9-10 digits."
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
        }
      );

      // Log the payment initiation
      console.log(
        `AIRTEL payment initiated. Reference: ${transactionId}, Phone: ${fullPhoneNumber}`
      );

      // Store payment record in Firestore
      const db = admin.firestore();
      const userId = `user-${transactionId}`; // Placeholder until auth is implemented
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
          airtelReference: response.data?.id || transactionId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: new Date(Date.now() + 4 * 60 * 1000), // 4 minutes
        });

      return {
        success: true,
        transactionId: transactionId,
        airtelReference: response.data?.id,
        message: `USSD prompt sent to +${fullPhoneNumber}. Please complete payment on your phone.`,
        expiresIn: 240, // seconds
      };
    } catch (error: any) {
      console.error(
        "Error initiating AIRTEL payment:",
        error.response?.data || error.message
      );

      // Store failed attempt
      const db = admin.firestore();
      const userId = `user-${transactionId}`; // Placeholder until auth is implemented
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
        }`
      );
    }
  }
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
    context
  ) => {
    // For now, we accept requests without Firebase auth
    // Auth is handled on frontend via Supabase
    // TODO: Implement Supabase auth token verification

    // Ensure Airtel credentials are configured
    ensureAirtelConfig();

    const { transactionId } = data;

    if (!transactionId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Transaction ID is required"
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
          "Payment record not found"
        );
      }

      const paymentData = paymentDoc.data();

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
        }
      );

      const airtelStatus = response.data?.status;

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
        error.response?.data || error.message
      );
      throw new functions.https.HttpsError(
        "internal",
        `Failed to check payment status: ${error.message}`
      );
    }
  }
);

/**
 * Cloud Function: Handle AIRTEL Payment Callback
 * Webhook endpoint that AIRTEL calls when payment is completed
 */
export const airtelPaymentCallback = functions.https.onRequest(
  async (req, res) => {
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
  }
);
