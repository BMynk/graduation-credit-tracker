from unittest.mock import patch

from app.services.assistant_context import build_student_assistant_context


def test_progress_question_skips_unrelated_context_queries():
    student = type("Student", (), {"current_year": 2, "id": 1})()
    programme = type("Programme", (), {"code": "TEST", "name": "Test", "total_credits_required": 64})()
    summary = {"programme": programme, "failed_modules": [], "missing_compulsory_modules": [], "choice_requirements": [], "credits_completed": 32}
    with (
        patch("app.services.assistant_context.progress_service.build_progress_summary", return_value=summary),
        patch("app.services.assistant_context.progress_service.get_eligible_modules") as eligible,
        patch("app.services.assistant_context._build_academic_history") as history,
        patch("app.services.assistant_context._build_module_eligibility") as module_eligibility,
        patch("app.services.assistant_context._build_student_past_papers") as papers,
        patch("app.services.assistant_context._build_student_notifications_summary") as notifications,
    ):
        # Cosmetics are independent of academic context; stub the database query.
        class Query:
            def filter(self, *args): return self
            def all(self): return []
        class DB:
            def query(self, *args): return Query()
        result = build_student_assistant_context(DB(), student, message="How many credits have I completed?")
    assert result["progress"]["credits_completed"] == 32
    for mocked in (eligible, history, module_eligibility, papers, notifications):
        mocked.assert_not_called()
