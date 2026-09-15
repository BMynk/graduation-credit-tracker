# app/routers/auth.py
from datetime import datetime

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_student
from app.email_service import send_login_pin_email
from app.rate_limit import limiter
from app.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_pin,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/request-pin", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("3/minute")
def request_pin(request: Request, payload: schemas.PinRequest, db: Session = Depends(get_db)):
    """Self-service: generates a fresh PIN and emails it to the student.
    This REPLACES their existing PIN - the old one stops working. Always
    returns 204 regardless of whether the student/email match, so this
    can't be used to check which student numbers or emails are valid."""
    student = (
        db.query(models.Student)
        .filter(models.Student.student_number == payload.student_number)
        .first()
    )
    if student and student.is_active and student.email.lower() == payload.email.lower():
        pin = generate_pin()
        student.pin_hash = hash_password(pin)
        db.commit()
        send_login_pin_email(student.email, student.name, pin)
    # No else branch - deliberately silent on mismatch to avoid leaking
    # which student numbers or emails exist in the system.


@router.post("/login", response_model=schemas.TokenPair)
@limiter.limit("10/minute")
def login(request: Request, payload: schemas.StudentLoginRequest, db: Session = Depends(get_db)):
    student = (
        db.query(models.Student)
        .filter(models.Student.student_number == payload.student_number)
        .first()
    )
    generic_error = HTTPException(status_code=401, detail="Invalid student number, email, or PIN")

    if not student or not student.is_active:
        raise generic_error
    if student.email.lower() != payload.email.lower():
        raise generic_error
    if not student.pin_hash or not verify_password(payload.pin, student.pin_hash):
        raise generic_error

    return schemas.TokenPair(
        access_token=create_access_token(student.id, "student"),
        refresh_token=create_refresh_token(student.id, "student"),
    )


@router.post("/refresh", response_model=schemas.TokenPair)
def refresh(payload: schemas.RefreshRequest, db: Session = Depends(get_db)):
    try:
        decoded = decode_token(payload.refresh_token)
        if decoded.get("type") != "refresh":
            raise ValueError("wrong token type")
        subject_id = int(decoded.get("sub"))
        role = decoded.get("role")
    except (jwt.PyJWTError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    if role == "student":
        entity = db.query(models.Student).filter(models.Student.id == subject_id).first()
    elif role == "admin":
        entity = db.query(models.Admin).filter(models.Admin.id == subject_id).first()
    else:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    if entity is None or not entity.is_active:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    return schemas.TokenPair(
        access_token=create_access_token(subject_id, role),
        refresh_token=create_refresh_token(subject_id, role),
    )


@router.get("/me", response_model=schemas.StudentOut)
def me(current_student: models.Student = Depends(get_current_student)):
    return current_student