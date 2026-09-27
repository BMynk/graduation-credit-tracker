import jwt
from fastapi import HTTPException
from starlette.requests import Request
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models, schemas
from app.config import settings
from app.database import Base
from app.dependencies import get_current_admin
from app.routers import admin, admin_management, auth
from app.security import decode_token, hash_password


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SessionLocal = sessionmaker(bind=engine)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def _request():
    return Request({"type": "http", "method": "POST", "path": "/admin/login", "headers": [], "client": ("127.0.0.1", 12345)})


def _admin(db, username="auditadmin", password="StrongPassword123!", super_admin=True):
    row = models.Admin(
        name="Audit Admin",
        username=username,
        hashed_password=hash_password(password),
        is_active=True,
        is_super_admin=super_admin,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def test_admin_login_tokens_include_current_token_version():
    db = SessionLocal()
    try:
        row = _admin(db)
        pair = admin.admin_login(
            request=_request(),
            payload=schemas.AdminLogin(username=row.username, password="StrongPassword123!"),
            db=db,
        )
        assert decode_token(pair.access_token)["token_version"] == 0
        assert decode_token(pair.refresh_token)["token_version"] == 0
    finally:
        db.close()


def test_password_change_invalidates_old_access_and_refresh_tokens():
    db = SessionLocal()
    try:
        row = _admin(db)
        pair = admin.admin_login(
            request=_request(),
            payload=schemas.AdminLogin(username=row.username, password="StrongPassword123!"),
            db=db,
        )

        admin_management.change_password(
            schemas.AdminPasswordChange(
                current_password="StrongPassword123!",
                new_password="DifferentPassword456!",
            ),
            current_admin=row,
            db=db,
        )
        db.refresh(row)
        assert row.token_version == 1

        from fastapi.security import HTTPAuthorizationCredentials
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=pair.access_token)
        try:
            get_current_admin(credentials=credentials, db=db)
            assert False, "Old access token should be rejected after password change"
        except HTTPException as exc:
            assert exc.status_code == 401

        try:
            auth.refresh(schemas.RefreshRequest(refresh_token=pair.refresh_token), db=db)
            assert False, "Old refresh token should be rejected after password change"
        except HTTPException as exc:
            assert exc.status_code == 401
    finally:
        db.close()


def test_super_admin_reset_invalidates_target_admin_tokens():
    db = SessionLocal()
    try:
        super_admin = _admin(db, username="superadmin", password="SuperPassword123!")
        target = _admin(db, username="targetadmin", password="TargetPassword123!", super_admin=False)
        pair = admin.admin_login(
            request=_request(),
            payload=schemas.AdminLogin(username=target.username, password="TargetPassword123!"),
            db=db,
        )

        admin_management.reset_admin_password(
            target.id,
            schemas.AdminPasswordReset(new_password="ResetPassword456!"),
            current_admin=super_admin,
            db=db,
        )
        db.refresh(target)
        assert target.token_version == 1

        try:
            auth.refresh(schemas.RefreshRequest(refresh_token=pair.refresh_token), db=db)
            assert False, "Reset password must invalidate target admin refresh tokens"
        except HTTPException as exc:
            assert exc.status_code == 401
    finally:
        db.close()
