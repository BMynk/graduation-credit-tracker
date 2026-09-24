# app/dependencies.py

import jwt

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.security import decode_token


# ============================================================
# Bearer token
# ============================================================

bearer_scheme = HTTPBearer(
    auto_error=False,
    scheme_name="BearerAuth",
    description="Paste an access token returned by /auth/login or /admin/login.",
)


# ============================================================
# Access-token decoder
# ============================================================

def _decode_access_token(
    token: str,
    expected_role: str,
) -> int:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    if not token:
        raise credentials_exception

    try:
        payload = decode_token(token)

        if (
            payload.get("type") != "access"
            or payload.get("role") != expected_role
        ):
            raise credentials_exception

        subject = payload.get("sub")

        if subject is None:
            raise credentials_exception

        return int(subject)

    except (
        jwt.PyJWTError,
        ValueError,
        TypeError,
    ):
        raise credentials_exception


# ============================================================
# Current student
# ============================================================

def get_current_student(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.Student:
    token = credentials.credentials if credentials else ""
    student_id = _decode_access_token(
        token,
        "student",
    )

    student = (
        db.query(models.Student)
        .filter(
            models.Student.id == student_id
        )
        .first()
    )

    if student is None or not student.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    return student


# ============================================================
# Real student only (blocks admin impersonation)
# ============================================================

def get_current_real_student(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.Student:
    token = credentials.credentials if credentials else ""

    try:
        payload = decode_token(token)
    except (jwt.PyJWTError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    if payload.get("is_impersonation") or payload.get("impersonated_by") is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Community conversations are private and unavailable in admin View as Student mode",
        )

    return get_current_student(credentials, db)


# ============================================================
# Current admin
# ============================================================

def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.Admin:
    token = credentials.credentials if credentials else ""
    admin_id = _decode_access_token(
        token,
        "admin",
    )

    admin = (
        db.query(models.Admin)
        .filter(
            models.Admin.id == admin_id
        )
        .first()
    )

    if admin is None or not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    return admin


# ============================================================
# Current super admin
# ============================================================

def get_current_super_admin(
    current_admin: models.Admin = Depends(
        get_current_admin
    ),
) -> models.Admin:
    if not current_admin.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin privileges required",
        )

    return current_admin


# ============================================================
# Optional authenticated user
# Used by the global AI assistant.
#
# No token:
#     Guest
#
# Valid student token:
#     Authenticated student
#
# Valid admin token:
#     Authenticated admin
#
# Invalid/expired token:
#     Treated as unauthenticated by this optional dependency.
#
# IMPORTANT:
# The browser-provided "user_role" value must NEVER be used
# as authorization for private student/admin information.
# ============================================================

def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    token = credentials.credentials if credentials else ""
    if not token:
        return None

    try:
        payload = decode_token(token)

        # Only access tokens are accepted.
        if payload.get("type") != "access":
            return None

        role = payload.get("role")
        subject = payload.get("sub")

        if subject is None:
            return None

        user_id = int(subject)

        # ----------------------------------------------------
        # Student
        # ----------------------------------------------------

        if role == "student":
            student = (
                db.query(models.Student)
                .filter(
                    models.Student.id == user_id
                )
                .first()
            )

            if (
                student is None
                or not student.is_active
            ):
                return None

            return {
                "role": "student",
                "user": student,
            }

        # ----------------------------------------------------
        # Admin
        # ----------------------------------------------------

        if role == "admin":
            admin = (
                db.query(models.Admin)
                .filter(
                    models.Admin.id == user_id
                )
                .first()
            )

            if (
                admin is None
                or not admin.is_active
            ):
                return None

            return {
                "role": "admin",
                "user": admin,
            }

        return None

    except (
        jwt.PyJWTError,
        ValueError,
        TypeError,
    ):
        return None