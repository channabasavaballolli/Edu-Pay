import hashlib
import hmac
import json
from decimal import Decimal
from typing import Any, Dict, Optional
from uuid import uuid4

import razorpay
from flask import current_app

from extensions import db
from models import Invoice, Payment, Student
from services.receipt_generator import generate_receipt


class PaymentServiceError(Exception):
    pass


def _get_razorpay_client():
    key_id = current_app.config.get("RAZORPAY_KEY_ID")
    key_secret = current_app.config.get("RAZORPAY_KEY_SECRET")
    if key_id and key_secret:
        return razorpay.Client(auth=(key_id, key_secret))
    return None


def _amount_to_paise(amount: Any) -> int:
    value = Decimal(str(amount))
    return int(value * 100)


def create_payment_order(student_id: int, amount: Any, currency: str, items, meta):
    if student_id is None:
        raise PaymentServiceError("studentId is required")
    if amount is None:
        raise PaymentServiceError("amount is required")

    student = Student.query.get(student_id)
    if not student:
        raise PaymentServiceError("Student not found")

    amount_paise = _amount_to_paise(amount)
    invoice_no = (meta or {}).get("invoiceNo") or f"INV-{uuid4().hex[:8].upper()}"

    invoice = Invoice(
        invoice_no=invoice_no,
        student_id=student.id,
        amount_paise=amount_paise,
        currency=currency,
        items=items or [],
    )
    db.session.add(invoice)

    client = _get_razorpay_client()
    if client:
        order = client.order.create({"amount": amount_paise, "currency": currency, "receipt": invoice_no})
    else:
        order = {"id": f"order_{uuid4().hex}", "amount": amount_paise, "currency": currency, "receipt": invoice_no}

    payment = Payment(
        student_id=student.id,
        invoice=invoice,
        invoice_no=invoice_no,
        amount_paise=amount_paise,
        currency=currency,
        razorpay_order_id=order["id"],
        status="created",
    )
    db.session.add(payment)
    db.session.commit()
    return {"orderId": order["id"], "amount": order["amount"], "currency": order["currency"], "invoiceId": invoice.id}


def _is_signature_valid(order_id: str, payment_id: str, signature: str) -> bool:
    secret = current_app.config.get("RAZORPAY_KEY_SECRET")
    payload = f"{order_id}|{payment_id}".encode()
    if secret:
        generated = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
        return hmac.compare_digest(generated, signature or "")
    # allow mock verification when secret missing
    return True


def verify_payment(payload: Dict[str, Any]):
    order_id = payload.get("razorpay_order_id")
    payment_id = payload.get("razorpay_payment_id")
    signature = payload.get("razorpay_signature")
    invoice_id = payload.get("invoiceId")

    if not all([order_id, payment_id, invoice_id]):
        raise PaymentServiceError("Missing verification payload fields")

    payment = Payment.query.filter_by(invoice_id=invoice_id, razorpay_order_id=order_id).first()
    if not payment:
        raise PaymentServiceError("Payment not found for invoice")

    if not _is_signature_valid(order_id, payment_id, signature):
        raise PaymentServiceError("Invalid signature")

    payment.razorpay_payment_id = payment_id
    payment.status = "captured"
    payment.invoice.status = "paid"
    receipt_path = generate_receipt(payment.invoice, payment, payment.student, current_app.config)
    payment.receipt_path = receipt_path
    db.session.commit()
    return {
        "status": "success",
        "paymentId": payment.id,
        "receiptUrl": f"/api/payments/{payment.invoice_id}/receipt",
    }


def _verify_webhook_signature(raw_body: bytes, header_signature: str) -> bool:
    secret = current_app.config.get("RAZORPAY_WEBHOOK_SECRET") or current_app.config.get(
        "RAZORPAY_KEY_SECRET"
    )
    if not secret:
        return True
    generated = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(generated, header_signature or "")


def handle_webhook(raw_body: bytes, header_signature: Optional[str]):
    if not _verify_webhook_signature(raw_body, header_signature or ""):
        raise PaymentServiceError("Invalid webhook signature")

    event = json.loads(raw_body.decode("utf-8"))
    event_type = event.get("event")
    payload = event.get("payload", {})
    entity = payload.get("payment", {}).get("entity", {})
    order_id = entity.get("order_id")
    payment_id = entity.get("id")
    status = entity.get("status")

    payment = Payment.query.filter_by(razorpay_order_id=order_id).first()
    if not payment:
        return {"ignored": True}

    if event_type == "payment.captured" or status == "captured":
        payment.status = "captured"
        payment.razorpay_payment_id = payment_id
        payment.invoice.status = "paid"
        if not payment.receipt_path:
            payment.receipt_path = generate_receipt(payment.invoice, payment, payment.student, current_app.config)
    elif event_type == "payment.failed" or status == "failed":
        payment.status = "failed"
    db.session.commit()
    return {"updated": True}


def list_payments(filters: Dict[str, Any]):
    query = Payment.query
    if filters.get("studentId"):
        query = query.filter_by(student_id=filters["studentId"])
    if filters.get("status"):
        query = query.filter_by(status=filters["status"])
    if filters.get("from"):
        query = query.filter(Payment.created_at >= filters["from"])
    if filters.get("to"):
        query = query.filter(Payment.created_at <= filters["to"])
    query = query.order_by(Payment.created_at.desc())
    return [payment.to_dict() for payment in query.all()]

