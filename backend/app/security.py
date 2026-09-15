# app/security.py
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password[:72])


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password[:72], hashed_password)


def generate_pin() -> str:
    """6-digit numeric PIN, zero-padded (e.g. '004821')."""
    return f"{secrets.randbelow(1_000_000):06d}"


def _create_token(subject_id: int, role: str, expires_delta: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject_id),
        "role": role,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(subject_id: int, role: str) -> str:
    return _create_token(subject_id, role, timedelta(minutes=settings.access_token_expire_minutes), "access")


def create_refresh_token(subject_id: int, role: str) -> str:
    return _create_token(subject_id, role, timedelta(days=settings.refresh_token_expire_days), "refresh")


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])