# app/config.py

from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = "sqlite:///./credit_tracker.db"

    # JWT
    secret_key: str = "change-this-secret-key-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Gemini AI
    gemini_api_key: str = ""

    # Web search
    tavily_api_key: str = ""


    resend_api_key: str = ""


    email_test_recipient: str = ""
    

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Email (SMTP)
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@credit-tracker.com"
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False

    # Email dev mode - if True, logs PINs instead of sending real emails
    email_dev_mode: bool = True

    # Frontend base URL (for links in emails)
    base_url: str = "http://localhost:5173"

    # Academic thresholds
    pass_mark: float = 50.0
    typical_credits_per_semester: int = 48

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Create a single global settings instance
settings = Settings()