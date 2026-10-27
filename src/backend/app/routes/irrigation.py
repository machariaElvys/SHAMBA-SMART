from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import IrrigationLog
from .crops import _integer, _owned_crop

bp = Blueprint("irrigation", __name__)


@bp.get("/api/crops/<crop_id>/irrigation")
@jwt_required()
def list_irrigation(crop_id):
    crop = _owned_crop(crop_id)
    if not crop:
        return jsonify({"error": "crop not found"}), 404

    logs = (
        IrrigationLog.query.filter_by(crop_id=crop.id)
        .order_by(IrrigationLog.created_at.desc())
        .limit(20)
        .all()
    )
    return jsonify([log.to_dict() for log in logs])


@bp.post("/api/crops/<crop_id>/irrigation")
@jwt_required()
def create_irrigation(crop_id):
    crop = _owned_crop(crop_id)
    if not crop:
        return jsonify({"error": "crop not found"}), 404

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "request body must be a JSON object"}), 400

    event_type = data.get("type", "Manual")
    if event_type not in ("Manual", "Auto"):
        return jsonify({"error": "type must be Manual or Auto"}), 400

    try:
        before = _integer(data.get("before"), "before moisture", 0, 100)
        after = _integer(data.get("after"), "after moisture", 0, 100)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    log = IrrigationLog(crop_id=crop.id, event_type=event_type, before=before, after=after)
    crop.last_watered_minutes = 0
    db.session.add(log)
    db.session.commit()
    return jsonify(log.to_dict()), 201
