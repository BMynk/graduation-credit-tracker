"""Create and remove clearly identified simulated students for demos.

Usage from the backend directory:
    python -m scripts.seed_simulated_students
    python -m scripts.seed_simulated_students --per-programme 12
    python -m scripts.seed_simulated_students --remove

Simulated records use the reserved SIM- student-number prefix and
@example.invalid email addresses. Real student records are never updated.
"""
import argparse
import random

from app import models
from app.database import SessionLocal

SIM_PREFIX = "SIM-"
SIM_EMAIL_DOMAIN = "example.invalid"

FIRST_NAMES = [
    "Amahle", "Anathi", "Ayanda", "Buhle", "Lethabo", "Lihle", "Lwazi",
    "Mihle", "Nandi", "Olwethu", "Onke", "Sibusiso", "Siyanda", "Thando",
    "Unathi", "Zanele", "Zola", "Karabo", "Kea", "Lesedi",
]
LAST_NAMES = [
    "Dlamini", "Khumalo", "Mahlangu", "Maseko", "Mbeki", "Mkhize",
    "Mokoena", "Mthembu", "Ndlovu", "Ngcobo", "Nkosi", "Ntuli",
    "Sibiya", "Sithole", "Zwane", "Mabena", "Molefe", "Motaung",
]


def _student_number(programme_id: int, index: int) -> str:
    return f"{SIM_PREFIX}{programme_id:03d}-{index:03d}"


def _email(programme_id: int, index: int) -> str:
    return f"sim-{programme_id:03d}-{index:03d}@{SIM_EMAIL_DOMAIN}"


def seed_with_db(db, per_programme: int) -> dict:
    """Seed simulated students using an existing transaction/session."""
    if not 1 <= per_programme <= 50:
        raise ValueError("per_programme must be between 1 and 50")

    created = 0
    programmes = db.query(models.Programme).order_by(models.Programme.id).all()
    if not programmes:
        return {"created": 0, "programmes": 0, "per_programme": per_programme}

    for programme in programmes:
        curriculum_years = [
            row[0]
            for row in db.query(models.ProgrammeModule.year)
            .filter(models.ProgrammeModule.programme_id == programme.id)
            .distinct()
            .order_by(models.ProgrammeModule.year)
            .all()
            if row[0] and row[0] > 0
        ]
        years = curriculum_years or [1, 2, 3]

        for index in range(1, per_programme + 1):
            number = _student_number(programme.id, index)
            if db.query(models.Student.id).filter(
                models.Student.student_number == number
            ).first():
                continue

            rng = random.Random(programme.id * 10000 + index)
            name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
            year = years[(index - 1) % len(years)]
            db.add(models.Student(
                name=name,
                student_number=number,
                email=_email(programme.id, index),
                pin_hash=None,
                programme_id=programme.id,
                current_year=year,
                target_average=60.0,
                is_active=True,
            ))
            created += 1

    db.flush()
    return {
        "created": created,
        "programmes": len(programmes),
        "per_programme": per_programme,
    }


def seed(per_programme: int) -> int:
    db = SessionLocal()
    try:
        result = seed_with_db(db, per_programme)
        db.commit()
        created = result["created"]
        print(
            f"Created {created} simulated students across "
            f"{result['programmes']} programmes."
        )
        print("Existing real students were not modified.")
        return created
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def remove() -> int:
    db = SessionLocal()
    try:
        simulated = (
            db.query(models.Student)
            .filter(models.Student.student_number.like(f"{SIM_PREFIX}%"))
            .all()
        )
        removed = len(simulated)
        for student in simulated:
            db.delete(student)
        db.commit()
        print(f"Removed {removed} simulated students. Real students were not touched.")
        return removed
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Manage GCT simulated students.")
    parser.add_argument(
        "--per-programme",
        type=int,
        default=12,
        help="Number of simulated students per programme (default: 12).",
    )
    parser.add_argument(
        "--remove",
        action="store_true",
        help="Remove only students with the reserved SIM- prefix.",
    )
    args = parser.parse_args()

    if args.remove:
        remove()
        return

    if not 1 <= args.per_programme <= 50:
        parser.error("--per-programme must be between 1 and 50")

    seed(args.per_programme)


if __name__ == "__main__":
    main()
