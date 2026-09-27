import jwt
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models, schemas
from app.database import Base
from app.dependencies import get_current_student
from app.routers import auth
from app.security import create_access_token, create_refresh_token, decode_token


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SessionLocal = sessionmaker(bind=engine)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def _student(db):
    programme = models.Programme(
        code="SESSIONTEST",
        name="Session Test",
        total_credits_required=384,
    )
    db.add(programme)
    db.flush()
    student = models.Student(
        student_number="SESSION001",
        name="Session Student",
        email="session@example.edu",
        pin_hash="hash",
        programme_id=programme.id,
        current_year=1,
        is_active=True,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def test_student_access_and_refresh_tokens_require_current_version():
    db = SessionLocal()
    try:
        student = _student(db)
        access = create_access_token(student.id, "student", student.token_version)
        refresh = create_refresh_token(student.id, "student", student.token_version)

        student.token_version += 1
        db.commit()

        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=access,
        )
        try:
            get_current_student(credentials=credentials, db=db)
            assert False, "Old student access token should be rejected"
        except HTTPException as exc:
            assert exc.status_code == 401

        try:
            auth.refresh(
                schemas.RefreshRequest(refresh_token=refresh),
                db=db,
            )
            assert False, "Old student refresh token should be rejected"
        except HTTPException as exc:
            assert exc.status_code == 401
    finally:
        db.close()


def test_current_student_refresh_preserves_token_version():
    db = SessionLocal()
    try:
        student = _student(db)
        student.token_version = 3
        db.commit()

        refresh = create_refresh_token(student.id, "student", 3)
        pair = auth.refresh(
            schemas.RefreshRequest(refresh_token=refresh),
            db=db,
        )

        assert decode_token(pair.access_token)["token_version"] == 3
        assert decode_token(pair.refresh_token)["token_version"] == 3
    finally:
        db.close()
