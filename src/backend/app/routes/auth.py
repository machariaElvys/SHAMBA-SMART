from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from ..extensions import db
from ..models import User

bp = Blueprint("auth", __name__)


def _read_credentials():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    return email, password


@bp.post("/api/auth/register")
def register():
    email, password = _read_credentials()

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    if "@" not in email:
        return jsonify({"error": "enter a valid email"}), 400

    if len(password) < 6:
        return jsonify({"error": "password must be at least 6 characters"}), 400

    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({"error": "email already exists"}), 409

    user = User(email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"email": user.email},
    )

    return jsonify({
        "message": "account created",
        "access_token": access_token,
        "user": user.to_dict()
    }), 201


@bp.post("/api/auth/login")
def login():
    email, password = _read_credentials()

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "wrong email or password"}), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"email": user.email},
    )

    return jsonify({
        "access_token": access_token,
        "user": user.to_dict()
    }), 200


@bp.get("/api/auth/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id)) if user_id is not None else None

    if not user:
        return jsonify({"error": "user not found"}), 404

    return jsonify({"user": user.to_dict()}), 200