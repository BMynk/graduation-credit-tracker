import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"

def main():
    db_file = BACKEND / "simulated_academics_ci.db"
    if db_file.exists():
        db_file.unlink()
    env = os.environ.copy()
    env["DATABASE_URL"] = "sqlite:///./simulated_academics_ci.db"
    env.setdefault("SECRET_KEY", "simulated-academics-ci-secret")
    code = r"""
from app.database import Base, SessionLocal, engine
from app import models
from scripts.seed_simulated_students import seed_with_db
from scripts.seed_simulated_academics import seed_academic_records_with_db

Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    p = models.Programme(code="AC-CI", name="Academic CI", total_credits_required=384)
    db.add(p); db.flush()
    for year in (1,2,3):
        for semester in (1,2):
            m = models.Module(code=f"A{year}{semester}", name=f"Module {year}-{semester}", credits=16, level=year)
            db.add(m); db.flush()
            db.add(models.ProgrammeModule(programme_id=p.id,module_id=m.id,year=year,semester=semester,is_compulsory=True))
    real = models.Student(name="Real Student",student_number="REAL-1",email="real@example.invalid",programme_id=p.id,current_year=3,is_active=True)
    db.add(real); db.commit()
    assert seed_with_db(db, 30)["created"] == 30
    db.commit()

    result = seed_academic_records_with_db(db); db.commit()
    assert result["simulated_students"] == 30
    assert result["records_created"] == 60
    assert result["passes_created"] > 0
    assert result["failures_created"] > 0
    assert db.query(models.Enrolment).filter(models.Enrolment.student_id == real.id).count() == 0
    assert all(e.student.student_number.startswith("SIM-") for e in db.query(models.Enrolment).all())
    assert all(e.grade is not None and 0 <= e.grade <= 100 for e in db.query(models.Enrolment).all())
    assert all((e.grade >= 50) == (e.status == "completed") for e in db.query(models.Enrolment).all())

    again = seed_academic_records_with_db(db); db.commit()
    assert again["records_created"] == 0
finally:
    db.close()
print("Simulated academic record tests passed.")
"""
    subprocess.run([sys.executable, "-c", code], cwd=BACKEND, env=env, check=True)

if __name__ == "__main__":
    main()
