"""Deterministic Marcel accuracy, privacy, and context-build timing checks.

These tests use verified fixture data and mocked AI calls; they do not
measure the latency or factual accuracy of the external language model.
"""
from time import perf_counter
from types import SimpleNamespace
from unittest.mock import patch

from app.routers.assistant import build_verified_context, get_verified_role, select_relevant_student_context
from app.services.assistant_context import build_student_assistant_context


FIXTURE = {
    "student": {"current_year": 2, "programme": {"code": "TEST"}},
    "progress": {"credits_completed": 64, "credits_required": 128, "credits_remaining": 64, "percentage_complete": 50},
    "missing_compulsory_modules": [{"code": "MAT201"}],
    "eligible_modules": [{"code": "CSC201", "reason": "Prerequisites satisfied"}],
    "module_eligibility": [{"code": "MAT201", "eligible": False}],
    "failed_modules": [{"module": {"code": "MAT101"}, "grade": 42}],
    "academic_history": [{"module": {"code": "MAT101"}, "status": "failed"}],
    "completed_modules": [], "failed_enrolments": [], "in_progress_modules": [],
    "category_breakdown": {"core": {"completed": 64}},
    "si_elep_support": [{"name": "Verified tutor"}],
    "past_papers": [{"module_code": "MAT101", "year": 2025}],
    "notifications": {"unread_private_messages": 2},
}


def test_progress_only_context_does_not_expose_other_sections():
    selected = select_relevant_student_context(FIXTURE, "How many credits remain?", "dashboard")
    assert selected["progress"]["credits_remaining"] == 64
    for key in ("academic_history", "module_eligibility", "past_papers", "notifications"):
        assert key not in selected


def test_planning_context_includes_verified_eligibility():
    selected = select_relevant_student_context(FIXTURE, "Which module can I take?", "planning")
    assert selected["eligible_modules"][0]["code"] == "CSC201"
    assert selected["module_eligibility"][0]["eligible"] is False
    assert selected["missing_compulsory_modules"][0]["code"] == "MAT201"


def test_history_and_support_context_are_question_specific():
    history = select_relevant_student_context(FIXTURE, "Why did I fail MAT101?", "dashboard")
    assert history["failed_modules"][0]["grade"] == 42
    assert "past_papers" not in history
    support = select_relevant_student_context(FIXTURE, "Find a past paper", "community")
    assert support["past_papers"][0]["year"] == 2025
    assert "academic_history" not in support


def test_notification_context_only_when_requested():
    selected = select_relevant_student_context(FIXTURE, "Any unread messages?", None)
    assert selected["notifications"]["unread_private_messages"] == 2
    assert "module_eligibility" not in selected


def test_guest_and_impersonation_cannot_receive_private_student_context():
    assert get_verified_role(None) == "guest"
    assert build_verified_context(None, object(), message="Show my grades") is None
    with patch("app.routers.assistant.build_admin_assistant_context", return_value={"active_students": 5}):
        context = build_verified_context(
            {"role": "student", "user": object(), "is_impersonation": True}, object(),
            message="Show my grades",
        )
    assert context == {"admin_analytics": {"active_students": 5}}


def test_progress_question_avoids_expensive_optional_queries_and_records_duration():
    student = SimpleNamespace(id=1, current_year=2)
    programme = SimpleNamespace(code="TEST", name="Test", total_credits_required=128)
    summary = {
        "programme": programme, "credits_completed": 64, "credits_remaining": 64,
        "failed_modules": [], "missing_compulsory_modules": [], "choice_requirements": [],
    }
    class Query:
        def filter(self, *args): return self
        def all(self): return []
    class DB:
        def query(self, *args): return Query()
    with (
        patch("app.services.assistant_context.progress_service.build_progress_summary", return_value=summary),
        patch("app.services.assistant_context.progress_service.get_eligible_modules") as eligibility,
        patch("app.services.assistant_context._build_academic_history") as history,
        patch("app.services.assistant_context._build_module_eligibility") as detailed,
        patch("app.services.assistant_context._build_student_past_papers") as papers,
        patch("app.services.assistant_context._build_student_notifications_summary") as notifications,
    ):
        started = perf_counter()
        context = build_student_assistant_context(DB(), student, message="How many credits remain?")
        elapsed_ms = (perf_counter() - started) * 1000
    assert context["progress"]["credits_remaining"] == 64
    for mock in (eligibility, history, detailed, papers, notifications):
        mock.assert_not_called()
    # Diagnostic only: mocked duration cannot represent live API/model latency.
    print(f"Mocked progress context construction: {elapsed_ms:.2f} ms")
