"""Graduation projection must combine compatible requirements, respect offerings and prerequisites."""
from types import SimpleNamespace

from app.services.progress_service import estimate_remaining_semesters


def link(module_id, code, semester, credits=16, prereqs=(), year=1):
    module = SimpleNamespace(
        id=module_id, code=code, credits=credits,
        prerequisites=[SimpleNamespace(id=pid, code=f"M{pid}") for pid in prereqs],
    )
    return SimpleNamespace(module_id=module_id, module=module, semester=semester, year=year)


def test_combines_requirements_from_different_curriculum_years():
    outstanding = [link(1, "A", 1, year=1), link(2, "B", 1, year=2), link(3, "C", 2, year=3)]
    assert estimate_remaining_semesters(outstanding, set(), start_semester=1) == 2


def test_respects_credit_capacity():
    outstanding = [link(i, f"M{i}", 1, credits=32) for i in range(1, 4)]
    assert estimate_remaining_semesters(outstanding, set(), start_semester=1) == 3


def test_prerequisite_must_be_completed_before_next_term():
    outstanding = [link(1, "A", 1), link(2, "B", 1, prereqs=(1,))]
    assert estimate_remaining_semesters(outstanding, set(), start_semester=1) == 3


def test_unavailable_external_prerequisite_does_not_invent_a_graduation_date():
    assert estimate_remaining_semesters([link(2, "B", 1, prereqs=(99,))], set(), start_semester=1) is None


def test_completed_programme_has_no_remaining_terms():
    assert estimate_remaining_semesters([], set()) == 0
