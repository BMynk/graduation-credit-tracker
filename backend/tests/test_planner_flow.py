from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.database import Base
from app.routers import planning


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SessionLocal = sessionmaker(bind=engine)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def _student_with_programme(db, year=1):
    programme = models.Programme(
        code="TEST40000",
        name="Planner Test",
        total_credits=384,
        duration_years=3,
    )
    db.add(programme)
    db.flush()
    student = models.Student(
        student_number="TEST001",
        name="Planner Student",
        email="planner@example.edu",
        programme_id=programme.id,
        current_year=year,
        is_active=True,
    )
    db.add(student)
    db.flush()
    return student, programme


def _module(db, programme, code, credits=16, year=1, semester=1, compulsory=True):
    module = models.Module(
        code=code,
        name=code,
        credits=credits,
        level=year,
        category="test",
    )
    db.add(module)
    db.flush()
    db.add(models.ProgrammeModule(
        programme_id=programme.id,
        module_id=module.id,
        is_compulsory=compulsory,
        year=year,
        semester=semester,
    ))
    db.flush()
    return module


def test_planner_accepts_normal_64_credit_semester_and_saves_it():
    db = SessionLocal()
    try:
        student, programme = _student_with_programme(db)
        codes = []
        for index in range(4):
            module = _module(db, programme, f"TST11{index}", credits=16)
            codes.append(module.code)
        db.commit()

        payload = planning.PlanRequest(module_codes=codes, semester="2026-S1")
        analysed = planning.generate_plan(payload, current_student=student, db=db)
        assert analysed.total_credits == 64
        assert analysed.is_valid is True

        saved = planning.save_plan(payload, current_student=student, db=db)
        assert saved["modules_saved"] == 4
        assert saved["total_credits"] == 64

        rows = db.query(models.Enrolment).filter(
            models.Enrolment.student_id == student.id,
            models.Enrolment.semester == "2026-S1",
            models.Enrolment.status == "planned",
        ).all()
        assert len(rows) == 4
    finally:
        db.close()


def test_planner_rejects_more_than_64_credits():
    db = SessionLocal()
    try:
        student, programme = _student_with_programme(db)
        codes = []
        for index in range(5):
            module = _module(db, programme, f"TST12{index}", credits=16)
            codes.append(module.code)
        db.commit()

        payload = planning.PlanRequest(module_codes=codes, semester="2026-S1")
        analysed = planning.generate_plan(payload, current_student=student, db=db)
        assert analysed.total_credits == 80
        assert analysed.is_valid is False

        try:
            planning.save_plan(payload, current_student=student, db=db)
            assert False, "Expected save_plan to reject an 80-credit plan"
        except HTTPException as exc:
            assert exc.status_code == 400
            assert "64" in str(exc.detail)
    finally:
        db.close()


def test_planner_rejects_wrong_semester_and_preserves_existing_plan():
    db = SessionLocal()
    try:
        student, programme = _student_with_programme(db)
        existing = _module(db, programme, "OLD111", semester=1)
        wrong_semester = _module(db, programme, "NEW122", semester=2)
        db.add(models.Enrolment(
            student_id=student.id,
            module_id=existing.id,
            semester="2026-S1",
            grade=None,
            status="planned",
            attempt=1,
        ))
        db.commit()

        payload = planning.PlanRequest(module_codes=[wrong_semester.code], semester="2026-S1")
        try:
            planning.save_plan(payload, current_student=student, db=db)
            assert False, "Expected wrong-semester module to be rejected"
        except HTTPException as exc:
            assert exc.status_code == 400

        rows = db.query(models.Enrolment).filter(
            models.Enrolment.student_id == student.id,
            models.Enrolment.semester == "2026-S1",
            models.Enrolment.status == "planned",
        ).all()
        assert len(rows) == 1
        assert rows[0].module_id == existing.id
    finally:
        db.close()
