import jwt
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.security import hash_password


def test_impersonation_refresh_preserves_privacy_claims():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = TestingSession()
    programme = models.Programme(
        code="SEC01",
        name="Security Test",
        total_credits_required=384,
    )
    db.add(programme)
    db.flush()
    admin = models.Admin(
        name="Security Admin",
        username="security-admin",
        hashed_password=hash_password("strong-password-123"),
        is_active=True,
        is_super_admin=True,
    )
    student = models.Student(
        name="Private Student",
        student_number="SEC001",
        email="sec001@student.ufh.ac.za",
        programme_id=programme.id,
        current_year=1,
        target_average=60,
        is_active=True,
    )
    db.add_all([admin, student])
    db.commit()

    def override_db():
        session = TestingSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_db
    client = TestClient(app)
    try:
        login = client.post(
            "/admin/login",
            json={"username": "security-admin", "password": "strong-password-123"},
        )
        assert login.status_code == 200

        impersonated = client.post(
            f"/admin/impersonate/{student.id}",
            headers={"Authorization": f"Bearer {login.json()['access_token']}"},
        )
        assert impersonated.status_code == 200

        refreshed = client.post(
            "/auth/refresh",
            json={"refresh_token": impersonated.json()["refresh_token"]},
        )
        assert refreshed.status_code == 200

        access_payload = jwt.decode(
            refreshed.json()["access_token"],
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        refresh_payload = jwt.decode(
            refreshed.json()["refresh_token"],
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        for payload in (access_payload, refresh_payload):
            assert payload["is_impersonation"] is True
            assert payload["impersonated_by"] == admin.id

        # The refreshed token must remain blocked from private Community data.
        private_area = client.get(
            "/community/conversations",
            headers={"Authorization": f"Bearer {refreshed.json()['access_token']}"},
        )
        assert private_area.status_code == 403
    finally:
        app.dependency_overrides.clear()
        db.close()
