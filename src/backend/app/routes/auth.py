from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from ..extensions import db
from ..models import User
import json

bp = Blueprint("auth", __name__)


def _read_credentials():
    data = request.get_json(silent=True)

    # if frontend accidentally sends JSON string instead of object
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except Exception:
            data = {}

    # if body is still not a dict, avoid crashing
    if not isinstance(data, dict):
        data = {}

    raw_email = data.get("email")
    raw_password = data.get("password")
    email = raw_email.strip().lower() if isinstance(raw_email, str) else ""
    password = raw_password if isinstance(raw_password, str) else ""
    return email, password


@bp.post("/api/auth/register")
def register():
    email, password = _read_credentials()

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    if email.count("@") != 1 or any(character.isspace() for character in email):
        return jsonify({"error": "enter a valid email"}), 400
    if len(email) > 120:
        return jsonify({"error": "email must be 120 characters or fewer"}), 400

    if len(password) < 8:
        return jsonify({"error": "password must be at least 8 characters"}), 400
    if len(password) > 256:
        return jsonify({"error": "password must be 256 characters or fewer"}), 400

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
    if len(password) > 256:
        return jsonify({"error": "password must be 256 characters or fewer"}), 400

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
