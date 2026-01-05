# CORS Error - Root Cause & Fix

## What Happened

You got this error when pressing "Pay Now":

```
Access to fetch at 'https://africa-south1-universityportal2026.cloudfunctions.net/sendMTNPaymentPrompt'
from origin 'http://localhost:8080' has been blocked by CORS policy
```

## Root Cause: Region Mismatch

### The Issue:

1. **Frontend was configured** to call Cloud Functions in **`africa-south1`** region
2. **But the functions deployed** to **`us-central1`** region
3. When the frontend tried calling the function at `africa-south1-...`, it didn't exist
4. Browser blocked the request as a CORS policy violation

### Why This Happens:

Firebase Cloud Functions deploy to the default region (`us-central1`) unless you explicitly specify another region in the code:

```typescript
// This deploys to us-central1 (default)
export const sendMTNPaymentPrompt = functions.https.onCall(...)

// This would deploy to africa-south1 (if specified)
export const sendMTNPaymentPrompt = functions
  .region('africa-south1')
  .https.onCall(...)
```

## The Fix Applied

### Before ❌

```typescript
// File: src/integrations/firebase/client.ts
export const functions = getFunctions(app, "africa-south1");
```

This told the frontend to look for functions in `africa-south1` region, but they were actually in `us-central1`.

### After ✅

```typescript
// File: src/integrations/firebase/client.ts
export const functions = getFunctions(app, "us-central1");
```

Now the frontend looks in the correct region where the functions actually are.

## What You Need to Do Now

1. **Refresh your browser** (Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`)
2. **Try the payment flow again:**
   - Generate a PRN
   - Click "Pay Now"
   - Select MTN
   - Enter phone number
   - Press "Pay Now" for MTN

## How httpsCallable Works

`httpsCallable()` is a special Firebase SDK function that:

- ✅ Automatically routes to the correct region
- ✅ Automatically includes your authentication token
- ✅ Automatically handles CORS (no need for manual CORS headers)
- ✅ Uses internal Firebase protocol for secure communication

So once the region is correct, everything should work!

## If You Still Get Errors

### Check the Region

```bash
firebase functions:list
```

You should see:

```
sendMTNPaymentPrompt(us-central1)
checkMTNPaymentStatus(us-central1)
mtnPaymentCallback(us-central1)
sendAIRTELPaymentPrompt(us-central1)
checkAIRTELPaymentStatus(us-central1)
airtelPaymentCallback(us-central1)
```

### Check Browser Console

Look for any error messages in DevTools (F12) → Console tab

### Check Firebase Logs

```bash
firebase functions:log
```

Look for error messages from the Cloud Functions showing what went wrong.

## Common Next Steps

1. **Get MTN/AIRTEL credentials** configured in Firebase:

   ```bash
   firebase functions:config:set mtn.api_key="your_key"
   firebase functions:config:set airtel.api_key="your_key"
   ```

2. **Redeploy after setting config:**

   ```bash
   firebase deploy --only functions
   ```

3. **Test the payment flow** with a real phone number

## Summary

| Aspect           | Issue                                         | Solution                                             |
| ---------------- | --------------------------------------------- | ---------------------------------------------------- |
| **Root Cause**   | Region mismatch between frontend and backend  | Updated frontend to use `us-central1` region         |
| **Error Type**   | CORS policy violation (not actual CORS issue) | Just a symptom of calling wrong region               |
| **Fix Location** | `src/integrations/firebase/client.ts`         | Changed region from `africa-south1` to `us-central1` |
| **Next Step**    | Test with browser hard refresh                | `Ctrl+Shift+R` and retry payment                     |
