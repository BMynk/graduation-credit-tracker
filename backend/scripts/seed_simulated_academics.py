"""Generate varied academic records for clearly marked simulated students only."""
import random

from app import models

SIM_PREFIX = "SIM-"
PASS_MARK = 50.0

# Profiles deliberately overlap so the demo cohort does not look mechanically grouped.
PROFILES = {
    "strong": (68, 91, 0.03),
    "steady": (55, 76, 0.08),
    "borderline": (45, 64, 0.32),
    "struggling": (30, 58, 0.58),
}


def _profile_for(student):
    rng = random.Random(student.id * 7919)
    roll = rng.random()
    if roll < 0.22:
        return "strong"
    if roll < 0.57:
        return "steady"
    if roll < 0.80:
        return "borderline"
    return "struggling"


def _grade(student, module_id, profile):
    low, high, fail_chance = PROFILES[profile]
    rng = random.Random(student.id * 100003 + module_id * 101)
    grade = rng.uniform(low, high)
    if rng.random() < fail_chance:
        # Keep failures varied, including near-misses and clear failures.
        grade = rng.uniform(28 if profile == "struggling" else 38, 49)
    return round(max(0, min(100, grade)), 1)


def seed_academic_records_with_db(db) -> dict:
    simulated = db.query(models.Student).filter(
        models.Student.student_number.like(f"{SIM_PREFIX}%"),
        models.Student.is_active.is_(True),
    ).order_by(models.Student.id).all()

    created = 0
    passed = 0
    failed = 0
    profiles = {name: 0 for name in PROFILES}

    for student in simulated:
        profile = _profile_for(student)
        profiles[profile] += 1

        links = db.query(models.ProgrammeModule).filter(
            models.ProgrammeModule.programme_id == student.programme_id,
            # Only completed academic years receive official marks. Current-year
            # modules stay available for planning/prediction.
            models.ProgrammeModule.year < student.current_year,
        ).order_by(
            models.ProgrammeModule.year,
            models.ProgrammeModule.semester,
            models.ProgrammeModule.id,
        ).all()

        for link in links:
            # Idempotent and non-destructive: never replace an existing attempt.
            exists = db.query(models.Enrolment.id).filter(
                models.Enrolment.student_id == student.id,
                models.Enrolment.module_id == link.module_id,
            ).first()
            if exists:
                continue

            grade = _grade(student, link.module_id, profile)
            is_pass = grade >= PASS_MARK
            db.add(models.Enrolment(
                student_id=student.id,
                module_id=link.module_id,
                semester=f"Year {link.year} Semester {link.semester}",
                grade=grade,
                status="completed" if is_pass else "failed",
                attempt=1,
            ))
            created += 1
            if is_pass:
                passed += 1
            else:
                failed += 1

    db.flush()
    return {
        "simulated_students": len(simulated),
        "records_created": created,
        "passes_created": passed,
        "failures_created": failed,
        "profiles": profiles,
    }
