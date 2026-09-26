"""Smoke tests covering the flows that matter most: auth, prerequisite
enforcement, retakes, and cross-student data isolation.

Run with: pytest
Uses a throwaway SQLite file so it never touches your real credit_tracker.db.
"""
import os

os.environ["DATABASE_URL"] = "sqlite:///./test_credit_tracker.db"

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app
from app.rate_limit import limiter
from app import models
from app.database import SessionLocal
from app.security import hash_password, verify_password
from app.services import progress_service

limiter.enabled = False  # don't let the login rate limit interfere with test runs

client = TestClient(app)


@pytest.fixture(autouse=True, scope="module")
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    programme = models.Programme(code="TEST01", name="Test Programme", total_credits_required=60)
    db.add(programme)
    db.flush()

    m1 = models.Module(code="M1", name="Module One", credits=20, category="core", level=1)
    m2 = models.Module(code="M2", name="Module Two", credits=20, category="core", level=1)
    db.add_all([m1, m2])
    db.flush()
    m2.prerequisites = [m1]

    db.add(models.ProgrammeModule(programme=programme, module=m1, is_compulsory=True))
    db.add(models.ProgrammeModule(programme=programme, module=m2, is_compulsory=True))
    db.commit()
    yield
    db.close()
    if os.path.exists("test_credit_tracker.db"):
        os.remove("test_credit_tracker.db")


def register_and_login(student_number="S1", password="123456"):
    """Create a test student directly in the throwaway DB, then exercise real PIN login."""
    email = f"{student_number.lower()}@example.com"
    db = SessionLocal()
    programme = db.query(models.Programme).filter(models.Programme.code == "TEST01").first()
    student = models.Student(
        name="Test Student",
        student_number=student_number,
        email=email,
        programme_id=programme.id,
        pin_hash=hash_password(password),
        is_active=True,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    assert student.student_number == student_number
    assert student.email == email
    assert student.is_active is True
    assert verify_password(password, student.pin_hash)
    db.close()

    resp = client.post(
        "/auth/login",
        json={"student_number": student_number, "email": email, "pin": password},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def test_register_and_login():
    token = register_and_login("S100")
    assert token

    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["student_number"] == "S100"


def test_wrong_password_rejected():
    register_and_login("S101")
    resp = client.post(
        "/auth/login",
        json={"student_number": "S101", "email": "s101@example.com", "pin": "000000"},
    )
    assert resp.status_code == 401


def test_unauthenticated_request_rejected():
    resp = client.get("/progress/summary")
    assert resp.status_code == 401


def _record_enrolment(student_number, module_code, semester, grade, status_value, attempt=1):
    """Insert admin-managed academic history directly into the isolated test DB."""
    db = SessionLocal()
    student = db.query(models.Student).filter(models.Student.student_number == student_number).first()
    module = db.query(models.Module).filter(models.Module.code == module_code).first()
    enrolment = models.Enrolment(
        student_id=student.id,
        module_id=module.id,
        semester=semester,
        grade=grade,
        status=status_value,
        attempt=attempt,
    )
    db.add(enrolment)
    db.commit()
    db.refresh(enrolment)
    enrolment_id = enrolment.id
    db.close()
    return enrolment_id


def test_prerequisite_eligibility():
    register_and_login("S102")
    db = SessionLocal()
    student = db.query(models.Student).filter(models.Student.student_number == "S102").first()
    m2 = db.query(models.Module).filter(models.Module.code == "M2").first()

    missing = progress_service.check_prerequisites_met(db, student, m2)
    assert "M1" in missing

    m1 = db.query(models.Module).filter(models.Module.code == "M1").first()
    db.add(models.Enrolment(
        student_id=student.id,
        module_id=m1.id,
        semester="2025-S1",
        grade=65,
        status="completed",
        attempt=1,
    ))
    db.commit()
    missing = progress_service.check_prerequisites_met(db, student, m2)
    db.close()
    assert missing == []


def test_completion_and_retake_summary():
    token = register_and_login("S103")
    headers = {"Authorization": f"Bearer {token}"}

    _record_enrolment("S103", "M1", "2025-S1", 30, "failed", 1)
    summary = client.get("/progress/summary", headers=headers).json()
    assert summary["modules_failed_pending_retake"] == 1
    assert summary["credits_completed"] == 0

    _record_enrolment("S103", "M1", "2025-S2", 65, "completed", 2)
    summary = client.get("/progress/summary", headers=headers).json()
    assert summary["modules_failed_pending_retake"] == 0
    assert summary["credits_completed"] == 20


def test_students_cannot_see_each_others_data():
    token_a = register_and_login("S104")
    token_b = register_and_login("S105")

    _record_enrolment("S104", "M1", "2025-S1", 80, "completed", 1)

    summary_b = client.get("/progress/summary", headers={"Authorization": f"Bearer {token_b}"}).json()
    assert summary_b["credits_completed"] == 0  # student B unaffected by student A's completion


def test_completed_history_is_read_only_through_progress_api():
    token = register_and_login("S106")
    headers = {"Authorization": f"Bearer {token}"}
    enrolment_id = _record_enrolment("S106", "M1", "2025-S1", 80, "completed", 1)

    history = client.get("/progress/history", headers=headers)
    assert history.status_code == 200
    assert any(item["id"] == enrolment_id and item["status"] == "completed" for item in history.json())

    # Student progress API intentionally exposes no DELETE enrolment route.
    resp = client.delete(f"/progress/enrolments/{enrolment_id}", headers=headers)
    assert resp.status_code == 404
