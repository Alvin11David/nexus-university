# AIRTEL Mobile Money API Integration Guide

Complete setup instructions for integrating AIRTEL Money payments into your Nexus University Portal.

## 🎯 What This Integration Does

When a student selects AIRTEL Money and initiates a payment:

1. **USSD Prompt** appears on their AIRTEL phone instantly
2. They enter their **PIN** on their phone
3. **Real money is deducted** from their AIRTEL Money account
4. University automatically **confirms** the payment
5. Student gets a **receipt**

## Prerequisites

- AIRTEL Uganda Business Account
- Firebase project (already set up)
- Developer credentials from AIRTEL
- Cloud Functions API enabled in Firebase

## Step 1: Get AIRTEL API Credentials

### Contact AIRTEL Uganda:

- **Business Support:** +256 701 000 000 or +256 456 000 000
- **Email:** business@airtel.ug
- **Portal:** https://developer.airtel.africa
- **Developer Dashboard:** https://merchantportal.airtel.ug

### What You'll Get:

- **API Key** - Authorization credential
- **Business ID** - Your merchant identifier
- **API Base URL** - Usually `https://openapi.airtel.africa`
- **Client ID & Secret** (if using OAuth)
- **Webhook Callback URL** - For payment confirmations

### Test Credentials (Development):

AIRTEL provides sandbox/test environment:

- Test API Key: (provided by AIRTEL)
- Test Business ID: (provided by AIRTEL)
- Test Base URL: `https://sandbox.openapi.airtel.africa` (if available)

## Step 2: Add Credentials to Environment Variables

Your `.env` file already has placeholders. Update them with your actual AIRTEL credentials:

```env
VITE_AIRTEL_API_URL="https://openapi.airtel.africa"
VITE_AIRTEL_BUSINESS_ID="your_business_id"
VITE_AIRTEL_API_KEY="your_api_key"
```

## Step 3: Set Firebase Cloud Functions Environment Variables

Set AIRTEL credentials in Firebase Cloud Functions:

```bash
firebase functions:config:set \
  airtel.api_url="https://openapi.airtel.africa" \
  airtel.api_key="your_api_key" \
  airtel.business_id="your_business_id"
```

Or in Firebase Console:

1. Go to **Cloud Functions** → **Runtime environment variables**
2. Add the following key-value pairs:
   - Key: `airtel_api_url` | Value: `https://openapi.airtel.africa`
   - Key: `airtel_api_key` | Value: `your_api_key`
   - Key: `airtel_business_id` | Value: `your_business_id`

## Step 4: Configure Webhook Callback URL

AIRTEL needs to call your webhook when payments complete:

1. Deploy your Cloud Functions (see Step 5)
2. Find the `airtelPaymentCallback` function URL in Firebase Console
3. Register it in AIRTEL Merchant Portal:
   - Format: `https://your-region-yourproject.cloudfunctions.net/airtelPaymentCallback`
   - Set as: `Callback URL` or `Webhook Endpoint`

## Step 5: Deploy Cloud Functions

```bash
# Navigate to functions directory
cd c:\Users\ALVIN\nexus-university\functions

# Install dependencies (if not already done)
npm install

# Build functions
npm run build

# Deploy to Firebase
firebase deploy --only functions
```

## Step 6: Test the Integration

### Frontend Testing:

1. Open your app
2. Go to Settings → Payments
3. Select "Mobile Money" payment method
4. Choose "AIRTEL Money"
5. Enter a test AIRTEL number (provided by AIRTEL)
6. Verify USSD prompt appears

### Using Test Numbers:

AIRTEL provides test phone numbers for development:

- Test Number 1: (provided by AIRTEL)
- Test Number 2: (provided by AIRTEL)
- Test PIN: (provided by AIRTEL)

## API Endpoints Used

### 1. Initiate Payment (Push Payment)

```
POST /merchant/v2/payments/
Authorization: Bearer {API_KEY}
Content-Type: application/json

{
  "reference": "TXID-123456",
  "subscriber": {
    "country": "UG",
    "currency": "UGX",
    "msisdn": 256701234567
  },
  "transaction": {
    "amount": 150000,
    "country": "UG",
    "currency": "UGX",
    "id": "TXID-123456",
    "type": "MobileMoneyCollection"
  }
}
```

### 2. Check Payment Status

```
GET /merchant/v2/payments/{transaction_id}
Authorization: Bearer {API_KEY}
X-Country: UG
```

Response includes:

- Status: `PendingTransactionStatus`, `SuccessfulTransactionStatus`, `FailedTransactionStatus`
- Transaction details
- Amount and currency

### 3. Webhook Callback

AIRTEL will POST to your callback URL:

```json
{
  "reference": "TXID-123456",
  "status": "SuccessfulTransactionStatus",
  "transaction": {
    "id": "AIRTEL-TXN-123",
    "amount": 150000,
    "currency": "UGX",
    "type": "MobileMoneyCollection"
  }
}
```

## Implementation Details

### Cloud Functions Created:

1. **sendAIRTELPaymentPrompt** - Initiates payment, sends USSD prompt
2. **checkAIRTELPaymentStatus** - Polls for payment status
3. **airtelPaymentCallback** - Webhook handler for AIRTEL callbacks

### Frontend Component:

- **GeneratePRNTab.tsx** - Updated to support AIRTEL provider selection and payment flow

### Database Collections:

Firestore collections created automatically:

- `airtel_payments` - Stores transaction records

## Troubleshooting

### Common Issues:

| Error                       | Solution                                                        |
| --------------------------- | --------------------------------------------------------------- |
| `Invalid API Key`           | Verify API key in Firebase config and .env                      |
| `Phone number format error` | Ensure format is `256XXXXXXXXX` without leading +               |
| `USSD prompt not sent`      | Check if AIRTEL account is active and merchant services enabled |
| `Webhook not called`        | Verify callback URL is registered in AIRTEL portal              |
| `Payment stays pending`     | Check AIRTEL merchant account balance/limits                    |

### Enable Debug Logging:

Add to functions/src/index.ts:

```typescript
console.log("AIRTEL Request:", requestPayload);
console.log("AIRTEL Response:", response.data);
```

## Security Notes

- ✅ **API Key** stored in Firebase Functions environment (not exposed to frontend)
- ✅ **Phone numbers** validated on backend
- ✅ **Transactions** authenticated with Firebase Auth
- ✅ **Webhooks** should validate AIRTEL signature (add signature verification)

### Add Signature Verification (Recommended):

In `airtelPaymentCallback`:

```typescript
const signature = req.headers["x-airtel-signature"];
const expectedSignature = crypto
  .createHmac("sha256", API_KEY)
  .update(JSON.stringify(req.body))
  .digest("hex");

if (signature !== expectedSignature) {
  throw new Error("Invalid signature");
}
```

## Next Steps

1. Contact AIRTEL Uganda for production API credentials
2. Test with provided test numbers
3. Set webhook callback URL
4. Deploy to production
5. Monitor transactions in AIRTEL merchant portal

## Support Resources

- AIRTEL Developer Docs: https://developer.airtel.africa
- AIRTEL Merchant Portal: https://merchantportal.airtel.ug
- Firebase Cloud Functions: https://firebase.google.com/docs/functions
- Contact AIRTEL Support: business@airtel.ug

## Payment Flow Diagram

```
User App
   ↓
[Select AIRTEL Money]
   ↓
[Enter Phone Number]
   ↓
sendAIRTELPaymentPrompt() [Cloud Function]
   ↓
[AIRTEL API: Initiate Payment]
   ↓
[USSD Prompt on User Phone]
   ↓
[User Enters PIN]
   ↓
checkAIRTELPaymentStatus() [Polling every 3 seconds]
   ↓
[AIRTEL API: Check Status]
   ↓
[Payment Successful]
   ↓
[Update Database: Payment Confirmed]
   ↓
[Show Receipt & Confirmation]
```
