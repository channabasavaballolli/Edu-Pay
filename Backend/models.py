from datetime import datetime
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.dialects.sqlite import JSON
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db


class BaseModel(db.Model):
    __abstract__ = True
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class User(BaseModel):
    __tablename__ = "users"

    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(32), nullable=False, default="admin")

    def set_password(self, raw_password: str) -> None:
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password_hash(self.password_hash, raw_password)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email, "role": self.role}


class Student(BaseModel):
    __tablename__ = "students"

    name = db.Column(db.String(120), nullable=False)
    regno = db.Column(db.String(64), unique=True, nullable=False)
    course = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(32), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    invoices = db.relationship("Invoice", backref="student", lazy="dynamic")
    payments = db.relationship("Payment", backref="student", lazy="dynamic")

    def outstanding_amount(self) -> int:
        invoice_total = (
            self.invoices.with_entities(func.coalesce(func.sum(Invoice.amount_paise), 0))
            .scalar()
            or 0
        )
        paid_total = (
            self.payments.filter_by(status="captured")
            .with_entities(func.coalesce(func.sum(Payment.amount_paise), 0))
            .scalar()
            or 0
        )
        return invoice_total - paid_total

    def to_dict(self, include_payments: bool = False):
        data = {
            "id": self.id,
            "name": self.name,
            "regno": self.regno,
            "course": self.course,
            "phone": self.phone,
            "email": self.email,
            "outstanding": self.outstanding_amount() / 100,
        }
        if include_payments:
            data["payments"] = [payment.to_dict() for payment in self.payments.order_by(Payment.created_at.desc()).all()]
        return data


class FeeComponent(BaseModel):
    __tablename__ = "fee_components"

    name = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    category = db.Column(db.String(120), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "amount": self.amount, "category": self.category}


class Invoice(BaseModel):
    __tablename__ = "invoices"

    invoice_no = db.Column(db.String(64), unique=True, nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    amount_paise = db.Column(db.Integer, nullable=False)
    currency = db.Column(db.String(8), default="INR", nullable=False)
    items = db.Column(JSON, default=list)
    status = db.Column(db.String(32), default="created")

    payments = db.relationship("Payment", backref="invoice", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "invoiceNo": self.invoice_no,
            "student_id": self.student_id,
            "amount": self.amount_paise,
            "currency": self.currency,
            "items": self.items or [],
            "status": self.status,
        }


class Payment(BaseModel):
    __tablename__ = "payments"

    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    invoice_id = db.Column(db.Integer, db.ForeignKey("invoices.id"), nullable=False)
    razorpay_order_id = db.Column(db.String(128))
    razorpay_payment_id = db.Column(db.String(128))
    invoice_no = db.Column(db.String(64), nullable=False)
    amount_paise = db.Column(db.Integer, nullable=False)
    currency = db.Column(db.String(8), default="INR")
    status = db.Column(db.String(32), default="created", nullable=False)
    receipt_path = db.Column(db.String(255))

    def to_dict(self):
        return {
            "id": self.id,
            "invoiceId": self.invoice_id,
            "invoiceNo": self.invoice_no,
            "studentId": self.student_id,
            "amount": self.amount_paise,
            "currency": self.currency,
            "status": self.status,
            "razorpayOrderId": self.razorpay_order_id,
            "razorpayPaymentId": self.razorpay_payment_id,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }

