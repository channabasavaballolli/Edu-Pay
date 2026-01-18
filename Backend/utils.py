from flask import jsonify


def json_response(success=True, data=None, error=None, status=200):
    payload = {"success": success}
    if success:
        payload["data"] = data
    else:
        payload["error"] = error or "Unknown error"
    return jsonify(payload), status

