from datetime import datetime
from uuid import uuid4
from .extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

def uuid_str():
    return str(uuid4())

class Crop(db.Model):
    __tablename__ = "crops"

    id = db.Column(db.String(36), primary_key=True, default=uuid_str)
    name = db.Column(db.String(120), nullable=False)
    stage = db.Column(db.String(40), nullable=False, default="Seedling")

    health = db.Column(db.Integer, nullable=False, default=75)
    last_watered_minutes = db.Column(db.Integer, nullable=False, default=0)
    auto_water = db.Column(db.Boolean, nullable=False, default=False)

    profile_label = db.Column(db.String(120), nullable=False, default="Generic profile")
    ideal_moisture_min = db.Column(db.Integer, nullable=False, default=55)
    ideal_moisture_max = db.Column(db.Integer, nullable=False, default=70)
    ideal_temp_min = db.Column(db.Integer, nullable=False, default=24)
    ideal_temp_max = db.Column(db.Integer, nullable=False, default=32)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    logs = db.relationship("IrrigationLog", backref="crop", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "stage": self.stage,
            "health": self.health,
            "lastWateredMinutes": self.last_watered_minutes,
            "autoWater": self.auto_water,
            "profileLabel": self.profile_label,
            "idealMoisture": {"min": self.ideal_moisture_min, "max": self.ideal_moisture_max},
            "idealTemp": {"min": self.ideal_temp_min, "max": self.ideal_temp_max},
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }

class IrrigationLog(db.Model):
    __tablename__ = "irrigation_logs"

    id = db.Column(db.String(36), primary_key=True, default=uuid_str)
    crop_id = db.Column(db.String(36), db.ForeignKey("crops.id"), nullable=False)

    event_type = db.Column(db.String(20), nullable=False)  # "Manual" or "Auto"
    before = db.Column(db.Integer, nullable=False)
    after = db.Column(db.Integer, nullable=False)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "cropId": self.crop_id,
            "type": self.event_type,
            "before": self.before,
            "after": self.after,
            "createdAt": self.created_at.isoformat(),
        }
    

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {"id": self.id, "email": self.email, "createdAt": self.created_at.isoformat()}