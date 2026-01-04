# SMS Integration Setup Guide - MTN/Airtel MoMo Payments

This guide walks you through setting up real SMS notifications for MTN MoMo and Airtel Money payments using Firebase Cloud Functions and Twilio.

## Overview

When a user initiates an MTN/Airtel payment:

1. They enter their phone number
2. A **real SMS is sent** to their phone asking them to enter their PIN
3. They enter the PIN in the browser
4. The payment is confirmed and processed

## Prerequisites

- Firebase project set up (already done at nexus-university)
- Node.js installed
- Twilio account (free trial available)

## Step 1: Set Up Twilio Account

1. Go to [https://www.twilio.com/console](https://www.twilio.com/console)
2. Sign up for a free Twilio account
3. Verify your phone number
4. Get your **Account SID** and **Auth Token** from the dashboard
5. Get a Twilio phone number (you'll need to verify this for sending SMS)

**Note:** Free Twilio accounts can only send SMS to verified numbers. For production, upgrade your account.

## Step 2: Update Environment Variables

Add your Twilio credentials to `.env.local`:

```env
VITE_FIREBASE_API_KEY="AIzaSyA-xugaUp-q-ckorpS9STvSqukTVXeB3TA"
VITE_FIREBASE_AUTH_DOMAIN="universityportal2026.firebaseapp.com"n
VITE_FIREBASE_PROJECT_ID="universityportal2026"
VITE_FIREBASE_STORAGE_BUCKET="universityportal2026.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="464773454654"
VITE_FIREBASE_APP_ID="1:464773454654:web:c3507664d238461bebaa6f"
VITE_USE_FIREBASE_EMULATOR=false

# Twilio Credentials (for Cloud Functions)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+your_twilio_phone_number
```

## Step 3: Install Cloud Functions Dependencies

```bash
cd functions
npm install
cd ..
```

## Step 4: Deploy Cloud Functions

```bash
# Build functions
npm run build --prefix functions

# Deploy to Firebase
firebase deploy --only functions
```

Or use the convenient npm scripts:

```bash
npm run build-functions
npm run deploy-functions
```

## Step 5: Set Up Firebase Environment Variables

Set the Twilio environment variables in Firebase:

```bash
firebase functions:config:set twilio.account_sid="your_account_sid" twilio.auth_token="your_auth_token" twilio.phone_number="+your_phone"

# Or set them in the Firebase Console -> Cloud Functions -> Runtime Environment Variables
```

## Step 6: Update firebase.json

Make sure your `firebase.json` includes the functions config:

```json
{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log"
      ]
    }
  ],
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## Step 7: Test the Integration

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Navigate to the Payments page and Generate PRN

3. Select Mobile Money → MTN/Airtel → Enter phone number

4. Click "Pay Now"

5. Check your verified phone number for an SMS!

6. Enter the 4-digit PIN shown in the browser prompt

7. Payment confirmed! ✅

## Cloud Function Details

### `sendMoMoSms()`

- **Triggered:** When user clicks "Pay Now" on phone number entry
- **Does:** Sends SMS via Twilio with payment details
- **Returns:** SMS SID for tracking
- **Stored:** SMS logs in Firestore for audit trail

### `verifyMoMoPin()`

- **Triggered:** When user enters PIN and clicks "Confirm"
- **Does:** Verifies PIN (currently accepts any 4-digit PIN)
- **Updates:** Payment status in Firestore and Supabase
- **Returns:** Confirmation message

## Firestore Collections Created

### `sms_logs`

Stores records of all SMS sent:

```
{
  userId: string
  phoneNumber: string
  provider: "MTN" | "AIRTEL"
  amount: number
  purpose: string
  transactionId: string
  smsSid: string (Twilio)
  status: "sent" | "verified" | "failed"
  timestamp: Timestamp
  pinAttempts: number (optional)
  lastPinAttempt: Timestamp (optional)
}
```

## Troubleshooting

### SMS Not Received

- **Issue:** Free Twilio accounts need verified phone numbers
- **Solution:** Add recipient phone numbers in Twilio Console → Verified Caller IDs

### Function Deployment Fails

- **Issue:** Missing environment variables
- **Solution:** Run `firebase functions:config:get` to check, then set with `firebase functions:config:set`

### CORS Errors

- **Issue:** Cloud Functions not accessible from frontend
- **Solution:** Ensure functions are deployed and using `httpsCallable`

### PIN Verification Fails

- **Issue:** smsSid not matching
- **Solution:** Ensure smsSid is stored and passed correctly between functions

## Next Steps

1. **Integrate with MTN/Airtel API:** Replace PIN verification simulation with real API calls
2. **Add Transaction Tracking:** Create admin dashboard to view all payment attempts
3. **Rate Limiting:** Add Firebase rate limiting for SMS to prevent abuse
4. **Multi-language SMS:** Customize SMS messages per provider/language
5. **Webhook Handler:** Set up webhooks for delivery receipts from Twilio

## Important Notes

⚠️ **Security:**

- Never expose Twilio credentials in frontend code
- Always use environment variables
- Verify users before sending SMS
- Rate limit SMS sending to prevent abuse
- Log all payment attempts for compliance

⚠️ **Cost:**

- Twilio charges for SMS (~$0.0075 USD per SMS in Uganda)
- Monitor usage in Twilio console
- Set up billing alerts

⚠️ **Compliance:**

- Ensure compliance with Uganda's telecom regulations
- Keep audit logs of all payments
- Implement proper error handling and logging

## Useful Resources

- [Firebase Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Twilio SMS API Documentation](https://www.twilio.com/docs/sms)
- [Firebase Environment Configuration](https://firebase.google.com/docs/functions/config-env)
- [Uganda Mobile Money Regulations](https://www.nra.go.ug/)

---

Need help? Check the console logs and Firebase error messages for detailed debugging information.
