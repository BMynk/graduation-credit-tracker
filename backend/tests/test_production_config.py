import pytest
from pydantic import ValidationError

from app.config import Settings


def test_production_rejects_default_jwt_secret():
    with pytest.raises(ValidationError):
        Settings(
            environment="production",
            secret_key="change-this-secret-key-in-production",
            email_dev_mode=False,
            cors_origins="https://example.edu",
        )


def test_production_rejects_email_dev_mode():
    with pytest.raises(ValidationError):
        Settings(
            environment="production",
            secret_key="x" * 32,
            email_dev_mode=True,
            cors_origins="https://example.edu",
        )


def test_production_rejects_localhost_cors():
    with pytest.raises(ValidationError):
        Settings(
            environment="production",
            secret_key="x" * 32,
            email_dev_mode=False,
            cors_origins="http://localhost:5173",
        )


def test_production_accepts_explicit_secure_settings():
    settings = Settings(
        environment="production",
        secret_key="x" * 32,
        email_dev_mode=False,
        cors_origins="https://graduation-credit-tracker.vercel.app",
    )
    assert settings.environment == "production"
