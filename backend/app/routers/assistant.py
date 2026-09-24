# app/routers/assistant.py

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_optional_current_user
from app.services.assistant_context import (
    build_facilitator_context,
    build_student_assistant_context,
)
from app.services.assistant_service import (
    ask_assistant,
    stream_assistant,
)


# ==========================================================
# Router
# ==========================================================

router = APIRouter(
    prefix="/assistant",
    tags=["AI Assistant"],
)


# ==========================================================
# Request / response schemas
# ==========================================================

class ChatHistoryItem(BaseModel):
    role: Literal["user", "model"]

    text: str = Field(
        ...,
        min_length=1,
        max_length=4000,
    )


class AssistantChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
    )

    # Kept temporarily for frontend compatibility.
    #
    # IMPORTANT:
    # This value is NEVER trusted for authorization.
    #
    # The real role is determined from the authenticated
    # JWT by get_optional_current_user().
    user_role: Literal[
        "guest",
        "student",
        "admin",
    ] = "guest"

    history: list[ChatHistoryItem] = Field(
        default_factory=list
    )

    current_page: str | None = Field(
        default=None,
        max_length=40,
    )


class AssistantChatResponse(BaseModel):
    message: str


# ==========================================================
# Chat history helper
# ==========================================================

def build_history(
    payload: AssistantChatRequest,
) -> list[dict]:
    """
    Convert validated Pydantic chat history into the
    dictionary format expected by assistant_service.
    """

    return [
        {
            "role": item.role,
            "text": item.text,
        }
        for item in payload.history
    ]


# ==========================================================
# Verified role helper
# ==========================================================

def get_verified_role(
    current_user: dict | None,
) -> Literal[
    "guest",
    "student",
    "admin",
]:
    """
    Determine the assistant role using verified
    authentication information.

    The frontend role is never trusted for authorization.
    """

    if current_user is None:
        return "guest"

    role = current_user.get("role")

    if current_user.get("is_impersonation") or current_user.get("impersonated_by") is not None:
        return "admin"

    if role == "student":
        return "student"

    if role == "admin":
        return "admin"

    return "guest"


# ==========================================================
# Verified private student context
# ==========================================================

def build_verified_context(
    current_user: dict | None,
    db: Session,
) -> dict | None:
    """
    Build private assistant context from the verified
    authenticated user.

    Student:
        Receives verified academic information belonging
        only to that authenticated student.

    Admin:
        No private student context is exposed automatically.

    Guest:
        No private student context.
    """

    if current_user is None:
        return None

    role = current_user.get("role")
    user = current_user.get("user")

    if (
        role == "student"
        and user is not None
        and not current_user.get("is_impersonation")
        and current_user.get("impersonated_by") is None
    ):
        return build_student_assistant_context(
            db,
            user,
        )

    return None


# ==========================================================
# Intent-aware student context
# ==========================================================

def select_relevant_student_context(
    context: dict | None,
    message: str,
    current_page: str | None,
) -> dict | None:
    """Keep only the verified academic data relevant to this request."""
    if not context:
        return None

    text = message.lower()
    page = (current_page or "").lower()
    selected = {
        "student": context.get("student"),
        "progress": context.get("progress"),
        "page_context": page or None,
    }

    def wants(*terms: str) -> bool:
        return any(term in text for term in terms)

    if page in {"planning", "planner"} or wants(
        "plan", "next semester", "eligible", "can i take",
        "prerequisite", "module", "retake",
    ):
        for key in (
            "eligible_modules", "module_eligibility",
            "missing_compulsory_modules", "failed_modules",
            "in_progress_modules",
        ):
            selected[key] = context.get(key)

    if page in {"history", "timeline", "yearly"} or wants(
        "history", "completed", "failed", "grade", "mark",
        "previous", "timeline",
    ):
        for key in (
            "academic_history", "completed_modules",
            "failed_enrolments", "failed_modules",
            "in_progress_modules",
        ):
            selected[key] = context.get(key)

    if page in {"summary", "achievements", "predictor"} or wants(
        "progress", "graduate", "graduation", "credit", "average",
        "percentage", "requirement", "achievement", "predict",
    ):
        selected["missing_compulsory_modules"] = context.get(
            "missing_compulsory_modules"
        )
        selected["category_breakdown"] = context.get("category_breakdown")

    # Ambiguous page-aware questions such as "explain this" receive the
    # page-relevant data above. If no intent matched, progress is enough.
    return selected


# ==========================================================
# Verified public university context
# ==========================================================

def build_verified_university_context(
    db: Session,
) -> dict:
    """
    Build verified public university information that can
    safely be supplied to the assistant.

    This information is separate from private student data.

    Currently includes:
        - SI facilitators
        - ELEP facilitators

    Later this can also include:
        - support services
        - SI sessions
        - booking information
        - verified emergency/support information
    """

    return {
            "facilitators": build_facilitator_context(db),

    "si_booking": {
        "online_booking_available": True,
        "booking_url": "https://fye.ufh.ac.za/bookings/",
        "walk_in_available": True,
        "walk_in_location": "TLC building",
        "instructions": (
            "Students can book an SI session online using the "
            "UFH FYE/TLC booking page, or they can go directly "
            "to the TLC building for assistance."
        ),
    },
    }


# ==========================================================
# Normal non-streaming assistant
# ==========================================================

@router.post(
    "/chat",
    response_model=AssistantChatResponse,
)
def chat_with_assistant(
    payload: AssistantChatRequest,

    current_user: dict | None = Depends(
        get_optional_current_user
    ),

    db: Session = Depends(
        get_db
    ),
):
    """
    Normal non-streaming AI assistant endpoint.

    Authentication is optional because guests may use the
    public assistant.

    Private student information is only supplied when the
    backend verifies an authenticated student.

    Verified public university information may be supplied
    to guests, students, and administrators.
    """

    try:

        # --------------------------------------------------
        # Conversation history
        # --------------------------------------------------

        history = build_history(
            payload
        )

        # --------------------------------------------------
        # Backend-verified role
        # --------------------------------------------------

        verified_role = get_verified_role(
            current_user
        )

        # --------------------------------------------------
        # Private student context
        # --------------------------------------------------

        verified_context = build_verified_context(
            current_user,
            db,
        )
        verified_context = select_relevant_student_context(
            verified_context,
            payload.message,
            payload.current_page,
        )

        # --------------------------------------------------
        # Public university context
        # --------------------------------------------------

        verified_university_context = (
            build_verified_university_context(
                db
            )
        )

        # --------------------------------------------------
        # Ask Gemini
        # --------------------------------------------------

        result = ask_assistant(
            message=payload.message,
            user_role=verified_role,
            history=history,
            verified_context=verified_context,
            verified_university_context=(
                verified_university_context
            ),
        )

        return AssistantChatResponse(
            message=result["message"]
        )

    # ------------------------------------------------------
    # Validation errors
    # ------------------------------------------------------

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    # ------------------------------------------------------
    # Preserve FastAPI HTTP errors
    # ------------------------------------------------------

    except HTTPException:
        raise

    # ------------------------------------------------------
    # Gemini / unexpected service errors
    # ------------------------------------------------------

    except Exception as exc:
        print(
            f"Gemini Assistant error: {exc}"
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "The AI assistant is "
                "temporarily unavailable."
            ),
        )


# ==========================================================
# Streaming assistant
# ==========================================================

@router.post(
    "/chat/stream"
)
def stream_chat_with_assistant(
    payload: AssistantChatRequest,

    current_user: dict | None = Depends(
        get_optional_current_user
    ),

    db: Session = Depends(
        get_db
    ),
):
    """
    Streaming AI assistant endpoint.

    Private student and public university context are built
    before streaming begins.

    The authenticated JWT determines access to private
    information.

    payload.user_role is never used for authorization.
    """

    # ------------------------------------------------------
    # Conversation history
    # ------------------------------------------------------

    history = build_history(
        payload
    )

    # ------------------------------------------------------
    # Backend-verified role
    # ------------------------------------------------------

    verified_role = get_verified_role(
        current_user
    )

    # ------------------------------------------------------
    # Private student context
    # ------------------------------------------------------

    verified_context = build_verified_context(
        current_user,
        db,
    )
    verified_context = select_relevant_student_context(
        verified_context,
        payload.message,
        payload.current_page,
    )

    # ------------------------------------------------------
    # Public university context
    # ------------------------------------------------------

    verified_university_context = (
        build_verified_university_context(
            db
        )
    )

    # ------------------------------------------------------
    # Streaming generator
    # ------------------------------------------------------

    def generate():
        try:
            for chunk in stream_assistant(
                message=payload.message,
                user_role=verified_role,
                history=history,
                verified_context=verified_context,
                verified_university_context=(
                    verified_university_context
                ),
            ):
                yield chunk

        # --------------------------------------------------
        # Validation errors
        # --------------------------------------------------

        except ValueError as exc:
            yield (
                f"\n\n{str(exc)}"
            )

        # --------------------------------------------------
        # Gemini / unexpected service errors
        # --------------------------------------------------

        except Exception as exc:
            print(
                f"Gemini streaming error: {exc}"
            )

            yield (
                "\n\n"
                "The AI assistant is temporarily "
                "unavailable. Please try again."
            )

    # ------------------------------------------------------
    # Streaming response
    # ------------------------------------------------------

    return StreamingResponse(
        generate(),
        media_type=(
            "text/plain; charset=utf-8"
        ),
        headers={
            "Cache-Control": "no-cache",
            "X-Content-Type-Options": "nosniff",
        },
    )