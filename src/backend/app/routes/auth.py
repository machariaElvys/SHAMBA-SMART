from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token

bp = Blueprint("auth", __name__)

# Demo users only (replace with DB later)
USERS = {
    "user@example.com": "password"
}

@bp.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    if USERS.get(email) != password:
        return jsonify({"error": "wrong email or password"}), 401

    access_token = create_access_token(identity=email)
    return jsonify({"access_token": access_token}), 200