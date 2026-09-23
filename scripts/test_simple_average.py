import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"

def main():
    db_file = BACKEND / "simple_average_ci.db"
    if db_file.exists():
        db_file.unlink()
    env = os.environ.copy()
    env["DATABASE_URL"] = "sqlite:///./simple_average_ci.db"
    env.setdefault("SECRET_KEY", "simple-average-ci-secret")
    code = r"""
from app.database import Base, SessionLocal, engine
from app import models
from app.services.progress_service import build_progress_summary

Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    p=models.Programme(code="AVG-CI",name="Average CI",total_credits_required=24)
    db.add(p); db.flush()
    m1=models.Module(code="AVG16",name="Sixteen credit",credits=16,level=1)
    m2=models.Module(code="AVG08",name="Eight credit",credits=8,level=1)
    db.add_all([m1,m2]); db.flush()
    db.add_all([
        models.ProgrammeModule(programme_id=p.id,module_id=m1.id,year=1,semester=1,is_compulsory=True),
        models.ProgrammeModule(programme_id=p.id,module_id=m2.id,year=1,semester=1,is_compulsory=True),
    ])
    s=models.Student(name="Average Student",student_number="AVG-1",email="avg@example.invalid",programme_id=p.id,current_year=2)
    db.add(s); db.flush()
    db.add_all([
        models.Enrolment(student_id=s.id,module_id=m1.id,semester="S1",grade=70,status="completed",attempt=1),
        models.Enrolment(student_id=s.id,module_id=m2.id,semester="S1",grade=40,status="failed",attempt=1),
    ])
    db.commit(); db.refresh(s)
    summary=build_progress_summary(db,s)
    assert summary["weighted_average"] == 55.0, summary
    assert summary["credits_completed"] == 16
finally:
    db.close()
print("Simple overall average tests passed.")
"""
    subprocess.run([sys.executable,"-c",code],cwd=BACKEND,env=env,check=True)

if __name__ == "__main__":
    main()
