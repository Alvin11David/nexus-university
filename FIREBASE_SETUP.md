# Firebase Setup Guide for MTN MoMo Payment Integration

Complete setup instructions for deploying your MTN payment system to Firebase.

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project created at https://console.firebase.google.com
- Active MTN API credentials (API Key, Subscription Key, Collection Account)
- Cloud Functions API enabled in your Firebase project

## Step 1: Initialize Firebase Project

If you haven't done this yet:

```bash
cd c:\Users\ALVIN\nexus-university

# Login to Firebase
firebase login

# List your Firebase projects
firebase projects:list

# Set your project (replace with your project ID)
firebase use your-project-id
```

## Step 2: Enable Required Services

Go to [Firebase Console](https://console.firebase.google.com):

1. Select your project
2. Enable these services:
   - **Cloud Functions** → Enable API
   - **Cloud Firestore** → Create Database
   - **Realtime Database** (optional)

## Step 3: Configure Environment Variables

### Option A: Using Firebase CLI (Recommended)

```bash
# Navigate to functions directory
cd c:\Users\ALVIN\nexus-university\functions

# Set MTN API credentials
firebase functions:config:set \
  mtn.api_url="https://api.mtn.com/v2" \
  mtn.api_key="your_actual_api_key_here" \
  mtn.subscription_key="your_actual_subscription_key_here" \
  mtn.collection_account="your_actual_collection_account_id_here"
```

### Option B: Using .env File

Create `functions/.env.local`:

```env
MTN_API_URL=https://api.mtn.com/v2
MTN_API_KEY=your_actual_api_key_here
MTN_SUBSCRIPTION_KEY=your_actual_subscription_key_here
MTN_COLLECTION_ACCOUNT=your_actual_collection_account_id_here
```

Then update `functions/src/index.ts` to load from .env:

```typescript
import dotenv from "dotenv";
dotenv.config();

const MTN_API_URL = process.env.MTN_API_URL || "https://api.mtn.com/v2";
const MTN_API_KEY = process.env.MTN_API_KEY;
const MTN_SUBSCRIPTION_KEY = process.env.MTN_SUBSCRIPTION_KEY;
const MTN_COLLECTION_ACCOUNT = process.env.MTN_COLLECTION_ACCOUNT;
```

### Option C: Firebase Console GUI

1. Go to Firebase Console → Your Project
2. Click **Functions** in left sidebar
3. Click **Runtime environment variables** tab
4. Add each variable:
   - Key: `mtn_api_url` | Value: `https://api.mtn.com/v2`
   - Key: `mtn_api_key` | Value: `your_key`
   - Key: `mtn_subscription_key` | Value: `your_key`
   - Key: `mtn_collection_account` | Value: `your_account_id`

## Step 4: Install Dependencies

```bash
cd c:\Users\ALVIN\nexus-university\functions

# Install required packages
npm install

# Verify these are installed:
# - firebase-functions
# - firebase-admin
# - axios
# - dotenv (if using .env)

npm list | grep -E "firebase-functions|firebase-admin|axios"
```

## Step 5: Build Cloud Functions

```bash
cd c:\Users\ALVIN\nexus-university\functions

# Compile TypeScript to JavaScript
npm run build

# You should see no errors
# Check that dist/ folder is created with .js files
```

## Step 6: Deploy to Firebase

```bash
cd c:\Users\ALVIN\nexus-university

# Deploy only Cloud Functions (faster)
firebase deploy --only functions

# OR deploy everything (functions + hosting)
firebase deploy

# Wait for deployment to complete
# You'll see output like:
# ✓ functions[sendMTNPaymentPrompt] deployed successfully
# ✓ functions[checkMTNPaymentStatus] deployed successfully
# ✓ functions[mtnPaymentCallback] deployed successfully
```

## Step 7: Verify Deployment

### Check Firebase Console

1. Go to Firebase Console → Your Project
2. Click **Cloud Functions**
3. You should see three functions:
   - `sendMTNPaymentPrompt`
   - `checkMTNPaymentStatus`
   - `mtnPaymentCallback`

### Check Function Logs

```bash
# View logs for sendMTNPaymentPrompt function
firebase functions:log --only sendMTNPaymentPrompt

# View logs for all functions
firebase functions:log
```

### Test Function (via CLI)

```bash
firebase functions:call sendMTNPaymentPrompt \
  --data '{"phoneNumber":"256701234567","provider":"MTN","amount":50000,"purpose":"Test"}'
```

## Step 8: Set Up Firestore Security Rules

Go to Firebase Console → Firestore Database → Rules tab

Update with these rules:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Allow anyone authenticated to read their own payments
    match /mtn_payments/{transactionId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid != null;
      allow update: if request.auth.uid == resource.data.userId ||
                       request.auth.token.email.endsWith('@admin.nexus.edu');
    }

    // Allow payment updates from Cloud Functions
    match /payments/{paymentId} {
      allow read: if request.auth.uid == resource.data.student_id;
      allow create: if request.auth.uid != null;
      allow update: if request.auth.uid == resource.data.student_id ||
                       request.auth.token.email.endsWith('@admin');
    }

    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Click **Publish** to apply.

## Step 9: Connect Frontend to Cloud Functions

Your `src/integrations/firebase/client.ts` should have:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  // Your Firebase config from console
  projectId: "your-project-id",
  // ... other config
};

const app = initializeApp(firebaseConfig);

// Connect to Cloud Functions
const functions = getFunctions(app, 'africa-south1'); // or your region

if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

export { app, getAuth(app), functions, getFirestore(app) };
```

## Step 10: Whitelist Webhook URL

Get your webhook URL after deployment:

```bash
# After firebase deploy completes, note the mtnPaymentCallback URL
# It will look like: https://region-projectid.cloudfunctions.net/mtnPaymentCallback
```

Register this URL in MTN Developer Portal as your callback endpoint.

## Step 11: Test End-to-End

```bash
# 1. Start development server
npm run dev

# 2. Navigate to: http://localhost:5173
# 3. Go to Payments → Generate PRN
# 4. Select Mobile Money → MTN
# 5. Enter test number (from MTN docs)
# 6. Should see USSD prompt on phone
# 7. Complete payment on phone
# 8. Check Firebase Firestore for mtn_payments collection
# 9. Verify payment status updated to "successful"
```

## Common Issues & Solutions

### Issue: "Functions not deploying"

```bash
# Solution: Check if functions build is OK
cd functions && npm run build

# Check for TypeScript errors
npm run build -- --listFiles
```

### Issue: "Environment variables not found"

```bash
# Make sure you set them via CLI
firebase functions:config:get

# Should output your MTN config
```

### Issue: "Cannot call Cloud Function from frontend"

```typescript
// Add this to your function call
import { Functions, connectFunctionsEmulator } from "firebase/functions";

// If you're in development, enable emulator
if (process.env.NODE_ENV === "development") {
  connectFunctionsEmulator(functions, "localhost", 5001);
}
```

### Issue: "Firestore writes failing"

```
// Check rules in Firebase Console
// Make sure userId matches auth.uid
// Check collection names match exactly
```

## Local Testing with Emulator (Optional)

```bash
# Start Firebase emulator
firebase emulators:start

# In another terminal, deploy to emulator
firebase deploy --only functions

# Run tests
npm test
```

## Monitoring & Debugging

### View Function Logs

```bash
firebase functions:log
```

### View Errors

```bash
firebase functions:log --only sendMTNPaymentPrompt
```

### Check Firestore Data

Firebase Console → Firestore Database → Browse Collections

## Production Checklist

- [ ] MTN API credentials are valid and in environment variables
- [ ] Firestore security rules are updated
- [ ] Webhook URL is registered with MTN
- [ ] Error logging is set up
- [ ] Rate limiting is configured
- [ ] Payment timeout is set (4 minutes)
- [ ] Audit logs are enabled
- [ ] Billing alerts are configured in Firebase
- [ ] Tested with real MTN numbers
- [ ] Tested with real payment amounts

## Billing

Firebase Cloud Functions free tier includes:

- 2M invocations/month
- 400,000 GB-seconds/month
- Plenty for a university payment system

Monitor at: Firebase Console → Billing

## Next Steps

1. Get MTN API credentials
2. Run `firebase functions:config:set` with actual credentials
3. Run `firebase deploy --only functions`
4. Test with real phone number
5. Register webhook URL with MTN
6. Monitor logs and adjust as needed

## Support

- **Firebase Docs:** https://firebase.google.com/docs/functions
- **Firebase CLI Docs:** https://firebase.google.com/docs/cli
- **MTN API Docs:** https://developer.mtn.co.ug
- **Firestore Rules:** https://firebase.google.com/docs/firestore/security

---

**Version:** 1.0  
**Last Updated:** January 4, 2026
