from flask import Flask
from flask_cors import CORS
from pathlib import Path

from .config import Config
from .extensions import db, migrate, jwt


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    jwt_secret = app.config.get("JWT_SECRET_KEY")
    if not jwt_secret or jwt_secret.startswith("replace-with-"):
        raise RuntimeError(
            "JWT_SECRET_KEY is missing. Set a long random value in src/backend/.env."
        )

    Path(app.config["INSTANCE_DIR"]).mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Import models so Flask-Migrate can detect them
    from .models import Crop, IrrigationLog, User  # noqa: F401

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
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
