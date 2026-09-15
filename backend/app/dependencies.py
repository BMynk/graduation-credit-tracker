# app/dependencies.py
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/verify-pin", auto_error=False)


def _decode_access_token(token: str, expected_role: str) -> int:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = decode_token(token)
        if payload.get("type") != "access" or payload.get("role") != expected_role:
            raise credentials_exception
        return int(payload.get("sub"))
    except (jwt.PyJWTError, ValueError, TypeError):
        raise credentials_exception


def get_current_student(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.Student:
    student_id = _decode_access_token(token, "student")
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if student is None or not student.is_active:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    return student


def get_current_admin(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.Admin:
    admin_id = _decode_access_token(token, "admin")
    admin = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if admin is None or not admin.is_active:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    return admin


def get_current_super_admin(
    current_admin: models.Admin = Depends(get_current_admin),
) -> models.Admin:
    if not current_admin.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin privileges required",
        )
    return current_admin


def get_impersonation_info(token: str = Depends(oauth2_scheme)) -> dict:
    """Extract impersonation info from a student token if present."""
    if not token:
        return {}
    try:
        payload = decode_token(token)
        if payload.get("is_impersonation"):
            return {
                "is_impersonation": True,
                "impersonated_by": payload.get("impersonated_by"),
                "impersonated_by_name": payload.get("impersonated_by_name"),
            }
    except:
        pass
    return {"is_impersonation": False}