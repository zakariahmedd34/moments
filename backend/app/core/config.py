import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_DIR = BACKEND_DIR.parent

load_dotenv(BACKEND_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    database_url: str
    jwt_secret: str
    jwt_lifetime_seconds: int
    imagekit_private_key: str | None
    imagekit_public_key: str | None
    imagekit_url: str | None
    frontend_dist: Path
    max_caption_length: int = 280


def load_settings() -> Settings:
    jwt_secret = os.getenv("JWT_SECRET")
    if not jwt_secret:
        raise RuntimeError("JWT_SECRET is not set. Copy backend/.env.example to backend/.env and fill it in.")

    default_database_url = f"sqlite+aiosqlite:///{(BACKEND_DIR / 'moments.db').as_posix()}"

    return Settings(
        database_url=os.getenv("DATABASE_URL") or default_database_url,
        jwt_secret=jwt_secret,
        jwt_lifetime_seconds=int(os.getenv("JWT_LIFETIME_SECONDS") or 60 * 60 * 24 * 7),
        imagekit_private_key=os.getenv("IMAGEKIT_PRIVATE_KEY"),
        imagekit_public_key=os.getenv("IMAGEKIT_PUBLIC_KEY"),
        imagekit_url=os.getenv("IMAGEKIT_URL"),
        frontend_dist=Path(os.getenv("FRONTEND_DIST") or PROJECT_DIR / "frontend" / "dist").resolve(),
    )


settings = load_settings()
