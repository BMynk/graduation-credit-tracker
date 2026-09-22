# app/routers/auth.py

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_student
from app.email_service import send_pin_reset_email
from app.rate_limit import limiter
from app.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_pin,
    hash_password,
    verify_password,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ============================================================
# RESET / REQUEST STUDENT PIN
# ============================================================

@router.post(
    "/request-pin",
    status_code=status.HTTP_204_NO_CONTENT,
)
@limiter.limit("3/minute")
def request_pin(
    request: Request,
    payload: schemas.PinRequest,
    db: Session = Depends(get_db),
):
    """
    Generate and email a new student PIN.

    This endpoint is intended for students who have forgotten
    their existing PIN.

    Security behaviour:
    - The response is always the same whether the supplied
      student number/email matches an account or not.
    - A new PIN is only stored after the reset email has been
      accepted for delivery.
    - If email delivery fails, the existing PIN remains valid.
    - Only the hash of the new PIN is stored.
    - The plaintext PIN is never stored in the database.
    """

    student = (
        db.query(models.Student)
        .filter(
            models.Student.student_number
            == payload.student_number
        )
        .first()
    )

    # Deliberately return the same response whether the account
    # exists or not. This helps prevent account enumeration.
    if (
        not student
        or not student.is_active
        or student.email.lower()
        != payload.email.lower()
    ):
        return None

    new_pin = generate_pin()

    try:
        # Send the replacement PIN before changing the database.
        #
        # If email delivery fails, the student's existing PIN
        # remains unchanged and can still be used.
        send_pin_reset_email(
            student.email,
            student.name,
            new_pin,
        )

        # Email was accepted for delivery, so replace the old PIN.
        student.pin_hash = hash_password(
            new_pin
        )

        db.commit()

    except Exception:
        # Do not leave a new PIN in the database if the email
        # could not be sent.
        db.rollback()

        # Keep the external response identical.
        # This prevents account enumeration.
        return None

    return None


# ============================================================
# STUDENT LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=schemas.TokenPair,
)
@limiter.limit("10/minute")
def login(
    request: Request,
    payload: schemas.StudentLoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate a student using their permanent PIN.

    The student can continue using the same PIN for future
    logins until they request a new PIN.

    When a new PIN is requested successfully, the previous PIN
    is replaced and immediately stops working.
    """

    generic_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid student number, email, or PIN",
    )

    # --------------------------------------------------------
    # Find student
    # --------------------------------------------------------

    student = (
        db.query(models.Student)
        .filter(
            models.Student.student_number
            == payload.student_number
        )
        .first()
    )

    # --------------------------------------------------------
    # Account must exist and be active
    # --------------------------------------------------------

    if (
        not student
        or not student.is_active
    ):
        raise generic_error

    # --------------------------------------------------------
    # Email must match
    # --------------------------------------------------------

    if (
        student.email.lower()
        != payload.email.lower()
    ):
        raise generic_error

    # --------------------------------------------------------
    # Student must have a PIN
    # --------------------------------------------------------

    if not student.pin_hash:
        raise generic_error

    # --------------------------------------------------------
    # Verify PIN
    # --------------------------------------------------------

    if not verify_password(
        payload.pin,
        student.pin_hash,
    ):
        raise generic_error

    # IMPORTANT:
    #
    # Do NOT delete pin_hash after successful login.
    #
    # The student keeps using this PIN until they request
    # a replacement PIN.

    # --------------------------------------------------------
    # Issue authentication tokens
    # --------------------------------------------------------

    return schemas.TokenPair(
        access_token=create_access_token(
            student.id,
            "student",
        ),
        refresh_token=create_refresh_token(
            student.id,
            "student",
        ),
    )


# ============================================================
# REFRESH ACCESS TOKEN
# ============================================================

@router.post(
    "/refresh",
    response_model=schemas.TokenPair,
)
def refresh(
    payload: schemas.RefreshRequest,
    db: Session = Depends(get_db),
):
    """
    Exchange a valid refresh token for a new access token
    and refresh token pair.
    """

    try:
        decoded = decode_token(
            payload.refresh_token
        )

        # Only refresh tokens are allowed here.
        if decoded.get("type") != "refresh":
            raise ValueError(
                "wrong token type"
            )

        subject_id = int(
            decoded.get("sub")
        )

        role = decoded.get("role")

    except (
        jwt.PyJWTError,
        ValueError,
        TypeError,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Invalid or expired refresh token"
            ),
        )

    # --------------------------------------------------------
    # Student refresh
    # --------------------------------------------------------

    if role == "student":
        entity = (
            db.query(models.Student)
            .filter(
                models.Student.id
                == subject_id
            )
            .first()
        )

    # --------------------------------------------------------
    # Administrator refresh
    # --------------------------------------------------------

    elif role == "admin":
        entity = (
            db.query(models.Admin)
            .filter(
                models.Admin.id
                == subject_id
            )
            .first()
        )

    # --------------------------------------------------------
    # Invalid role
    # --------------------------------------------------------

    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Invalid or expired refresh token"
            ),
        )

    # --------------------------------------------------------
    # Account must still exist and be active
    # --------------------------------------------------------

    if (
        entity is None
        or not entity.is_active
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Invalid or expired refresh token"
            ),
        )

    # --------------------------------------------------------
    # Generate fresh token pair
    # --------------------------------------------------------

    return schemas.TokenPair(
        access_token=create_access_token(
            subject_id,
            role,
        ),
        refresh_token=create_refresh_token(
            subject_id,
            role,
        ),
    )


# ============================================================
# CURRENT STUDENT
# ============================================================

@router.get(
    "/me",
    response_model=schemas.StudentOut,
)
def me(
    current_student: models.Student = Depends(
        get_current_student
    ),
):
    """
    Return the currently authenticated student.
    """

    return current_student