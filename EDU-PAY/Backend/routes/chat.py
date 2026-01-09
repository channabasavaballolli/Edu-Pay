from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import Student, Invoice, Payment, FeeComponent
from utils import json_response

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")


@chat_bp.route("/message", methods=["POST"])
@jwt_required()
def chat_message():
    payload = request.get_json() or {}
    message = payload.get("message", "").lower()
    
    identity = get_jwt_identity()
    user_id = identity.get("id")
    role = identity.get("role")
    
    # Simple rule-based logic
    response_text = "I'm not sure how to help with that. Try asking about 'pending dues', 'fee breakdown', or 'last date'."

    if role == "student":
        # Link User to Student?
        # Current User model and Student model are separate.
        # User (email) -> Student (email).
        # We need to find the student record associated with this user.
        # Ideally, User table should link to Student, or share ID.
        # For now, let's look up by email or assume ID matches (dangerous).
        # Let's use email.
        from models import User
        user = User.query.get(user_id)
        student = Student.query.filter_by(email=user.email).first()
        
        if not student:
             return json_response(True, {"response": "I cannot find your student record. Please contact admin."})

        if any(w in message for w in ["pending", "due", "amount", "balance"]):
            outstanding = student.outstanding_amount() / 100
            response_text = f"Your total pending fee is ₹{outstanding:,.2f}."
            
        elif any(w in message for w in ["breakdown", "structure", "components"]):
            # Get latest invoice or fee structure
            # If no invoice, show general fee structure
            if student.invoices.count() > 0:
                latest_invoice = student.invoices.order_by(Invoice.created_at.desc()).first()
                items = latest_invoice.items
                breakdown = ", ".join([f"{i['label']}: ₹{i['amount']}" for i in items])
                response_text = f"Your latest invoice breakdown: {breakdown}."
            else:
                fees = FeeComponent.query.all()
                breakdown = ", ".join([f"{f.name}: ₹{f.amount}" for f in fees])
                response_text = f"The standard fee structure is: {breakdown}."

        elif any(w in message for w in ["date", "deadline", "last"]):
            response_text = "The fee payment deadline is January 31st, 2025."
            
        elif any(w in message for w in ["pay", "how to"]):
            response_text = "You can pay securely via the 'Fee Payment' tab using Credit Card, UPI, or Net Banking."
            
    elif role == "admin":
        if "total" in message:
             # Calculate total collection
             from sqlalchemy import func
             total = Payment.query.filter_by(status="captured").with_entities(func.sum(Payment.amount_paise)).scalar() or 0
             response_text = f"Total collection so far is ₹{total/100:,.2f}."
        else:
             response_text = "Hello Admin! Ask me about 'total collection' or 'pending dues'."

    return json_response(True, {"response": response_text})
