import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"


def main():
    db_file = BACKEND / "simulated_students_ci.db"
    if db_file.exists():
        db_file.unlink()

    env = os.environ.copy()
    env["DATABASE_URL"] = "sqlite:///./simulated_students_ci.db"
    env.setdefault("SECRET_KEY", "simulated-students-ci-secret")

    code = """
from app.database import Base, SessionLocal, engine
from app import models
from scripts.seed_simulated_students import seed, remove

Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    programme = models.Programme(
        code="SIM-CI", name="Simulation CI Programme", total_credits_required=384
    )
    real = models.Student(
        name="Real Student", student_number="REAL001", email="real@example.test",
        programme=programme, current_year=2, target_average=60.0,
    )
    db.add_all([programme, real])
    db.commit()
finally:
    db.close()

assert seed(6) == 6
assert seed(6) == 0, "Seeder must be idempotent"

db = SessionLocal()
try:
    real = db.query(models.Student).filter(models.Student.student_number == "REAL001").one()
    simulated = db.query(models.Student).filter(models.Student.student_number.like("SIM-%")).all()
    assert real.name == "Real Student"
    assert len(simulated) == 6
    assert all(s.email.endswith("@example.invalid") for s in simulated)
    assert all(s.pin_hash is None for s in simulated)
    assert {s.current_year for s in simulated} == {1, 2, 3}
finally:
    db.close()

assert remove() == 6

db = SessionLocal()
try:
    assert db.query(models.Student).filter(models.Student.student_number == "REAL001").count() == 1
    assert db.query(models.Student).filter(models.Student.student_number.like("SIM-%")).count() == 0
finally:
    db.close()

print("Simulated student safety tests passed.")
"""
    subprocess.run([sys.executable, "-c", code], cwd=BACKEND, env=env, check=True)


if __name__ == "__main__":
    main()
