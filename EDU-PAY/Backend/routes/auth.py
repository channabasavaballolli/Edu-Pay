from flask import Blueprint, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from extensions import db
from models import User
from utils import json_response

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    payload = request.get_json() or {}
    name = payload.get("name")
    email = payload.get("email")
    password = payload.get("password")
    role = payload.get("role", "student")

    if not name or not email or not password:
        return json_response(False, error="Name, email and password required", status=400)

    if User.query.filter_by(email=email).first():
        return json_response(False, error="Email already exists", status=400)

    user = User(name=name, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity={"id": user.id, "role": user.role})
    return json_response(True, {"token": token, "user": user.to_dict()}, status=201)


@auth_bp.route("/login", methods=["POST"])
def login():
    payload = request.get_json() or {}
    email = payload.get("email")
    password = payload.get("password")
    if not email or not password:
        return json_response(False, error="Email and password required", status=400)

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return json_response(False, error="Invalid credentials", status=401)

    token = create_access_token(identity={"id": user.id, "role": user.role})
    return json_response(True, {"token": token, "user": user.to_dict()})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    identity = get_jwt_identity() or {}
    user = User.query.get(identity.get("id"))
    if not user:
        return json_response(False, error="User not found", status=404)
    return json_response(True, user.to_dict())

@auth_bp.route("/debug/<email>", methods=["GET"])
def debug_user(email):
    user = User.query.filter_by(email=email).first()
    if not user:
        return json_response(False, error="User not found", status=404)
    
    check = user.check_password("student123")
    return json_response(True, {
        "user": user.to_dict(),
        "password_hash": user.password_hash,
        "check_student123": check
    })

