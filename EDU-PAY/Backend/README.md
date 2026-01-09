## EduPay Backend (Flask + SQLite)

This directory contains the complete Flask + SQLite backend required by the EduPay React/Vite frontend. It exposes all `/api/auth`, `/api/students`, `/api/payments`, and `/api/reports` endpoints expected by the UI, integrates with Razorpay (with automatic mock fallback), and generates PDF receipts for every captured payment.

### 1. Tech Stack

- Flask 3, Flask-JWT-Extended, Flask-CORS
- SQLAlchemy + Flask-Migrate (SQLite by default)
- Razorpay Python SDK with optional mock mode
- WeasyPrint for server-side PDF receipts
- Pytest-based test suite + Postman collection

### 2. Getting Started

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # PowerShell on Windows
pip install -r requirements.txt
copy .env.example .env         # fill in secrets
flask db upgrade               # applies bundled migrations
flask seed                     # or: python seed.py
flask run --port 5000
```

Set `VITE_API_BASE=http://localhost:5000` (or configure Vite proxy) so the frontend talks to this backend.

### 3. Environment Variables (`.env`)

```
FLASK_APP=app.py
FLASK_ENV=development
DATABASE_URL=sqlite:///./edu_pay.db
SECRET_KEY=change-me
JWT_SECRET_KEY=another-secret
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxx
FRONTEND_ORIGIN=http://localhost:8080
```

If Razorpay keys are omitted, the API automatically switches to mock mode: `create-order` returns a fake order id and `verify` accepts any signature for rapid frontend development.

### 4. Available Scripts

- `flask run --port 5000` – start the dev server with hot reload.
- `flask db upgrade` / `flask db migrate -m "msg"` – manage database schema.
- `flask seed` or `python seed.py` – populate demo admin (`admin@edupay.local` / `admin123`) plus a sample student & invoice.
- `pytest` – run the backend test suite.

### 5. Razorpay Integration

1. **Create Order** – `/api/payments/create-order` converts rupee amount to paise and creates a Razorpay order (or mock).
2. **Verify** – `/api/payments/verify` validates `razorpay_signature` using HMAC-SHA256 (`order_id|payment_id`). On success it marks the payment captured and generates a PDF receipt under `receipts/<invoice>.pdf`.
3. **Webhook** – `/api/payments/webhook` verifies the `X-Razorpay-Signature` header before syncing payment status.

For local end-to-end testing use Razorpay test keys and the documented test card (`4111 1111 1111 1111`, any future expiry, CVV 123, OTP 123456).

### 6. Postman Collection / cURL

- Import `EduPay.postman_collection.json` into Postman. Variables `baseUrl`, `token`, `orderId`, `invoiceId`, `signature`, and `webhookSignature` are pre-defined.
- Example cURL flow (mock mode):

```powershell
# Login
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"admin@edupay.local\",\"password\":\"admin123\"}"

# Create order (use token from previous step)
curl -X POST http://localhost:5000/api/payments/create-order `
  -H "Authorization: Bearer <TOKEN>" `
  -H "Content-Type: application/json" `
  -d "{\"studentId\":1,\"amount\":2500,\"currency\":\"INR\",\"items\":[{\"label\":\"Tuition\",\"amount\":250000}]}"

# Verify (mock secret)
python - <<'PY'
import hmac, hashlib, os
secret = os.getenv("RAZORPAY_KEY_SECRET","test_secret")
order_id = "order_xxx"
payment_id = "pay_xxx"
sig = hmac.new(secret.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()
print(sig)
PY

curl -X POST http://localhost:5000/api/payments/verify `
  -H "Content-Type: application/json" `
  -d "{\"razorpay_order_id\":\"order_xxx\",\"razorpay_payment_id\":\"pay_xxx\",\"razorpay_signature\":\"<SIG>\",\"invoiceId\":1}"
```

### 7. Tests

```bash
cd backend
pytest
```

The suite covers:
- Order creation in mock mode
- Signature verification logic
- Webhook signature handling
- Student CRUD happy paths

### 8. Sample API Responses

**POST /api/payments/create-order**

```json
{
  "success": true,
  "data": {
    "orderId": "order_Fake123",
    "amount": 250000,
    "currency": "INR",
    "invoiceId": 1
  }
}
```

**POST /api/payments/verify**

```json
{
  "success": true,
  "data": {
    "status": "success",
    "paymentId": 1,
    "receiptUrl": "/api/payments/1/receipt"
  }
}
```

### 9. Frontend Wiring

Point the Vite frontend to the backend by setting:

```
VITE_API_BASE=http://localhost:5000
```

or add a proxy entry in `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

### 10. Troubleshooting

- Ensure `WeasyPrint` system deps are installed (on Windows use the official MSI or install GTK/LibreSSL packages).
- If `flask db upgrade` complains about the database, delete `edu_pay.db` and re-run `flask db upgrade`.
- When testing webhooks locally, use `ngrok http 5000` and configure the Razorpay dashboard to point to `https://<ngrok-id>.ngrok.io/api/payments/webhook`.

