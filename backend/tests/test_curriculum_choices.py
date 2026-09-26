import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./curriculum_choice_test.db")
os.environ.setdefault("SECRET_KEY", "curriculum-choice-test-secret")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.database import Base
from app.routers.planning import _build_planning_modules
from app.routers.progress import get_degree_progress
from app.routers.admin import generate_test_academic_record
from app.services.progress_service import build_graduation_audit, get_eligible_modules, check_and_notify_achievements, _curriculum_choice_status
from app.services.assistant_context import build_student_assistant_context


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


def test_95_percent_generator_does_not_treat_failed_choice_as_satisfied():
    db = _session()
    try:
        student, core, option_a, option_b = _choice_fixture(db)
        student.student_number = "202355290"
        db.add(models.Enrolment(
            student_id=student.id,
            module_id=option_a.id,
            semester="2026-S1",
            grade=35,
            status="failed",
            attempt=1,
        ))
        db.commit()

        result = generate_test_academic_record(
            student_id=student.id,
            current_admin=None,
            db=db,
        )

        failed_option = (
            db.query(models.Enrolment)
            .filter(
                models.Enrolment.student_id == student.id,
                models.Enrolment.module_id == option_a.id,
            )
            .order_by(models.Enrolment.id)
            .all()
        )
        generated_option = (
            db.query(models.Enrolment)
            .filter(
                models.Enrolment.student_id == student.id,
                models.Enrolment.module_id == option_b.id,
                models.Enrolment.status == "completed",
            )
            .first()
        )

        assert len(failed_option) == 1
        assert failed_option[0].status == "failed"
        assert failed_option[0].grade == 35
        assert generated_option is not None
        assert generated_option.grade == 95
        assert generated_option.semester.startswith("TEST-")
        assert result["created"] == 2  # CORE1 plus OPT2
    finally:
        db.close()


def test_audit_totals_do_not_count_every_choice_alternative():
    db = _session()
    try:
        student, core, option_a, option_b = _choice_fixture(db)
        audit = build_graduation_audit(db, student)
        breakdown = audit["requirements_breakdown"]

        # The degree requires CORE1 (16) plus one 16-credit choice, not both
        # OPT1 and OPT2. Aggregate curriculum totals must therefore stay at 32.
        assert sum(
            item["total"] for item in breakdown["by_level"].values()
        ) == 32
        assert sum(
            item["total"] for item in breakdown["by_category"].values()
        ) == 32
        assert breakdown["elective"]["total"] == 1
        assert breakdown["elective"]["completed"] == 0

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
        breakdown = audit["requirements_breakdown"]
        assert sum(
            item["total"] for item in breakdown["by_level"].values()
        ) == 32
        assert breakdown["elective"]["total"] == 1
        assert breakdown["elective"]["completed"] == 1
        assert breakdown["elective"]["percentage"] == 100.0
    finally:
        db.close()


def test_degree_progress_uses_choice_aware_elective_totals():
    db = _session()
    try:
        student, core, option_a, option_b = _choice_fixture(db)

        progress = get_degree_progress(current_student=student, db=db)
        assert progress["elective"]["total"] == 1
        assert progress["elective"]["completed"] == 0
        assert progress["elective"]["percentage"] == 0
        assert progress["projected_graduation"] == "~1 semester(s) remaining"

        db.add(models.Enrolment(
            student_id=student.id,
            module_id=option_a.id,
            semester="2026-S1",
            grade=70,
            status="completed",
            attempt=1,
        ))
        db.commit()

        progress = get_degree_progress(current_student=student, db=db)
        assert progress["elective"]["total"] == 1
        assert progress["elective"]["completed"] == 1
        assert progress["elective"]["percentage"] == 100.0
        # CORE1 remains outstanding; the unused OPT2 alternative must not
        # create an extra projected semester.
        assert progress["projected_graduation"] == "~1 semester(s) remaining"
    finally:
        db.close()


def test_marcel_context_marks_unused_satisfied_choice_as_not_eligible():
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

        context = build_student_assistant_context(db, student)
        requirement = context["choice_requirements"][0]
        assert requirement["satisfied"] is True
        assert requirement["completed_options"] == ["OPT1"]

        eligibility = {
            item["module"]["code"]: item
            for item in context["module_eligibility"]
        }
        unused = eligibility["OPT2"]
        assert unused["is_eligible"] is False
        assert unused["eligibility_status"] == "choice_requirement_already_satisfied"
        assert unused["choice_requirements"][0]["satisfied"] is True

        eligible_codes = {
            item["code"] for item in context["eligible_modules"]
        }
        assert "OPT2" not in eligible_codes
    finally:
        db.close()


def test_achievement_unlock_persistence_is_idempotent(monkeypatch):
    db = _session()
    try:
        student, core, option_a, option_b = _choice_fixture(db)
        db.add(models.Enrolment(
            student_id=student.id,
            module_id=core.id,
            semester="2026-S1",
            grade=70,
            status="completed",
            attempt=1,
        ))
        db.commit()

        sent = []
        monkeypatch.setattr(
            "app.services.progress_service.send_achievement_unlocked_email",
            lambda student, achievement: sent.append(achievement["id"]),
        )

        first = check_and_notify_achievements(db, student)
        assert "first_steps" in first
        assert len(sent) == len(first)

        rows = db.query(models.StudentAchievement).filter(
            models.StudentAchievement.student_id == student.id
        ).all()
        assert {row.achievement_id for row in rows} == set(first)
        assert all(row.notified for row in rows)

        sent.clear()
        second = check_and_notify_achievements(db, student)
        assert second == []
        assert sent == []
    finally:
        db.close()


def test_achievement_email_failure_does_not_lose_unlock(monkeypatch):
    db = _session()
    try:
        student, core, option_a, option_b = _choice_fixture(db)
        db.add(models.Enrolment(
            student_id=student.id,
            module_id=core.id,
            semester="2026-S1",
            grade=70,
            status="completed",
            attempt=1,
        ))
        db.commit()

        def fail_email(student, achievement):
            raise RuntimeError("email unavailable")

        monkeypatch.setattr(
            "app.services.progress_service.send_achievement_unlocked_email",
            fail_email,
        )

        unlocked = check_and_notify_achievements(db, student)
        assert "first_steps" in unlocked

        rows = db.query(models.StudentAchievement).filter(
            models.StudentAchievement.student_id == student.id
        ).all()
        assert {row.achievement_id for row in rows} == set(unlocked)
        assert all(row.notified is False for row in rows)

        # The persisted unlock prevents duplicate awarding even though
        # notification delivery failed.
        assert check_and_notify_achievements(db, student) == []
    finally:
        db.close()


def test_exact_requirement_path_rejects_mixed_modules():
    db = _session()
    try:
        programme = models.Programme(
            code="PATH",
            name="Path Programme",
            total_credits_required=16,
        )
        db.add(programme)
        db.flush()

        modules = {}
        for code in ("COC223", "COC224", "MAT226", "MAT227", "MAT228"):
            module = models.Module(code=code, name=code, credits=8, level=2)
            db.add(module)
            db.flush()
            modules[code] = module
            db.add(models.ProgrammeModule(
                programme_id=programme.id,
                module_id=module.id,
                year=2,
                semester=2,
                is_compulsory=False,
            ))

        group = models.ProgrammeRequirementGroup(
            programme_id=programme.id,
            key="y2s2-elective",
            label="Choose COC pair or MAT226 + (MAT227 or MAT228)",
            year=2,
            semester=2,
            min_modules=2,
            min_credits=16,
        )
        db.add(group)
        db.flush()
        for module in modules.values():
            db.add(models.ProgrammeRequirementOption(
                group_id=group.id,
                module_id=module.id,
            ))

        for key, codes in (
            ("coc", ("COC223", "COC224")),
            ("mat227", ("MAT226", "MAT227")),
            ("mat228", ("MAT226", "MAT228")),
        ):
            path = models.ProgrammeRequirementPath(
                group_id=group.id,
                key=key,
                label=" + ".join(codes),
            )
            db.add(path)
            db.flush()
            for code in codes:
                db.add(models.ProgrammeRequirementPathOption(
                    path_id=path.id,
                    module_id=modules[code].id,
                ))

        student = models.Student(
            name="Path Student",
            student_number="PATH001",
            email="path@example.ufh.ac.za",
            programme_id=programme.id,
            current_year=2,
        )
        db.add(student)
        db.flush()

        # These are 16 credits, but they mix two different prospectus streams.
        db.add_all([
            models.Enrolment(
                student_id=student.id,
                module_id=modules["COC223"].id,
                semester="2026-S2",
                grade=70,
                status="completed",
                attempt=1,
            ),
            models.Enrolment(
                student_id=student.id,
                module_id=modules["MAT227"].id,
                semester="2026-S2",
                grade=70,
                status="completed",
                attempt=1,
            ),
        ])
        db.commit()

        status_info = _curriculum_choice_status(db, student)[0]
        assert status_info["completed_credits"] == 16
        assert status_info["satisfied"] is False
        assert not any(path["satisfied"] for path in status_info["paths"])

        # MAT226 + MAT227 is one exact valid path.
        db.add(models.Enrolment(
            student_id=student.id,
            module_id=modules["MAT226"].id,
            semester="2026-S2",
            grade=70,
            status="completed",
            attempt=1,
        ))
        db.commit()

        status_info = _curriculum_choice_status(db, student)[0]
        assert status_info["satisfied"] is True
        assert any(
            path["key"] == "mat227" and path["satisfied"]
            for path in status_info["paths"]
        )
    finally:
        db.close()
