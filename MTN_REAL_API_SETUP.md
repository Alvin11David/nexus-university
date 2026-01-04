# Real MTN Mobile Money API Integration Guide

This guide walks you through integrating with the **real MTN MoMo API** for Uganda. This provides genuine payment processing directly through MTN Uganda's infrastructure.

## 🎯 What This Integration Does

When a student initiates a payment:

1. **USSD Prompt** appears on their MTN phone instantly
2. They enter their **PIN** on their phone
3. **Real money is deducted** from their MTN account
4. University automatically **confirms** the payment
5. Student gets a **receipt**

## Prerequisites

- MTN Uganda Business Account
- Firebase project (already set up)
- Developer credentials from MTN

## Step 1: Get MTN API Credentials

### Contact MTN Uganda:

- **Business Development:** +256 414 500 000
- **Email:** business@mtn.co.ug
- **Portal:** https://developer.mtn.co.ug

### What You'll Get:

- **API Key** - Authorization credential
- **Subscription Key** (Ocp-Apim-Subscription-Key)
- **Collection Account ID**
- **API Base URL** (usually `https://api.mtn.com/mtn-uapi/v2`)

## Step 2: Add Credentials to Environment Variables

### `.env.local` (Frontend - not used directly):

```env
VITE_MTN_COLLECTION_ACCOUNT=your_account_id
```

### Firebase Environment Variables:

Set these in Firebase Cloud Functions:

```bash
firebase functions:config:set \
  mtn.api_key="your_api_key" \
  mtn.subscription_key="your_subscription_key" \
  mtn.collection_account="your_collection_account" \
  mtn.api_url="https://api.mtn.com/mtn-uapi/v2"
```

Or in Firebase Console:

1. Go to **Cloud Functions** → **Runtime environment variables**
2. Add the above key-value pairs

## Step 3: Update functions/.env

Create `functions/.env`:

```env
MTN_API_KEY=your_api_key
MTN_SUBSCRIPTION_KEY=your_subscription_key
MTN_COLLECTION_ACCOUNT=your_collection_account
MTN_API_URL=https://api.mtn.com/mtn-uapi/v2
CLOUD_FUNCTION_URL=https://your-project-region-yourproject.cloudfunctions.net
```

## Step 4: Install Dependencies

The functions already depend on `axios` for HTTP requests. Ensure it's installed:

```bash
cd functions
npm install
```

## Step 5: Deploy Cloud Functions

```bash
# Build functions
npm run build --prefix functions

# Deploy to Firebase
firebase deploy --only functions
```

## Step 6: Set Up Webhook Callback URL

MTN will call your webhook when payments complete:

1. In Firebase Console, find the `mtnPaymentCallback` function
2. Get the HTTPS trigger URL
3. Register it in MTN Developer Portal as your callback endpoint
4. Format: `https://your-region-yourproject.cloudfunctions.net/mtnPaymentCallback`

## Step 7: Test the Integration

### Test with MTN Sandbox (if available):

```bash
# 1. Start development server
npm run dev

# 2. Navigate to Payments → Generate PRN
# 3. Select "Mobile Money" payment method
# 4. Choose "MTN"
# 5. Enter test MTN number (from MTN developer docs)
# 6. You should see USSD prompt on your phone
```

### Test with Real MTN (Production):

1. Ensure your MTN business account is configured for payments
2. Test with actual MTN numbers
3. Verify amounts are deducted and credited correctly

## How It Works - Technical Flow

### 1. User Initiates Payment

```
User Phone Number → Cloud Function sendMTNPaymentPrompt()
```

### 2. MTN API Request

```typescript
POST /collection/v1_0/requesttopay
{
  "amount": 2500000,
  "currency": "UGX",
  "externalId": "MOMO-MTN-1234567890-123",
  "payer": {
    "partyIdType": "MSISDN",
    "partyId": "256701234567"  // User's phone
  },
  "payerMessage": "Payment for Tuition Fees",
  "payeeNote": "Nexus University - Tuition Fees",
  "description": "University Payment - Tuition Fees"
}
```

### 3. USSD Prompt

- User receives USSD popup on phone
- Enters PIN to confirm
- MTN deducts money

### 4. Status Polling

```
Frontend → checkMTNPaymentStatus() every 3 seconds
↓
Cloud Function queries MTN API
↓
Updates Firestore with status
↓
Frontend detects "successful" → confirms payment
```

### 5. Callback Webhook

```
MTN → mtnPaymentCallback()
Updates Firestore with final status
```

## Firestore Collections

### `mtn_payments`

```json
{
  "userId": "auth_user_id",
  "phoneNumber": "256701234567",
  "provider": "MTN",
  "amount": 2500000,
  "currency": "UGX",
  "purpose": "Tuition Fees",
  "transactionId": "MOMO-MTN-1234567890-123",
  "status": "successful", // pending | successful | failed | expired | rejected
  "mtnStatus": "SUCCESSFUL",
  "mtnReference": "reference_from_mtn",
  "createdAt": "timestamp",
  "expiresAt": "timestamp",
  "callbackReceived": true,
  "callbackAt": "timestamp"
}
```

## API Response Codes

| Status     | Meaning           | Action                        |
| ---------- | ----------------- | ----------------------------- |
| PENDING    | Waiting for user  | Show waiting prompt           |
| SUCCESSFUL | Payment completed | Update database, show success |
| FAILED     | User rejected     | Show error message            |
| EXPIRED    | 4-minute timeout  | Prompt user to try again      |
| REJECTED   | MTN rejected      | Contact support message       |

## Troubleshooting

### USSD Prompt Not Appearing

- **Issue:** Phone not registered with MTN or account insufficient balance
- **Solution:** Verify phone with MTN, check balance, try another number

### API Authentication Fails

- **Issue:** Wrong API Key or Subscription Key
- **Solution:** Verify credentials in Firebase console, request new ones from MTN

### Callback Not Received

- **Issue:** Webhook URL incorrect or MTN can't reach your server
- **Solution:** Verify URL is publicly accessible, check Firebase logs

### Payment Status Always Pending

- **Issue:** Polling timeout or MTN API delay
- **Solution:** Wait up to 4 minutes, MTN takes time to process
- **Long-term:** Implement webhook to avoid polling

### Permission Denied Errors

- **Issue:** Firestore security rules don't allow payment updates
- **Solution:** Update Firestore rules to allow payment collection writes

## Firestore Security Rules

Update your Firestore rules in `supabase/firestore.rules`:

```firestore
match /mtn_payments/{transactionId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow create: if request.auth.uid != null;
  allow update: if request.auth.uid == resource.data.userId ||
                   request.auth.token.email.endsWith('@admin');
}

match /payments/{paymentId} {
  allow read: if request.auth.uid == resource.data.student_id;
  allow write: if request.auth.uid == resource.data.student_id ||
                   request.auth.token.email.endsWith('@admin');
}
```

## Best Practices

✅ **DO:**

- Validate phone numbers before API calls
- Log all payment attempts for auditing
- Set up rate limiting to prevent abuse
- Monitor Firebase functions quota
- Use webhook callbacks instead of polling in production
- Keep API credentials in environment variables
- Test with sandbox first if available

❌ **DON'T:**

- Expose API keys in frontend code
- Store credentials in GitHub
- Trust user input without validation
- Process payments without authentication
- Ignore MTN error messages
- Leave functions running indefinitely

## Cost Considerations

- **Per Transaction:** ~0.5% + flat fee (negotiate with MTN)
- **API Calls:** Firebase Cloud Functions free tier covers most usage
- **Firestore:** Minimal reads/writes
- **Monitor:** Set Firebase billing alerts

## Going to Production

1. **Switch to Production API URL** - MTN will provide
2. **Test thoroughly** with real payments
3. **Set up monitoring** - Error tracking, payment logs
4. **Add admin dashboard** - View all payment attempts
5. **Implement rate limiting** - Prevent spam
6. **Add receipts/emails** - Send payment confirmations
7. **Backup payment logs** - Daily exports to Cloud Storage
8. **Monitor compliance** - Uganda telecom regulations

## Support Resources

- **MTN Developer Docs:** https://developer.mtn.co.ug/docs
- **MTN Support:** +256 414 500 000
- **Firebase Cloud Functions Docs:** https://firebase.google.com/docs/functions
- **Uganda National Telecom:** https://www.nra.go.ug/

## Questions?

If you encounter issues:

1. Check Firebase Cloud Functions logs
2. Verify MTN API credentials
3. Test with curl/Postman before blaming frontend
4. Check Firestore collection for data
5. Contact MTN developer support

---

**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Production-Ready
