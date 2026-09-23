import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"


def main():
    db_file = BACKEND / "simulated_community_ci.db"
    if db_file.exists():
        db_file.unlink()

    env = os.environ.copy()
    env["DATABASE_URL"] = "sqlite:///./simulated_community_ci.db"
    env.setdefault("SECRET_KEY", "simulated-community-ci-secret")

    code = r"""
from app.database import Base, SessionLocal, engine
from app import models
from scripts.seed_simulated_students import seed_with_db
from scripts.seed_simulated_community import seed_activity_with_db

Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    p = models.Programme(code="COM-CI", name="Community CI", total_credits_required=384)
    db.add(p)
    db.flush()
    for year in (1, 2, 3):
        m = models.Module(code=f"CI{year}01", name=f"CI Module {year}", credits=16, level=year)
        db.add(m)
        db.flush()
        db.add(models.ProgrammeModule(programme_id=p.id, module_id=m.id, year=year, semester=1))
    db.commit()

    assert seed_with_db(db, 9)["created"] == 9
    db.commit()

    result = seed_activity_with_db(db, 4)
    db.commit()
    assert result["programmes"] == 1
    assert result["communities"] == 4
    assert result["messages_created"] == 48
    assert result["replies_created"] == 12
    assert result["reactions_created"] > 0

    # Re-running does not duplicate activity because populated channels are skipped.
    again = seed_activity_with_db(db, 4)
    db.commit()
    assert again["messages_created"] == 0
    assert again["replies_created"] == 0
    assert again["reactions_created"] == 0

    messages = db.query(models.CommunityMessage).all()
    simulated_ids = {
        s.id for s in db.query(models.Student).filter(models.Student.student_number.like("SIM-%")).all()
    }
    assert messages
    assert all(m.student_id in simulated_ids for m in messages)
finally:
    db.close()

print("Simulated Community activity tests passed.")
"""
    subprocess.run([sys.executable, "-c", code], cwd=BACKEND, env=env, check=True)


if __name__ == "__main__":
    main()
