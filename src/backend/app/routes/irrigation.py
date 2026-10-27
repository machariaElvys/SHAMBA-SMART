from flask import Blueprint, jsonify, request
from ..extensions import db
from ..models import Crop
from flask_jwt_extended import jwt_required

bp = Blueprint("irrigation", __name__)

@bp.get("/api/crops")
def list_crops():
    crops = Crop.query.order_by(Crop.created_at.desc()).all()
    return jsonify([c.to_dict() for c in crops])

@bp.post("/api/crops")

def create_crop():
    data = request.get_json(force=True) or {}

    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    crop = Crop(
        name=name,
        stage=data.get("stage") or "Seedling",
        health=int(data.get("health") or 75),
        last_watered_minutes=int(data.get("lastWateredMinutes") or 0),
        auto_water=bool(data.get("autoWater") or False),
        profile_label=data.get("profileLabel") or "Generic profile",
        ideal_moisture_min=int((data.get("idealMoisture") or {}).get("min", 55)),
        ideal_moisture_max=int((data.get("idealMoisture") or {}).get("max", 70)),
        ideal_temp_min=int((data.get("idealTemp") or {}).get("min", 24)),
        ideal_temp_max=int((data.get("idealTemp") or {}).get("max", 32)),
    )

    db.session.add(crop)
    db.session.commit()
    return jsonify(crop.to_dict()), 201

@bp.get("/api/crops/<crop_id>")

def get_crop(crop_id):
    crop = Crop.query.get(crop_id)
    if not crop:
        return jsonify({"error": "crop not found"}), 404
    return jsonify(crop.to_dict())

@bp.patch("/api/crops/<crop_id>")

def update_crop(crop_id):
    crop = Crop.query.get(crop_id)
    if not crop:
        return jsonify({"error": "crop not found"}), 404

    data = request.get_json(force=True) or {}

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "name cannot be empty"}), 400
        crop.name = name

    if "stage" in data:
        crop.stage = data.get("stage") or crop.stage

    if "health" in data:
        crop.health = int(data.get("health"))

    if "lastWateredMinutes" in data:
        crop.last_watered_minutes = int(data.get("lastWateredMinutes"))

    if "autoWater" in data:
        crop.auto_water = bool(data.get("autoWater"))

    if "profileLabel" in data:
        crop.profile_label = data.get("profileLabel") or crop.profile_label

    if "idealMoisture" in data:
        im = data.get("idealMoisture") or {}
        if "min" in im: crop.ideal_moisture_min = int(im["min"])
        if "max" in im: crop.ideal_moisture_max = int(im["max"])

    if "idealTemp" in data:
        it = data.get("idealTemp") or {}
        if "min" in it: crop.ideal_temp_min = int(it["min"])
        if "max" in it: crop.ideal_temp_max = int(it["max"])

    db.session.commit()
    return jsonify(crop.to_dict())

@bp.delete("/api/crops/<crop_id>")

def delete_crop(crop_id):
    crop = Crop.query.get(crop_id)
    if not crop:
        return jsonify({"error": "crop not found"}), 404

    db.session.delete(crop)
    db.session.commit()
    return jsonify({"ok": True})