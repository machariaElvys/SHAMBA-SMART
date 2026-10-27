from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models import Crop

bp = Blueprint("crops", __name__)


def _payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ValueError("request body must be a JSON object")
    return data


def _integer(value, label, minimum, maximum):
    if isinstance(value, bool):
        raise ValueError(f"{label} must be a number")
    if isinstance(value, float) and not value.is_integer():
        raise ValueError(f"{label} must be a whole number")
    try:
        number = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{label} must be a whole number") from None
    if number < minimum or number > maximum:
        raise ValueError(f"{label} must be between {minimum} and {maximum}")
    return number


def _range(data, key, label, defaults, minimum, maximum):
    value = data.get(key, {})
    if value is None:
        value = {}
    if not isinstance(value, dict):
        raise ValueError(f"{label} must contain min and max values")
    low = _integer(value.get("min", defaults[0]), f"{label} minimum", minimum, maximum)
    high = _integer(value.get("max", defaults[1]), f"{label} maximum", minimum, maximum)
    if low > high:
        raise ValueError(f"{label} minimum cannot be greater than its maximum")
    return low, high


def _owned_crop(crop_id):
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None
    return Crop.query.filter_by(id=crop_id, user_id=user_id).first()


@bp.get("/api/crops")
@jwt_required()
def list_crops():
    user_id = int(get_jwt_identity())
    crops = Crop.query.filter_by(user_id=user_id).order_by(Crop.created_at.desc()).all()
    return jsonify([crop.to_dict() for crop in crops])


@bp.post("/api/crops")
@jwt_required()
def create_crop():
    try:
        data = _payload()
        raw_name = data.get("name") or ""
        if not isinstance(raw_name, str):
            raise ValueError("crop name must be text")
        name = raw_name.strip()
        if not name:
            raise ValueError("crop name is required")
        if len(name) > 120:
            raise ValueError("crop name must be 120 characters or fewer")

        raw_stage = data.get("stage") or "Seedling"
        raw_profile_label = data.get("profileLabel") or "Generic profile"
        if not isinstance(raw_stage, str) or not isinstance(raw_profile_label, str):
            raise ValueError("growth stage and profile label must be text")
        stage = raw_stage.strip()
        profile_label = raw_profile_label.strip()
        if not stage or len(stage) > 40:
            raise ValueError("growth stage must be 1 to 40 characters")
        if not profile_label or len(profile_label) > 120:
            raise ValueError("profile label must be 1 to 120 characters")

        moisture_min, moisture_max = _range(data, "idealMoisture", "ideal moisture", (55, 70), 0, 100)
        temp_min, temp_max = _range(data, "idealTemp", "ideal temperature", (24, 32), -20, 80)
        auto_water = data.get("autoWater", False)
        if not isinstance(auto_water, bool):
            raise ValueError("autoWater must be true or false")

        crop = Crop(
            user_id=int(get_jwt_identity()),
            name=name,
            stage=stage,
            health=_integer(data.get("health", 75), "health", 0, 100),
            last_watered_minutes=_integer(data.get("lastWateredMinutes", 0), "last watered minutes", 0, 100000000),
            auto_water=auto_water,
            profile_label=profile_label,
            ideal_moisture_min=moisture_min,
            ideal_moisture_max=moisture_max,
            ideal_temp_min=temp_min,
            ideal_temp_max=temp_max,
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    db.session.add(crop)
    db.session.commit()
    return jsonify(crop.to_dict()), 201


@bp.get("/api/crops/<crop_id>")
@jwt_required()
def get_crop(crop_id):
    crop = _owned_crop(crop_id)
    if not crop:
        return jsonify({"error": "crop not found"}), 404
    return jsonify(crop.to_dict())


@bp.patch("/api/crops/<crop_id>")
@jwt_required()
def update_crop(crop_id):
    crop = _owned_crop(crop_id)
    if not crop:
        return jsonify({"error": "crop not found"}), 404

    try:
        data = _payload()
        if "name" in data:
            raw_name = data.get("name") or ""
            if not isinstance(raw_name, str):
                raise ValueError("crop name must be text")
            name = raw_name.strip()
            if not name or len(name) > 120:
                raise ValueError("crop name must be 1 to 120 characters")
            crop.name = name

        if "stage" in data:
            raw_stage = data.get("stage") or ""
            if not isinstance(raw_stage, str):
                raise ValueError("growth stage must be text")
            stage = raw_stage.strip()
            if not stage or len(stage) > 40:
                raise ValueError("growth stage must be 1 to 40 characters")
            crop.stage = stage

        if "health" in data:
            crop.health = _integer(data["health"], "health", 0, 100)
        if "lastWateredMinutes" in data:
            crop.last_watered_minutes = _integer(data["lastWateredMinutes"], "last watered minutes", 0, 100000000)
        if "autoWater" in data:
            if not isinstance(data["autoWater"], bool):
                raise ValueError("autoWater must be true or false")
            crop.auto_water = data["autoWater"]
        if "profileLabel" in data:
            raw_label = data.get("profileLabel") or ""
            if not isinstance(raw_label, str):
                raise ValueError("profile label must be text")
            label = raw_label.strip()
            if not label or len(label) > 120:
                raise ValueError("profile label must be 1 to 120 characters")
            crop.profile_label = label

        if "idealMoisture" in data:
            crop.ideal_moisture_min, crop.ideal_moisture_max = _range(
                data, "idealMoisture", "ideal moisture", (crop.ideal_moisture_min, crop.ideal_moisture_max), 0, 100
            )
        if "idealTemp" in data:
            crop.ideal_temp_min, crop.ideal_temp_max = _range(
                data, "idealTemp", "ideal temperature", (crop.ideal_temp_min, crop.ideal_temp_max), -20, 80
            )
    except ValueError as error:
        db.session.rollback()
        return jsonify({"error": str(error)}), 400

    db.session.commit()
    return jsonify(crop.to_dict())


@bp.delete("/api/crops/<crop_id>")
@jwt_required()
def delete_crop(crop_id):
    crop = _owned_crop(crop_id)
    if not crop:
        return jsonify({"error": "crop not found"}), 404
    db.session.delete(crop)
    db.session.commit()
    return jsonify({"ok": True})
