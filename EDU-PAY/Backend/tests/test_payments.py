import hashlib
import hmac
import json
from uuid import uuid4


def _create_order(client, auth_headers):
    payload = {
        "studentId": 1,
        "amount": 2500,
        "currency": "INR",
        "items": [{"label": "Semester Fee", "amount": 250000}],
        "meta": {"invoiceNo": f"INV-TEST-{uuid4().hex[:6].upper()}"},
    }
    resp = client.post("/api/payments/create-order", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    return resp.json["data"]


def test_create_order_returns_order_details(client, auth_headers):
    data = _create_order(client, auth_headers)
    assert "orderId" in data
    assert data["amount"] == 250000


def test_verify_payment_success(client, auth_headers):
    data = _create_order(client, auth_headers)
    order_id = data["orderId"]
    invoice_id = data["invoiceId"]
    payment_id = "pay_test_123"
    secret = client.application.config["RAZORPAY_KEY_SECRET"]
    signature = hmac.new(
        secret.encode(),
        f"{order_id}|{payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()

    resp = client.post(
        "/api/payments/verify",
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature,
            "invoiceId": invoice_id,
        },
    )
    assert resp.status_code == 200
    assert resp.json["data"]["status"] == "success"


def test_webhook_handler_updates_payment(client, auth_headers):
    data = _create_order(client, auth_headers)
    order_id = data["orderId"]
    payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_webhook_123",
                    "order_id": order_id,
                    "status": "captured",
                }
            }
        },
    }
    raw = json.dumps(payload).encode()
    secret = client.application.config["RAZORPAY_WEBHOOK_SECRET"]
    signature = hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()

    resp = client.post(
        "/api/payments/webhook",
        data=raw,
        headers={"X-Razorpay-Signature": signature, "Content-Type": "application/json"},
    )
    assert resp.status_code == 200
    assert resp.json["success"] is True

