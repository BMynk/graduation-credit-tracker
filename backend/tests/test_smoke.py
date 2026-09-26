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
from app.security import hash_password

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


def register_and_login(student_number="S1", password="TestPass123!"):
    """Create a test student directly in the throwaway DB, then exercise real PIN login."""
    email = f"{student_number.lower()}@example.test"
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
        json={"student_number": "S101", "email": "s101@example.test", "pin": "wrong"},
    )
    assert resp.status_code == 401


def test_unauthenticated_request_rejected():
    resp = client.get("/progress/summary")
    assert resp.status_code == 401


def test_prerequisite_enforced():
    token = register_and_login("S102")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post(
        "/progress/complete-module",
        json={"module_code": "M2", "semester": "2025-S1", "grade": 80},
        headers=headers,
    )
    assert resp.status_code == 409
    assert "missing_prerequisites" in resp.json()["detail"]


def test_completion_and_retake_flow():
    token = register_and_login("S103")
    headers = {"Authorization": f"Bearer {token}"}

    # Fail M1
    resp = client.post(
        "/progress/complete-module",
        json={"module_code": "M1", "semester": "2025-S1", "grade": 30},
        headers=headers,
    )
    assert resp.status_code == 201
    assert resp.json()["status"] == "failed"

    summary = client.get("/progress/summary", headers=headers).json()
    assert summary["modules_failed_pending_retake"] == 1
    assert summary["credits_completed"] == 0

    # Retake and pass
    resp = client.post(
        "/progress/complete-module",
        json={"module_code": "M1", "semester": "2025-S2", "grade": 65},
        headers=headers,
    )
    assert resp.status_code == 201
    assert resp.json()["status"] == "completed"
    assert resp.json()["attempt"] == 2

    summary = client.get("/progress/summary", headers=headers).json()
    assert summary["modules_failed_pending_retake"] == 0
    assert summary["credits_completed"] == 20

    # Now M2's prerequisite is satisfied
    resp = client.post(
        "/progress/complete-module",
        json={"module_code": "M2", "semester": "2025-S2", "grade": 90},
        headers=headers,
    )
    assert resp.status_code == 201

    # Duplicate completion of an already-passed module is rejected
    resp = client.post(
        "/progress/complete-module",
        json={"module_code": "M2", "semester": "2026-S1", "grade": 95},
        headers=headers,
    )
    assert resp.status_code == 409


def test_students_cannot_see_each_others_data():
    token_a = register_and_login("S104")
    token_b = register_and_login("S105")

    client.post(
        "/progress/complete-module",
        json={"module_code": "M1", "semester": "2025-S1", "grade": 80},
        headers={"Authorization": f"Bearer {token_a}"},
    )

    summary_b = client.get("/progress/summary", headers={"Authorization": f"Bearer {token_b}"}).json()
    assert summary_b["credits_completed"] == 0  # student B unaffected by student A's completion


def test_cannot_delete_completed_enrolment():
    token = register_and_login("S106")
    headers = {"Authorization": f"Bearer {token}"}
    client.post(
        "/progress/complete-module",
        json={"module_code": "M1", "semester": "2025-S1", "grade": 80},
        headers=headers,
    )
    history = client.get("/progress/history", headers=headers).json()
    enrolment_id = history[0]["id"]

    resp = client.delete(f"/progress/enrolments/{enrolment_id}", headers=headers)
    assert resp.status_code == 409