from datetime import datetime
from pathlib import Path

from flask import Blueprint, current_app, request, send_file
from flask_jwt_extended import jwt_required

from models import Payment
from services.payments_service import (
    PaymentServiceError,
    create_payment_order,
    handle_webhook,
    list_payments,
    verify_payment,
)
from utils import json_response

payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")


@payments_bp.route("", methods=["GET"])
def payments_index():
    filters = {
        "studentId": request.args.get("studentId", type=int),
        "status": request.args.get("status"),
        "from": _parse_date(request.args.get("from")),
        "to": _parse_date(request.args.get("to")),
    }
    data = list_payments({k: v for k, v in filters.items() if v})
    return json_response(True, data)


@payments_bp.route("/create-order", methods=["POST"])
def create_order():
    payload = request.get_json() or {}
    try:
        response = create_payment_order(
            student_id=payload.get("studentId"),
            amount=payload.get("amount"),
            currency=payload.get("currency", "INR"),
            items=payload.get("items", []),
            meta=payload.get("meta", {}),
        )
        response["keyId"] = current_app.config.get("RAZORPAY_KEY_ID")
        return json_response(True, response, status=201)
    except PaymentServiceError as exc:
        return json_response(False, error=str(exc), status=400)


@payments_bp.route("/verify", methods=["POST"])
def verify():
    payload = request.get_json() or {}
    try:
        data = verify_payment(payload)
        return json_response(True, data)
    except PaymentServiceError as exc:
        return json_response(False, error=str(exc), status=400)


@payments_bp.route("/webhook", methods=["POST"])
def webhook():
    raw_body = request.get_data()
    signature = request.headers.get("X-Razorpay-Signature")
    try:
        data = handle_webhook(raw_body, signature)
        return json_response(True, data)
    except PaymentServiceError as exc:
        return json_response(False, error=str(exc), status=400)


@payments_bp.route("/<int:invoice_id>/receipt", methods=["GET"])
def get_receipt(invoice_id):
    payment = Payment.query.filter_by(invoice_id=invoice_id).first()
    if not payment or not payment.receipt_path:
        return json_response(False, error="Receipt not found", status=404)
    file_path = Path(payment.receipt_path)
    if not file_path.exists():
        return json_response(False, error="Receipt missing", status=404)
    return send_file(str(file_path), mimetype="application/pdf", download_name=file_path.name)


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        current_app.logger.warning("Unable to parse date %s", value)
        return None

