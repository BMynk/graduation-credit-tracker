from types import SimpleNamespace

from app.services.assistant_context import _serialize_failed_modules


def test_failed_module_context_preserves_verified_progress_details():
    module = SimpleNamespace(code="MAT123", name="Mathematics", credits=16, level=1, category="core")
    result = _serialize_failed_modules([
        {"module": module, "semester": "2026-S1", "grade": 42, "attempt": 2, "is_prerequisite_for_major": True},
        {"module": None, "grade": 10},
    ])
    assert result == [{
        "module": {"code": "MAT123", "name": "Mathematics", "credits": 16, "level": 1, "category": "core"},
        "semester": "2026-S1",
        "grade": 42,
        "attempt": 2,
        "is_prerequisite_for_major": True,
    }]
