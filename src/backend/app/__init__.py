from flask import Flask
from flask_cors import CORS
from .config import Config
from .extensions import db, migrate

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    if not app.config.get("SQLALCHEMY_DATABASE_URI"):
        raise RuntimeError("DATABASE_URL is missing. Set it in your .env file.")

    db.init_app(app)
    migrate.init_app(app, db)

    origins = app.config.get("CORS_ORIGINS", [])
    CORS(app, resources={r"/api/*": {"origins": origins or "*"}})

    from .routes.health import bp as health_bp
    from .routes.crops import bp as crops_bp
    from .routes.irrigation import bp as irrigation_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(crops_bp)
    app.register_blueprint(irrigation_bp)

    return app