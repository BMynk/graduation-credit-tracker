import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"

def main():
    db_file = BACKEND / "semester_projection_ci.db"
    if db_file.exists():
        db_file.unlink()
    env = os.environ.copy()
    env["DATABASE_URL"] = "sqlite:///./semester_projection_ci.db"
    env.setdefault("SECRET_KEY", "semester-projection-ci-secret")
    code = r"""
from app.database import Base, SessionLocal, engine
from app import models
from app.services.progress_service import build_graduation_audit

Base.metadata.create_all(bind=engine)
db=SessionLocal()
try:
    p=models.Programme(code="PLAN-CI",name="Planning CI",total_credits_required=176)
    db.add(p); db.flush()
    modules=[]
    # Y1S1 and Y2S1 requirements may share a term, subject to capacity.
    # Split the 80-credit Y2S1 block into valid individually schedulable
    # modules; a single 80-credit module exceeds the 64-credit limit.
    for idx,(year,sem,credits) in enumerate([(1,1,48),(1,2,48),(2,1,48),(2,1,32)],1):
        m=models.Module(code=f"PLN{idx}",name=f"Planning {idx}",credits=credits,level=year)
        db.add(m); db.flush()
        db.add(models.ProgrammeModule(programme_id=p.id,module_id=m.id,year=year,semester=sem,is_compulsory=True))
        modules.append(m)
    s=models.Student(name="Planner",student_number="PLAN-1",email="plan@example.invalid",programme_id=p.id,current_year=2)
    db.add(s); db.commit(); db.refresh(s)
    audit=build_graduation_audit(db,s)
    assert audit["projected_semesters_remaining"] == 3, audit["projected_semesters_remaining"]
finally:
    db.close()
print("Semester projection tests passed.")
"""
    subprocess.run([sys.executable,"-c",code],cwd=BACKEND,env=env,check=True)

if __name__ == "__main__":
    main()
