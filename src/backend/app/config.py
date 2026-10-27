import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent          # .../src/backend/app
BACKEND_DIR = BASE_DIR.parent                       # .../src/backend
load_dotenv(BACKEND_DIR / ".env")


class Config:
    BACKEND_DIR = BACKEND_DIR
    INSTANCE_DIR = BACKEND_DIR / "instance"
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{(INSTANCE_DIR / 'shamba_smart.db').as_posix()}",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)

    _cors_raw = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    CORS_ORIGINS = [origin.strip() for origin in _cors_raw.split(",") if origin.strip()]
