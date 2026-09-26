import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./curriculum_choice_test.db")
os.environ.setdefault("SECRET_KEY", "curriculum-choice-test-secret")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.database import Base
from app.routers.planning import _build_planning_modules
from app.services.progress_service import build_graduation_audit, get_eligible_modules


def _session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine, autocommit=False, autoflush=False)()


def _choice_fixture(db):
    programme = models.Programme(
        code="CHOICE",
        name="Choice Programme",
        total_credits_required=32,
    )
    db.add(programme)
    db.flush()

    core = models.Module(code="CORE1", name="Core", credits=16, level=1)
    option_a = models.Module(code="OPT1", name="Option A", credits=16, level=1)
    option_b = models.Module(code="OPT2", name="Option B", credits=16, level=1)
    db.add_all([core, option_a, option_b])
    db.flush()

    db.add_all([
        models.ProgrammeModule(
            programme_id=programme.id,
            module_id=core.id,
            year=1,
            semester=1,
            is_compulsory=True,
        ),
        models.ProgrammeModule(
            programme_id=programme.id,
            module_id=option_a.id,
            year=1,
            semester=1,
            is_compulsory=False,
        ),
        models.ProgrammeModule(
            programme_id=programme.id,
            module_id=option_b.id,
            year=1,
            semester=1,
            is_compulsory=False,
        ),
    ])

    group = models.ProgrammeRequirementGroup(
        programme_id=programme.id,
        key="y1s1-choice",
        label="Choose one option",
        year=1,
        semester=1,
        min_modules=1,
        min_credits=16,
    )
    db.add(group)
    db.flush()
    db.add_all([
        models.ProgrammeRequirementOption(group_id=group.id, module_id=option_a.id),
        models.ProgrammeRequirementOption(group_id=group.id, module_id=option_b.id),
    ])

    student = models.Student(
        name="Choice Student",
        student_number="CHOICE-1",
        email="choice@example.com",
        programme_id=programme.id,
        current_year=1,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student, core, option_a, option_b


def test_one_completed_option_satisfies_group_and_projection():
    db = _session()
    try:
        student, core, option_a, option_b = _choice_fixture(db)
        db.add(models.Enrolment(
            student_id=student.id,
            module_id=option_a.id,
            semester="2026-S1",
            grade=70,
            status="completed",
            attempt=1,
        ))
        db.commit()

        audit = build_graduation_audit(db, student)
        requirement = audit["choice_requirements"][0]

        assert requirement["satisfied"] is True
        assert requirement["completed_options"] == ["OPT1"]
        assert audit["projected_semesters_remaining"] == 1

        warnings_for_unused = [
            warning for warning in audit["prerequisite_warnings"]
            if warning["module"] == "OPT2"
        ]
        assert warnings_for_unused == []
    finally:
        db.close()


def test_satisfied_group_hides_unused_alternative_from_eligibility_and_planner():
    db = _session()
    try:
        student, core, option_a, option_b = _choice_fixture(db)
        db.add(models.Enrolment(
            student_id=student.id,
            module_id=option_a.id,
            semester="2026-S1",
            grade=70,
            status="completed",
            attempt=1,
        ))
        db.commit()

        eligible_codes = {
            item["module"].code
            for item in get_eligible_modules(db, student)
        }
        assert "OPT2" not in eligible_codes

        planner = {
            item.code: item
            for item in _build_planning_modules(db, student)
        }
        assert planner["OPT2"].is_eligible is False
        assert planner["OPT2"].reason == "Curriculum choice requirement already satisfied"
    finally:
        db.close()


def test_unsatisfied_group_projects_only_minimum_choice_requirement():
    db = _session()
    try:
        student, core, option_a, option_b = _choice_fixture(db)
        audit = build_graduation_audit(db, student)

        requirement = audit["choice_requirements"][0]
        assert requirement["satisfied"] is False

        # CORE1 (16) plus one 16-credit choice is 32 credits in Y1S1,
        # so alternatives must not inflate the projection.
        assert audit["projected_semesters_remaining"] == 1
    finally:
        db.close()
