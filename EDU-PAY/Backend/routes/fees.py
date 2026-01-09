from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import FeeComponent, Student, Invoice, Payment
from utils import json_response, admin_required
from datetime import datetime

fees_bp = Blueprint("fees", __name__, url_prefix="/api/fees")


@fees_bp.route("", methods=["GET"])
def list_fees():
    fees = FeeComponent.query.all()
    return json_response(True, [f.to_dict() for f in fees])


@fees_bp.route("", methods=["POST"])
@jwt_required()
@admin_required
def create_fee():
    payload = request.get_json() or {}
    if not payload.get("component") or not payload.get("amount"):
        return json_response(False, error="Component name and amount required", status=400)

    fee = FeeComponent(
        name=payload["component"],
        amount=int(payload["amount"]),
        category=payload.get("category", "General"),
        mandatory=payload.get("mandatory", True)
    )
    db.session.add(fee)
    db.session.commit()
    return json_response(True, fee.to_dict(), status=201)


@fees_bp.route("/<int:fee_id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_fee(fee_id):
    fee = FeeComponent.query.get(fee_id)
    if not fee:
        return json_response(False, error="Fee component not found", status=404)

    payload = request.get_json() or {}
    if "component" in payload:
        fee.name = payload["component"]
    if "amount" in payload:
        fee.amount = int(payload["amount"])
    if "mandatory" in payload:
        fee.mandatory = payload["mandatory"]
    if "category" in payload:
        fee.category = payload["category"]
    
    db.session.commit()
    return json_response(True, fee.to_dict())


@fees_bp.route("/<int:fee_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_fee(fee_id):
    fee = FeeComponent.query.get(fee_id)
    if not fee:
        return json_response(False, error="Fee component not found", status=404)
    
    db.session.delete(fee)
    db.session.commit()
    return json_response(True, {"message": "Deleted"})


@fees_bp.route("/assign", methods=["POST"])
@jwt_required()
@admin_required
def assign_fee():
    # payload: { studentIds: [1, 2], feeComponentIds: [1, 3] }
    # OR payload: { studentIds: "all", feeComponentIds: [1] }
    payload = request.get_json() or {}
    student_ids = payload.get("studentIds")
    fee_ids = payload.get("feeComponentIds", [])

    if not student_ids or not fee_ids:
        return json_response(False, error="Missing studentIds or feeComponentIds", status=400)

    # Resolve students
    if student_ids == "all":
        students = Student.query.all()
    else:
        students = Student.query.filter(Student.id.in_(student_ids)).all()

    # Resolve fees
    fees = FeeComponent.query.filter(FeeComponent.id.in_(fee_ids)).all()
    if not fees:
        return json_response(False, error="No valid fee components found", status=404)

    items = [{"label": f.name, "amount": f.amount} for f in fees]
    total_amount = sum(f.amount for f in fees)

    count = 0
    for student in students:
        # Create Invoice
        invoice_no = f"INV-{datetime.now().year}-{student.id}-{int(datetime.now().timestamp())}"
        invoice = Invoice(
            invoice_no=invoice_no,
            student_id=student.id,
            amount_paise=total_amount * 100, # Assuming amount is in rupees in FeeComponent
            currency="INR",
            items=items,
            status="created"
        )
        db.session.add(invoice)
        count += 1

    db.session.commit()
    return json_response(True, {"message": f"Assigned fees to {count} students"})
