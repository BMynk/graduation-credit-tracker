import asyncio

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.database import Base
from app.routers import community


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SessionLocal = sessionmaker(bind=engine)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def _student_and_paper(db, *, storage_key="gct/past-papers/TEST/MAT111-1-1"):
    programme = models.Programme(
        code="PAPERTEST",
        name="Past Paper Test Programme",
        total_credits_required=384,
    )
    db.add(programme)
    db.flush()
    student = models.Student(
        student_number="PP001",
        name="Paper Student",
        email="paper@example.test",
        programme_id=programme.id,
        current_year=1,
    )
    db.add(student)
    db.flush()
    paper = models.PastPaper(
        uploader_id=student.id,
        programme_id=programme.id,
        module_code="MAT111",
        paper_year=2026,
        level=1,
        file_name="paper.pdf",
        file_url="https://example.test/paper.pdf",
        storage_key=storage_key,
        file_size=100,
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)
    return student, paper


@pytest.mark.parametrize(
    "value, expected",
    [
        (" mat111 ", "MAT111"),
        ("CSC-101", "CSC-101"),
        ("GLG_212", "GLG_212"),
    ],
)
def test_module_code_normalisation_accepts_safe_codes(value, expected):
    assert community._normalise_past_paper_module_code(value) == expected


@pytest.mark.parametrize("value", ["", "A", "../BAD", "MAT/111", "MAT 111", "A" * 31])
def test_module_code_normalisation_rejects_unsafe_codes(value):
    with pytest.raises(HTTPException) as exc:
        community._normalise_past_paper_module_code(value)
    assert exc.value.status_code == 400


def test_pdf_signature_requires_pdf_version_marker():
    assert community._looks_like_pdf(b"%PDF-1.7\ncontent")
    assert not community._looks_like_pdf(b"%PDFnot-really-a-pdf")
    assert not community._looks_like_pdf(b"<html>not a pdf</html>")


def test_delete_keeps_database_row_active_when_storage_delete_fails(monkeypatch):
    db = SessionLocal()
    try:
        student, paper = _student_and_paper(db)

        async def fail_delete(_storage_key):
            return False

        monkeypatch.setattr(community, "_delete_cloudinary_raw", fail_delete)
        with pytest.raises(HTTPException) as exc:
            asyncio.run(
                community.delete_own_past_paper(
                    paper.id,
                    db=db,
                    current_student=student,
                )
            )
        assert exc.value.status_code == 502
        db.refresh(paper)
        assert paper.is_active is True
    finally:
        db.close()


def test_delete_removes_storage_before_soft_deleting_row(monkeypatch):
    db = SessionLocal()
    try:
        student, paper = _student_and_paper(db)
        seen = []

        async def delete_ok(storage_key):
            seen.append(storage_key)
            return True

        monkeypatch.setattr(community, "_delete_cloudinary_raw", delete_ok)
        asyncio.run(
            community.delete_own_past_paper(
                paper.id,
                db=db,
                current_student=student,
            )
        )
        db.refresh(paper)
        assert seen == [paper.storage_key]
        assert paper.is_active is False
    finally:
        db.close()


def test_delete_without_storage_key_still_soft_deletes_legacy_row(monkeypatch):
    db = SessionLocal()
    try:
        student, paper = _student_and_paper(db, storage_key=None)

        async def should_not_run(_storage_key):
            raise AssertionError("Storage deletion should not run without a storage key")

        monkeypatch.setattr(community, "_delete_cloudinary_raw", should_not_run)
        asyncio.run(
            community.delete_own_past_paper(
                paper.id,
                db=db,
                current_student=student,
            )
        )
        db.refresh(paper)
        assert paper.is_active is False
    finally:
        db.close()
