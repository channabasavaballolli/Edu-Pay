from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Student, User
from utils import json_response, admin_required

students_bp = Blueprint("students", __name__, url_prefix="/api/students")


@students_bp.route("", methods=["GET"])
def list_students():
    students = Student.query.order_by(Student.name.asc()).all()
    data = [student.to_dict() for student in students]
    return json_response(True, data)


@students_bp.route("/<int:student_id>", methods=["GET"])
def get_student(student_id):
    student = Student.query.get(student_id)
    if not student:
        return json_response(False, error="Student not found", status=404)
    return json_response(True, student.to_dict(include_payments=True))


@students_bp.route("", methods=["POST"])
@jwt_required()
@admin_required
def create_student():
    payload = request.get_json() or {}
    required_fields = ["name", "regno", "course", "phone", "email"]
    missing = [field for field in required_fields if not payload.get(field)]
    if missing:
        return json_response(False, error=f"Missing fields: {', '.join(missing)}", status=400)

    if Student.query.filter((Student.email == payload["email"]) | (Student.regno == payload["regno"])).first():
        return json_response(False, error="Student with this email or regno already exists", status=400)

    student = Student(
        name=payload["name"],
        regno=payload["regno"],
        course=payload["course"],
        phone=payload["phone"],
        email=payload["email"],
    )
    db.session.add(student)
    db.session.flush() # Ensure ID is generated

    # Check if a User exists for this student
    print(f"DEBUG: Checking user for {payload['email']}")
    user = User.query.filter_by(email=payload["email"]).first()
    if not user:
        print("DEBUG: Creating new user")
        user = User(
            name=payload["name"],
            email=payload["email"],
            role="student"
        )
        # Use Register Number (USN) as the default password
        user.set_password(payload["regno"])
        db.session.add(user)
    elif user.role == "student":
        print("DEBUG: Updating existing user password")
        # Ensure password matches USN for existing student user
        user.set_password(payload["regno"]) 
        pass
    else:
        print(f"DEBUG: User exists but role is {user.role}")

    # Auto-assign mandatory fees
    from datetime import datetime
    from models import FeeComponent, Invoice, Payment

    fees = FeeComponent.query.filter_by(mandatory=True).all()
    if fees:
        items = [{"label": f.name, "amount": f.amount} for f in fees]
        total_amount = sum(f.amount for f in fees)
        
        # Create Invoice
        invoice_no = f"INV-{datetime.now().year}-{student.id}-{int(datetime.now().timestamp())}"
        invoice = Invoice(
            invoice_no=invoice_no,
            student_id=student.id,
            amount_paise=total_amount * 100, # Assuming amount is in rupees
            currency="INR",
            items=items,
            status="created"
        )
        db.session.add(invoice)
        db.session.flush()

    db.session.commit()
    return json_response(True, student.to_dict(), status=201)


@students_bp.route("/<int:student_id>/fees", methods=["GET"])
@jwt_required()
def get_student_fees(student_id):
    # Verify access (admin or self)
    identity = get_jwt_identity()
    if identity["role"] == "student":
        # Check if student_id matches the logged in user
        # We need to map User -> Student
        user_id = identity["id"]
        # This is a bit circular if we don't have easy mapping.
        # But we can check if the Student with student_id has email == User.email
        student = Student.query.get(student_id)
        if not student:
             # Try to find student by user email if student_id is just a placeholder (like user_id passed by mistake)
             from models import User
             user = User.query.get(user_id)
             if user:
                 student = Student.query.filter_by(email=user.email).first()
                 if student and student.id != student_id:
                     # Redirecting logic or just use found student
                     pass
             
             if not student:
                return json_response(False, error="Student not found", status=404)
        else:
             from models import User
             user = User.query.get(user_id)
             if student.email != user.email:
                  return json_response(False, error="Unauthorized", status=403)
    
    # Find latest 'created' invoice
    from models import Invoice
    invoice = Invoice.query.filter_by(student_id=student_id, status="created").order_by(Invoice.created_at.desc()).first()
    
    print(f"DEBUG: get_student_fees student_id={student_id} found_created_invoice={invoice.id if invoice else None}")

    if invoice:
        # Return invoice items
        return json_response(True, {
            "invoiceId": invoice.id,
            "invoiceNo": invoice.invoice_no,
            "items": invoice.items,
            "totalAmount": invoice.amount_paise / 100
        })
    else:
        # If no invoice is 'created', check if there are any 'paid' invoices recently?
        # If student has paid everything, we should probably return empty to indicate no dues.
        # But for now, if no invoice exists, we return empty list to prevent re-payment loop.
        # Unless the user logic implies "always show fees". 
        # But user specifically said "after paying fees it is not showing the paid status agian just make sure that it should not show agin to pay".
        # So we MUST return empty if no pending invoice.
        
        # However, if we return empty, the UI might show nothing.
        # We should check if we should fall back to global fees ONLY if the student is NEW and has NO invoice history?
        # Let's check if student has ANY invoice.
        has_invoices = Invoice.query.filter_by(student_id=student_id).count() > 0
        
        if has_invoices:
            # If they have invoices but none are 'created', it means they are paid or cancelled.
            # So return empty.
            return json_response(True, {
                "invoiceId": None,
                "items": [],
                "totalAmount": 0,
                "status": "paid",
                "message": "No pending fees"
            })
        else:
             # If they have NEVER had an invoice, maybe we can show the default fees?
             # Or maybe we should wait for admin to assign?
             # To be safe and avoid "not showing again to pay" issue, let's err on side of caution.
             # If no invoice assigned, show nothing.
             return json_response(True, {
                "invoiceId": None,
                "items": [],
                "totalAmount": 0,
                "message": "No fees assigned"
            })



@students_bp.route("/<int:student_id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_student(student_id):
    student = Student.query.get(student_id)
    if not student:
        return json_response(False, error="Student not found", status=404)
    
    # Store original email to find associated user
    original_email = student.email
    
    payload = request.get_json() or {}
    
    if "name" in payload:
        student.name = payload["name"]
    if "regno" in payload:
        student.regno = payload["regno"]
    if "course" in payload:
        student.course = payload["course"]
    if "phone" in payload:
        student.phone = payload["phone"]
    if "email" in payload:
        student.email = payload["email"]
    
    # Sync changes to User table
    from models import User
    user = User.query.filter_by(email=original_email).first()
    if user and user.role == "student":
        if "email" in payload:
            user.email = payload["email"]
        if "name" in payload:
            user.name = payload["name"]
        # Optional: Reset password if regno changes? 
        # For now, let's keep password as is unless explicitly requested.
        # But if we want dynamic, maybe we should update it?
        # User said "it is not dynamic", implying they want it to match.
        if "regno" in payload:
             user.set_password(payload["regno"])
        
    db.session.commit()
    return json_response(True, student.to_dict())


@students_bp.route("/<int:student_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_student(student_id):
    student = Student.query.get(student_id)
    if not student:
        return json_response(False, error="Student not found", status=404)
        
    # Delete associated invoices and payments manually if cascade isn't set
    from models import Invoice, Payment
    Payment.query.filter_by(student_id=student.id).delete()
    Invoice.query.filter_by(student_id=student.id).delete()

    db.session.delete(student)
    db.session.commit()
    return json_response(True, {"message": "Student deleted successfully"})

