from flask import Flask
from flask_cors import CORS

from .config import Config
from .extensions import db, migrate, jwt


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    if not app.config.get("SQLALCHEMY_DATABASE_URI"):
        raise RuntimeError("DATABASE_URL is missing. Set it in your .env file.")

    db.init_app(app)

    from .models import Crop, IrrigationLog, User  # noqa: F401

    migrate.init_app(app, db)
    jwt.init_app(app)

    # Parse CORS origins correctly (comma-separated string -> list)
    raw_origins = app.config.get("CORS_ORIGINS", "")
    if isinstance(raw_origins, str):
        origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
    elif isinstance(raw_origins, (list, tuple)):
        origins = list(raw_origins)
    else:
        origins = []

    if not origins:
        origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

    CORS(
        app,
        resources={r"/api/*": {"origins": origins}},
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    from .routes.health import bp as health_bp
    from .routes.crops import bp as crops_bp
    from .routes.irrigation import bp as irrigation_bp
    from .routes.auth import bp as auth_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(crops_bp)
    app.register_blueprint(irrigation_bp)
    app.register_blueprint(auth_bp)

    return app