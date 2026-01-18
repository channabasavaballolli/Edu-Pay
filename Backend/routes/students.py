from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from extensions import db
from models import Student
from utils import json_response

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
def create_student():
    payload = request.get_json() or {}
    required_fields = ["name", "regno", "course", "phone", "email"]
    missing = [field for field in required_fields if not payload.get(field)]
    if missing:
        return json_response(False, error=f"Missing fields: {', '.join(missing)}", status=400)

    student = Student(
        name=payload["name"],
        regno=payload["regno"],
        course=payload["course"],
        phone=payload["phone"],
        email=payload["email"],
    )
    db.session.add(student)
    db.session.commit()
    return json_response(True, student.to_dict(), status=201)

