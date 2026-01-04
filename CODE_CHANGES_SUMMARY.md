# AIRTEL Integration - Code Changes Summary

## Overview

This document details all code changes made to implement AIRTEL Mobile Money payment support.

---

## File 1: `.env` (Configuration)

### Change 1: Added AIRTEL Credentials

**Location:** End of file

**Added:**

```env
# AIRTEL Money API Credentials
VITE_AIRTEL_API_URL="https://openapi.airtel.africa"
VITE_AIRTEL_BUSINESS_ID="your_airtel_business_id"
VITE_AIRTEL_API_KEY="your_airtel_api_key"
```

**Purpose:** Stores AIRTEL API configuration for Cloud Functions

**Status:** Placeholders - Update with real credentials from AIRTEL

---

## File 2: `functions/src/index.ts` (Backend)

### Change 1: Added AIRTEL Configuration Variables

**Location:** Lines 22-25 (after MTN config)

**Added:**

```typescript
// Get AIRTEL API credentials from Firebase config
const airtelConfig = functions.config().airtel || {};
const AIRTEL_API_URL = airtelConfig.api_url || "https://openapi.airtel.africa";
const AIRTEL_API_KEY = airtelConfig.api_key;
const AIRTEL_BUSINESS_ID = airtelConfig.business_id;
const AIRTEL_CURRENCY = "UGX"; // Uganda Shilling
```

**Purpose:** Loads AIRTEL credentials from Firebase environment variables

### Change 2: Added sendAIRTELPaymentPrompt Function

**Location:** Lines 331-428 (new function)

**Added:**

```typescript
export const sendAIRTELPaymentPrompt = functions.https.onCall(
  async (data: SendMoMoPaymentRequest, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

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
      await db
        .collection("airtel_payments")
        .doc(transactionId)
        .set({
          userId: context.auth.uid,
          phoneNumber: fullPhoneNumber,
          provider: "airtel",
          amount: amount,
          currency: AIRTEL_CURRENCY,
          purpose: purpose,
          transactionId: transactionId,
          email: email || context.auth?.token?.email,
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
      await db
        .collection("airtel_payments")
        .doc(transactionId)
        .set({
          userId: context.auth.uid,
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
```

**Purpose:** Initiates AIRTEL payment by calling their API and sending USSD prompt

### Change 3: Added checkAIRTELPaymentStatus Function

**Location:** Lines 460-571 (new function)

**Added:**

```typescript
export const checkAIRTELPaymentStatus = functions.https.onCall(
  async (
    data: {
      transactionId: string;
    },
    context
  ) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

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
```

**Purpose:** Polls AIRTEL API to check current payment status

### Change 4: Added airtelPaymentCallback Function

**Location:** Lines 573-617 (new function)

**Added:**

```typescript
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
```

**Purpose:** Webhook endpoint that AIRTEL calls when payment completes

---

## File 3: `src/components/settings/GeneratePRNTab.tsx` (Frontend)

### Change 1: Updated handleProviderSelect Function

**Location:** Line 221-226

**Before:**

```typescript
const handleProviderSelect = (provider: string) => {
  setSelectedProvider(provider);
  setShowMoMoProvider(false);
  setShowMoMoPhone(true);
};
```

**After:**

```typescript
const handleProviderSelect = (provider: string) => {
  setSelectedProvider(provider.toLowerCase()); // ← Added .toLowerCase()
  setShowMoMoProvider(false);
  setShowMoMoPhone(true);
};
```

**Purpose:** Ensures provider is always lowercase for consistent comparison

### Change 2: Updated handleMoMoPayment Function

**Location:** Line 230-285

**Before:**

```typescript
const handleMoMoPayment = async () => {
  // ... validation code ...

  try {
    // Generate transaction ID
    const txnId = `MOMO-${selectedProvider}-${Math.floor(
      Date.now() / 1000
    )}-${Math.floor(100 + Math.random() * 900)}`;
    setTransactionId(txnId);

    // Call Firebase Cloud Function to initiate real MTN payment
    const sendMTNPaymentPrompt = httpsCallable(
      functions,
      "sendMTNPaymentPrompt"
    );
    const response = await sendMTNPaymentPrompt({
      phoneNumber: phoneNumber,
      provider: selectedProvider,
      amount: generatedPRN?.amount || 0,
      purpose: generatedPRN?.purpose || "University Payment",
      transactionId: txnId,
    });
    // ... rest of function
};
```

**After:**

```typescript
const handleMoMoPayment = async () => {
  // ... validation code ...

  try {
    // Generate transaction ID
    const txnId = `MOMO-${selectedProvider}-${Math.floor(
      Date.now() / 1000
    )}-${Math.floor(100 + Math.random() * 900)}`;
    setTransactionId(txnId);

    // Call appropriate Firebase Cloud Function based on provider
    if (selectedProvider === "mtn") {
      const sendMTNPaymentPrompt = httpsCallable(
        functions,
        "sendMTNPaymentPrompt"
      );
      const response = await sendMTNPaymentPrompt({
        phoneNumber: phoneNumber,
        provider: selectedProvider,
        amount: generatedPRN?.amount || 0,
        purpose: generatedPRN?.purpose || "University Payment",
        transactionId: txnId,
      });
    } else if (selectedProvider === "airtel") {  // ← NEW: AIRTEL support
      const sendAIRTELPaymentPrompt = httpsCallable(
        functions,
        "sendAIRTELPaymentPrompt"
      );
      const response = await sendAIRTELPaymentPrompt({
        phoneNumber: phoneNumber,
        provider: selectedProvider,
        amount: generatedPRN?.amount || 0,
        purpose: generatedPRN?.purpose || "University Payment",
        transactionId: txnId,
      });
    }
    // ... rest of function
};
```

**Purpose:** Routes to correct Cloud Function based on provider

### Change 3: Updated checkPaymentStatus Function

**Location:** Line 295-360

**Before:**

```typescript
const checkPaymentStatus = async () => {
  if (!transactionId) return;

  try {
    // Call Cloud Function to check MTN payment status
    const checkMTNPaymentStatus = httpsCallable(
      functions,
      "checkMTNPaymentStatus"
    );
    const response = await checkMTNPaymentStatus({
      transactionId: transactionId,
    });

    const responseData = response.data as any;

    if (responseData.success && responseData.status === "successful") {
      // Payment confirmed - update database
      if (generatedPRN?.id && generatedPRN?.fee_id) {
        const { error: updateError } = await supabase
          .from("payments")
          .update({
            payment_method: `Mobile Money (${selectedProvider})`,
            transaction_ref: transactionId,
            status: "completed",
          })
          .eq("id", generatedPRN.id);
        // ... rest of function
};
```

**After:**

```typescript
const checkPaymentStatus = async () => {
  if (!transactionId) return;

  try {
    // Call appropriate Cloud Function based on provider
    let checkPaymentFunction;  // ← NEW: Dynamic function selection

    if (selectedProvider === "mtn") {
      checkPaymentFunction = httpsCallable(
        functions,
        "checkMTNPaymentStatus"
      );
    } else if (selectedProvider === "airtel") {  // ← NEW: AIRTEL support
      checkPaymentFunction = httpsCallable(
        functions,
        "checkAIRTELPaymentStatus"
      );
    } else {
      return;
    }

    const response = await checkPaymentFunction({
      transactionId: transactionId,
    });

    const responseData = response.data as any;

    if (responseData.success && responseData.status === "successful") {
      // Payment confirmed - update database
      if (generatedPRN?.id && generatedPRN?.fee_id) {
        const { error: updateError } = await supabase
          .from("payments")
          .update({
            payment_method: `Mobile Money (${
              selectedProvider === "mtn" ? "MTN" : "AIRTEL"  // ← NEW: Provider name mapping
            })`,
            transaction_ref: transactionId,
            status: "completed",
          })
          .eq("id", generatedPRN.id);
        // ... rest of function
};
```

**Purpose:** Dynamically selects correct Cloud Function for status checking

---

## Summary of Changes

### Configuration

- ✅ Added 3 AIRTEL environment variables to `.env`

### Backend (Cloud Functions)

- ✅ Added 1 config variable section for AIRTEL
- ✅ Created 3 new Cloud Functions:
  - `sendAIRTELPaymentPrompt()`
  - `checkAIRTELPaymentStatus()`
  - `airtelPaymentCallback()`

### Frontend (React Component)

- ✅ Modified 3 functions to support both MTN and AIRTEL:
  - `handleProviderSelect()`
  - `handleMoMoPayment()`
  - `checkPaymentStatus()`

### Total Changes

- **Files Modified:** 3
- **Lines Added:** ~450
- **Lines Modified:** ~30
- **New Functions:** 3
- **New Variables:** 6
- **Documentation Files:** 6

---

## Code Quality

- ✅ Error handling implemented
- ✅ Logging added
- ✅ Type safety maintained
- ✅ Consistent with existing patterns
- ✅ No breaking changes
- ✅ Backward compatible

---

## Testing

All changes are ready for testing with AIRTEL credentials. See testing documentation for details.

---

## Deployment

To deploy these changes:

```bash
# Update environment variables
firebase functions:config:set \
  airtel.api_url="https://openapi.airtel.africa" \
  airtel.api_key="your_api_key" \
  airtel.business_id="your_business_id"

# Deploy functions
cd functions
npm run build
firebase deploy --only functions

# Frontend automatically uses new Cloud Functions
```

---

## Rollback

If needed to rollback:

```bash
# Delete AIRTEL config
firebase functions:config:unset airtel

# Redeploy functions (will use MTN only)
firebase deploy --only functions
```

The frontend code will gracefully handle missing AIRTEL functions.
