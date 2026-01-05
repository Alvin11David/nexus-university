# CORS Error Fix Guide

## Error You're Seeing

```
Access to fetch at 'https://africa-south1-universityportal2026.cloudfunctions.net/sendMTNPaymentPrompt'
from origin 'http://localhost:8080' has been blocked by CORS policy
```

## Root Causes

### 1. **Cloud Functions Not Deployed**

The most common cause. The function doesn't exist at that URL yet.

**Fix:**

```bash
# Navigate to functions directory
cd functions

# Build TypeScript
npm run build

# Deploy to Firebase
firebase deploy --only functions
```

### 2. **Authentication Token Missing**

`httpsCallable()` requires the user to be authenticated.

**Fix:** Ensure user is logged in before calling the function:

```typescript
// Check if user exists
if (!user) {
  throw new Error("User must be logged in");
}
```

### 3. **Function Region Mismatch**

Your frontend specifies `africa-south1` region but function might be in different region.

**Verify in your code:**

```typescript
// File: src/integrations/firebase/client.ts
export const functions = getFunctions(app, "africa-south1");
```

This must match the region where you deploy the functions.

## Step-by-Step Fix

### Step 1: Check if Functions are Built

```bash
cd c:\Users\ALVIN\nexus-university\functions
ls lib/
```

You should see `index.js` and `index.d.ts`

### Step 2: Build the Functions

```bash
cd c:\Users\ALVIN\nexus-university\functions
npm run build
```

### Step 3: Deploy to Firebase

```bash
firebase deploy --only functions
```

**Expected output:**

```
✔  Deploy complete!

Function URL: https://africa-south1-universityportal2026.cloudfunctions.net/sendMTNPaymentPrompt
Function URL: https://africa-south1-universityportal2026.cloudfunctions.net/checkMTNPaymentStatus
...
```

### Step 4: Verify Deployment

```bash
firebase functions:list
```

You should see all 6 functions:

- sendMTNPaymentPrompt
- checkMTNPaymentStatus
- mtnPaymentCallback
- sendAIRTELPaymentPrompt
- checkAIRTELPaymentStatus
- airtelPaymentCallback

### Step 5: Test from Frontend

1. Ensure you're logged in (AuthContext)
2. Generate a PRN
3. Click "Pay Now" button
4. Select MTN
5. Enter phone number and press "Pay Now"

## Why httpsCallable() Works

`httpsCallable()` is the **correct way** to call Cloud Functions from Firebase SDK. It:

- ✅ Automatically handles CORS
- ✅ Automatically includes authentication token
- ✅ Uses internal Firebase protocol (not plain HTTP)
- ✅ Works from any origin (localhost, production, etc.)

## Verification Checklist

- [ ] Cloud Functions deployed: `firebase functions:list`
- [ ] Firebase project ID is correct in `.env`
- [ ] User is authenticated before calling payment function
- [ ] Function region is `africa-south1` (matches frontend config)
- [ ] `.env` file has all Firebase config variables
- [ ] Cloud Functions have MTN/AIRTEL credentials set:
  ```bash
  firebase functions:config:get
  ```

## Still Getting Errors?

### Check Firebase Logs

```bash
firebase functions:log
```

Look for error messages from the Cloud Functions.

### Check Console Errors

In browser DevTools:

1. Open Console tab
2. Look for detailed error message
3. Check if function is being called at all

### Common Issues:

| Error                        | Solution                                            |
| ---------------------------- | --------------------------------------------------- |
| `User must be authenticated` | Ensure user is logged in                            |
| `Missing required fields`    | Check phoneNumber, amount, transactionId are passed |
| `Internal error`             | Check Firebase logs and MTN/AIRTEL API credentials  |
| `Cannot find module`         | Run `npm run build` in functions directory          |
