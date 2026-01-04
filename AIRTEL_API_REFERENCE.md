# AIRTEL Payment API - Technical Reference

## API Endpoints

### Base URL

```
Production: https://openapi.airtel.africa
Sandbox: https://sandbox.openapi.airtel.africa (if available)
```

---

## 1. Initiate Payment (Push Payment)

### Request

```http
POST /merchant/v2/payments/
Authorization: Bearer {AIRTEL_API_KEY}
X-Country: UG
Content-Type: application/json

{
  "reference": "MOMO-airtel-1704499200-456",
  "subscriber": {
    "country": "UG",
    "currency": "UGX",
    "msisdn": 256701234567
  },
  "transaction": {
    "amount": 150000,
    "country": "UG",
    "currency": "UGX",
    "id": "MOMO-airtel-1704499200-456",
    "type": "MobileMoneyCollection"
  }
}
```

### Response (Success)

```json
{
  "data": {
    "id": "airtel_txn_12345678",
    "reference": "MOMO-airtel-1704499200-456",
    "status": "PendingTransactionStatus",
    "transaction": {
      "id": "MOMO-airtel-1704499200-456",
      "amount": 150000,
      "currency": "UGX"
    },
    "subscriber": {
      "msisdn": 256701234567
    }
  },
  "status": "success"
}
```

### Response (Error)

```json
{
  "status": "failed",
  "code": "INVALID_PHONE",
  "message": "Invalid phone number format"
}
```

---

## 2. Check Payment Status

### Request

```http
GET /merchant/v2/payments/MOMO-airtel-1704499200-456
Authorization: Bearer {AIRTEL_API_KEY}
X-Country: UG
Content-Type: application/json
```

### Response (Pending)

```json
{
  "data": {
    "id": "airtel_txn_12345678",
    "reference": "MOMO-airtel-1704499200-456",
    "status": "PendingTransactionStatus",
    "transaction": {
      "id": "MOMO-airtel-1704499200-456",
      "amount": 150000,
      "currency": "UGX",
      "type": "MobileMoneyCollection"
    }
  },
  "status": "success"
}
```

### Response (Successful)

```json
{
  "data": {
    "id": "airtel_txn_12345678",
    "reference": "MOMO-airtel-1704499200-456",
    "status": "SuccessfulTransactionStatus",
    "transaction": {
      "id": "MOMO-airtel-1704499200-456",
      "amount": 150000,
      "currency": "UGX",
      "type": "MobileMoneyCollection"
    },
    "airtelTransactionId": "AIRTEL-123456789"
  },
  "status": "success"
}
```

### Response (Failed)

```json
{
  "data": {
    "id": "airtel_txn_12345678",
    "reference": "MOMO-airtel-1704499200-456",
    "status": "FailedTransactionStatus",
    "errorCode": "INSUFFICIENT_BALANCE",
    "errorMessage": "Insufficient balance in account"
  },
  "status": "success"
}
```

---

## 3. Webhook Callback

### When Payment Completes

AIRTEL will POST to your registered webhook URL:

```http
POST /airtelPaymentCallback
Content-Type: application/json

{
  "reference": "MOMO-airtel-1704499200-456",
  "status": "SuccessfulTransactionStatus",
  "transaction": {
    "id": "MOMO-airtel-1704499200-456",
    "amount": 150000,
    "currency": "UGX",
    "type": "MobileMoneyCollection"
  },
  "subscriber": {
    "msisdn": 256701234567,
    "country": "UG"
  },
  "airtelTransactionId": "AIRTEL-123456789",
  "timestamp": "2024-01-05T12:30:45Z"
}
```

### Your Response (Required)

```json
{
  "status": "ok",
  "reference": "MOMO-airtel-1704499200-456"
}
```

---

## Status Values

| Status                        | Meaning                         | Action          |
| ----------------------------- | ------------------------------- | --------------- |
| `PendingTransactionStatus`    | Waiting for user confirmation   | Keep polling    |
| `SuccessfulTransactionStatus` | Payment confirmed               | Mark as success |
| `FailedTransactionStatus`     | User declined or error occurred | Mark as failed  |
| `RejectedTransactionStatus`   | AIRTEL rejected                 | Mark as failed  |
| `ExpiredTransactionStatus`    | Timeout (4 minutes)             | Mark as failed  |

---

## Error Codes

| Code                         | Message                     | Action                |
| ---------------------------- | --------------------------- | --------------------- |
| `INVALID_PHONE`              | Invalid phone number        | Validate format       |
| `SUBSCRIBER_NOT_FOUND`       | Phone number not registered | Verify number         |
| `INVALID_API_KEY`            | Wrong API key               | Check credentials     |
| `INSUFFICIENT_BALANCE`       | User has insufficient funds | User needs more money |
| `TRANSACTION_LIMIT_EXCEEDED` | Amount exceeds limit        | Use smaller amount    |
| `SERVICE_UNAVAILABLE`        | AIRTEL service down         | Retry later           |
| `TIMEOUT`                    | Request timed out           | Retry                 |
| `DUPLICATE_REQUEST`          | Duplicate transaction       | Use new reference     |

---

## Example Flow: Complete Transaction

### Step 1: Initiate Payment

```bash
curl -X POST https://openapi.airtel.africa/merchant/v2/payments/ \
  -H "Authorization: Bearer {API_KEY}" \
  -H "X-Country: UG" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "TXN-001",
    "subscriber": {
      "country": "UG",
      "currency": "UGX",
      "msisdn": 256701234567
    },
    "transaction": {
      "amount": 150000,
      "country": "UG",
      "currency": "UGX",
      "id": "TXN-001",
      "type": "MobileMoneyCollection"
    }
  }'
```

**Response:** Status = `PendingTransactionStatus`, User receives USSD prompt

### Step 2: User Enters PIN on Phone

User sees: `Nexus University requests UGX 150,000. Enter PIN:`
User enters their AIRTEL PIN → Payment processes

### Step 3: Frontend Polls Status

```bash
curl -X GET https://openapi.airtel.africa/merchant/v2/payments/TXN-001 \
  -H "Authorization: Bearer {API_KEY}" \
  -H "X-Country: UG"
```

**Response:** Status = `SuccessfulTransactionStatus`

### Step 4: Webhook Callback (Simultaneous)

AIRTEL POSTs:

```json
{
  "reference": "TXN-001",
  "status": "SuccessfulTransactionStatus",
  "airtelTransactionId": "AIRTEL-9876543210"
}
```

Your server responds:

```json
{
  "status": "ok",
  "reference": "TXN-001"
}
```

### Step 5: Payment Confirmed

- Database updated
- Receipt generated
- User notified

---

## Implementation Notes

### Phone Number Format

- Remove '+' and country code from display
- API expects numeric only: `256701234567`
- Must be 12 digits total (256 + 10 digit number)
- Validation regex: `/^256\d{9}$/`

### Transaction ID

- Must be unique per request
- Format: `MOMO-provider-timestamp-random`
- Example: `MOMO-airtel-1704499200-456`
- Used as reference throughout

### Amount

- In minor units (cents): 150000 = 1500.00 UGX
- Or actual UGX amount: 150000 UGX
- Always numeric, no currency symbol

### Timeout

- USSD prompt expires after 4 minutes
- Keep polling while `PendingTransactionStatus`
- Stop after 4+ minutes or when status changes

### Headers

```
Authorization: Bearer {API_KEY}
X-Country: UG
Content-Type: application/json
```

---

## Testing with Postman

### 1. Create new POST request

- URL: `https://openapi.airtel.africa/merchant/v2/payments/`

### 2. Headers tab

```
Authorization: Bearer your_test_api_key
X-Country: UG
Content-Type: application/json
```

### 3. Body (raw JSON)

```json
{
  "reference": "TEST-001",
  "subscriber": {
    "country": "UG",
    "currency": "UGX",
    "msisdn": 256700000000
  },
  "transaction": {
    "amount": 1000,
    "country": "UG",
    "currency": "UGX",
    "id": "TEST-001",
    "type": "MobileMoneyCollection"
  }
}
```

### 4. Send and check response

---

## Debugging Tips

### Check Cloud Function Logs

```bash
firebase functions:log --only sendAIRTELPaymentPrompt
```

### View Firestore Records

1. Firebase Console
2. Firestore Database
3. Collection: `airtel_payments`
4. Check status field

### Monitor AIRTEL Portal

- Log in to https://merchantportal.airtel.ug
- View all transactions
- Check status and reference ID
- Download transaction reports

### Enable Request Logging

Add to functions:

```typescript
console.log("AIRTEL Request:", {
  phone: fullPhoneNumber,
  amount: amount,
  reference: transactionId,
});
console.log("AIRTEL Response:", response.data);
```

---

## Rate Limiting

AIRTEL may have rate limits:

- Check response headers for rate limit info
- Implement exponential backoff on retries
- Cache successful transactions

---

## Security Checklist

- [ ] Never log API keys
- [ ] Validate phone numbers on backend
- [ ] Verify user is authenticated
- [ ] Validate amounts on backend
- [ ] Use HTTPS only
- [ ] Verify webhook signatures (add: HMAC-SHA256)
- [ ] Log all transactions
- [ ] Monitor for fraud patterns
- [ ] Use environment variables for credentials
- [ ] Rotate API keys regularly

---

## Production Readiness Checklist

- [ ] Obtained production AIRTEL credentials
- [ ] Registered webhook callback URL
- [ ] Tested with test phone numbers
- [ ] Deployed to Firebase production
- [ ] Verified HTTPS connectivity
- [ ] Set up monitoring and alerts
- [ ] Tested error scenarios
- [ ] Verified webhook reception
- [ ] Created runbooks for issues
- [ ] User documentation updated
