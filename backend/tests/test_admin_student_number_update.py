import os
os.environ.setdefault("DATABASE_URL", "sqlite:///./student_number_update_test.db")
os.environ.setdefault("SECRET_KEY", "student-number-update-test-secret")

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models, schemas
from app.database import Base
from app.routers.admin import update_student


def _session():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine, autocommit=False, autoflush=False)()


def _students(db):
    programme = models.Programme(code="TEST", name="Test", total_credits_required=384)
    db.add(programme); db.flush()
    a = models.Student(name="224040182", student_number="Zothani Nzimande", email="a@example.com", programme_id=programme.id, current_year=2)
    b = models.Student(name="Other Student", student_number="999999999", email="b@example.com", programme_id=programme.id, current_year=1)
    db.add_all([a, b]); db.commit(); db.refresh(a); db.refresh(b)
    return a, b


def test_admin_can_correct_swapped_name_and_student_number():
    db = _session()
    try:
        student, _ = _students(db)
        result = update_student(
            student.id,
            schemas.AdminStudentUpdate(name="Zothani Nzimande", student_number="224040182"),
            current_admin=None,
            db=db,
        )
        assert result.id == student.id
        assert result.name == "Zothani Nzimande"
        assert result.student_number == "224040182"
    finally:
        db.close()


def test_duplicate_student_number_is_rejected():
    db = _session()
    try:
        student, other = _students(db)
        try:
            update_student(
                student.id,
                schemas.AdminStudentUpdate(student_number=other.student_number),
                current_admin=None,
                db=db,
            )
            assert False, "Expected duplicate student number to be rejected"
        except HTTPException as exc:
            assert exc.status_code == 409
    finally:
        db.close()
