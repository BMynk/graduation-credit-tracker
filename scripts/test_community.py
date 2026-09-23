import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"


def run(command, cwd):
    print(f"\n$ {' '.join(command)}")
    subprocess.run(command, cwd=cwd, check=True)


def main():
    run([sys.executable, "-m", "compileall", "-q", "app"], BACKEND)

    test_db = BACKEND / "community_ci.db"
    if test_db.exists():
        test_db.unlink()

    env = os.environ.copy()
    env["DATABASE_URL"] = "sqlite:///./community_ci.db"
    env.setdefault("SECRET_KEY", "community-ci-secret-key")

    code = """
from app.database import Base, engine
from app.main import app
from app import models
from app.routers.community import router as community_router

Base.metadata.create_all(bind=engine)
required = {
    "communities",
    "community_channels",
    "community_messages",
    "community_reactions",
}
missing = required.difference(Base.metadata.tables)
assert not missing, f"Missing community tables: {sorted(missing)}"

router_paths = {route.path for route in community_router.routes}
required_paths = {
    "/community/me",
    "/community/all-years",
    "/community/channels/{channel_id}/messages",
    "/community/messages/{message_id}",
    "/community/messages/{message_id}/reactions",
}
missing_paths = required_paths.difference(router_paths)
assert not missing_paths, f"Missing community router paths: {sorted(missing_paths)}"

from fastapi.testclient import TestClient

client = TestClient(app)
response = client.get("/community/me")
assert response.status_code != 404, (
    "Community router is not reachable through the FastAPI application"
)
assert response.status_code in {401, 403}, (
    "Unauthenticated Community endpoint should be protected; "
    f"got HTTP {response.status_code}"
)
print("Backend community smoke test passed.")\n\n# Functional isolation/security checks.
from app.database import SessionLocal

db = SessionLocal()
try:
    programme_a = models.Programme(code="CI-A", name="CI Programme A", total_credits_required=384)
    programme_b = models.Programme(code="CI-B", name="CI Programme B", total_credits_required=384)
    db.add_all([programme_a, programme_b])
    db.flush()

    student_a = models.Student(
        name="Student A", student_number="CI0001", email="a@example.test",
        programme_id=programme_a.id, current_year=2, target_average=60.0,
    )
    student_b = models.Student(
        name="Student B", student_number="CI0002", email="b@example.test",
        programme_id=programme_a.id, current_year=2, target_average=60.0,
    )
    student_c = models.Student(
        name="Student C", student_number="CI0003", email="c@example.test",
        programme_id=programme_b.id, current_year=2, target_average=60.0,
    )
    student_d = models.Student(
        name="Student D", student_number="CI0004", email="d@example.test",
        programme_id=programme_a.id, current_year=1, target_average=60.0,
    )
    db.add_all([student_a, student_b, student_c, student_d])
    db.commit()
    for student in (student_a, student_b, student_c, student_d):
        db.refresh(student)

    current = {"student": student_a}

    def override_db():
        try:
            yield db
        finally:
            pass

    def override_student():
        return current["student"]

    from app.database import get_db
    from app.dependencies import get_current_student
    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_student] = override_student

    a_community = client.get("/community/me")
    assert a_community.status_code == 200, a_community.text
    a_data = a_community.json()
    assert len(a_data["channels"]) == 3
    general_id = next(ch["id"] for ch in a_data["channels"] if ch["slug"] == "general")

    current["student"] = student_b
    b_data = client.get("/community/me").json()
    assert b_data["id"] == a_data["id"], "Same programme/year must share one community"

    current["student"] = student_c
    c_data = client.get("/community/me").json()
    assert c_data["id"] != a_data["id"], "Different programme must have a separate community"

    current["student"] = student_a

    all_years_a = client.get("/community/all-years")
    assert all_years_a.status_code == 200, all_years_a.text
    all_years_data = all_years_a.json()
    assert all_years_data["year_level"] == 0
    all_years_general_id = next(
        ch["id"] for ch in all_years_data["channels"] if ch["slug"] == "general"
    )

    all_years_message = client.post(
        f"/community/channels/{all_years_general_id}/messages",
        json={"content": "Hello students from every year"},
    )
    assert all_years_message.status_code == 201, all_years_message.text
    all_years_message_id = all_years_message.json()["id"]

    current["student"] = student_d
    d_year_data = client.get("/community/me").json()
    assert d_year_data["id"] != a_data["id"], "Different years must keep separate year communities"
    d_all_years = client.get("/community/all-years").json()
    assert d_all_years["id"] == all_years_data["id"], (
        "Students in the same programme across years must share the all-years community"
    )
    all_years_visible = client.get(
        f"/community/channels/{all_years_general_id}/messages"
    )
    assert all_years_visible.status_code == 200
    assert any(m["id"] == all_years_message_id for m in all_years_visible.json())

    current["student"] = student_c
    blocked_all_years = client.get(
        f"/community/channels/{all_years_general_id}/messages"
    )
    assert blocked_all_years.status_code == 404, (
        "Students from another programme must not access the all-years community"
    )

    current["student"] = student_a
    created = client.post(
        f"/community/channels/{general_id}/messages",
        json={"content": "Community CI message"},
    )
    assert created.status_code == 201, created.text
    message_id = created.json()["id"]

    current["student"] = student_b
    visible = client.get(f"/community/channels/{general_id}/messages")
    assert visible.status_code == 200
    assert any(m["id"] == message_id for m in visible.json()), (
        "Same programme/year student should see the message"
    )

    reacted = client.post(
        f"/community/messages/{message_id}/reactions",
        json={"emoji": "👍"},
    )
    assert reacted.status_code == 200, reacted.text
    assert any(
        r["emoji"] == "👍" and r["count"] == 1 and r["reacted_by_me"]
        for r in reacted.json()["reactions"]
    )

    forbidden_delete = client.delete(f"/community/messages/{message_id}")
    assert forbidden_delete.status_code == 404, (
        "A student must not be able to delete another student's message"
    )

    current["student"] = student_c
    isolated = client.get(f"/community/channels/{general_id}/messages")
    assert isolated.status_code == 404, (
        "Student outside the community must not access its channel"
    )
    isolated_reaction = client.post(
        f"/community/messages/{message_id}/reactions",
        json={"emoji": "👍"},
    )
    assert isolated_reaction.status_code == 404, (
        "Student outside the community must not react to its messages"
    )

    current["student"] = student_a
    own_delete = client.delete(f"/community/messages/{message_id}")
    assert own_delete.status_code == 204, own_delete.text

    current["student"] = student_b
    after_delete = client.get(f"/community/channels/{general_id}/messages")
    deleted = next(m for m in after_delete.json() if m["id"] == message_id)
    assert deleted["is_deleted"] is True and deleted["content"] is None

    print("Community functional/security tests passed.")
finally:
    app.dependency_overrides.clear()
    db.close()


"""
    print("\n$ backend community smoke test")
    subprocess.run([sys.executable, "-c", code], cwd=BACKEND, env=env, check=True)

    if (FRONTEND / "package-lock.json").exists():
        run(["npm", "ci"], FRONTEND)
    else:
        run(["npm", "install"], FRONTEND)
    run(["npm", "run", "build"], FRONTEND)


if __name__ == "__main__":
    main()
