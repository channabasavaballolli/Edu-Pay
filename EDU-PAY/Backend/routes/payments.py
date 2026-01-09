from datetime import datetime
from pathlib import Path

from flask import Blueprint, current_app, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import Payment
from services.payments_service import (
    PaymentServiceError,
    create_payment_order,
    handle_webhook,
    list_payments,
    verify_payment,
)
from utils import json_response, admin_required

payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")


@payments_bp.route("", methods=["GET"])
@jwt_required()
def payments_index():
    identity = get_jwt_identity()
    role = identity.get("role")
    
    filters = {
        "studentId": request.args.get("studentId", type=int),
        "status": request.args.get("status"),
        "from": _parse_date(request.args.get("from")),
        "to": _parse_date(request.args.get("to")),
    }
    
    # If student, force filter to own ID
    if role == "student":
        # We need to find the student ID associated with this user ID
        # Assuming User.id and Student.id are NOT the same (User is auth, Student is profile)
        # However, the identity payload currently has "id" which is User.id.
        # We need to look up Student by email maybe? Or link User to Student.
        # Let's assume for now User.email == Student.email
        from models import Student, User
        user = User.query.get(identity.get("id"))
        student = Student.query.filter_by(email=user.email).first()
        if not student:
            return json_response(False, error="Student profile not found", status=404)
        filters["studentId"] = student.id
        
    data = list_payments({k: v for k, v in filters.items() if v})
    return json_response(True, data)


@payments_bp.route("/create-order", methods=["POST"])
@jwt_required()
def create_order():
    identity = get_jwt_identity()
    role = identity.get("role")
    payload = request.get_json() or {}
    
    student_id = payload.get("studentId")
    
    if role == "student":
         from models import Student, User
         user = User.query.get(identity.get("id"))
         student = Student.query.filter_by(email=user.email).first()
         if not student:
             return json_response(False, error="Student profile not found", status=404)
         if int(student_id) != student.id:
             return json_response(False, error="Cannot create order for another student", status=403)

    try:
        response = create_payment_order(
            student_id=student_id,
            amount=payload.get("amount"),
            currency=payload.get("currency", "INR"),
            items=payload.get("items", []),
            meta=payload.get("meta", {}),
            invoice_id=payload.get("invoiceId"),
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


@payments_bp.route("/config/razorpay", methods=["GET"])
@jwt_required()
@admin_required
def razorpay_config_status():
    configured = bool(current_app.config.get("RAZORPAY_KEY_ID") and current_app.config.get("RAZORPAY_KEY_SECRET"))
    return json_response(True, {"configured": configured})


@payments_bp.route("/config/razorpay", methods=["PUT"])
@jwt_required()
@admin_required
def razorpay_config_update():
    payload = request.get_json() or {}
    key_id = payload.get("keyId")
    key_secret = payload.get("keySecret")
    webhook_secret = payload.get("webhookSecret")
    if not key_id or not key_secret:
        return json_response(False, error="keyId and keySecret are required", status=400)
    current_app.config["RAZORPAY_KEY_ID"] = key_id
    current_app.config["RAZORPAY_KEY_SECRET"] = key_secret
    if webhook_secret:
        current_app.config["RAZORPAY_WEBHOOK_SECRET"] = webhook_secret
    return json_response(True, {"configured": True})
