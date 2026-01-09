from flask import jsonify
from functools import wraps
from flask_jwt_extended import get_jwt_identity


def json_response(success=True, data=None, error=None, status=200):
    payload = {"success": success}
    if success:
        payload["data"] = data
    else:
        payload["error"] = error or "Unknown error"
    return jsonify(payload), status


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        identity = get_jwt_identity()
        if not identity or identity.get("role") != "admin":
             return json_response(False, error="Admin access required", status=403)
        return fn(*args, **kwargs)
    return wrapper

