# app/services/assistant_context.py

from sqlalchemy.orm import Session, joinedload

from app import models
from app.services import progress_service
from app.data.facilitators_semester2 import FACILITATORS as VERIFIED_SEMESTER2_FACILITATORS


# ==========================================================
# Module serializer
# ==========================================================

def _module_to_dict(module) -> dict:
    return {
        "code": module.code,
        "name": module.name,
        "credits": module.credits,
        "level": module.level,
        "category": module.category,
    }


# ==========================================================
# Academic history
# ==========================================================

def _build_academic_history(
    db: Session,
    student: models.Student,
) -> list[dict]:

    enrolments = (
        db.query(models.Enrolment)
        .options(
            joinedload(models.Enrolment.module)
        )
        .filter(
            models.Enrolment.student_id == student.id
        )
        .order_by(
            models.Enrolment.semester,
            models.Enrolment.id,
        )
        .all()
    )

    history = []

    for enrolment in enrolments:
        module = enrolment.module

        if module is None:
            continue

        history.append(
            {
                "module": _module_to_dict(module),
                "semester": enrolment.semester,
                "grade": enrolment.grade,
                "status": enrolment.status,
                "attempt": enrolment.attempt,
            }
        )

    return history


# ==========================================================
# History groups
# ==========================================================

def _split_history(
    academic_history: list[dict],
) -> dict:

    completed = []
    failed = []
    in_progress = []

    for item in academic_history:

        status = item.get("status")

        if status == "completed":
            completed.append(item)

        elif status == "failed":
            failed.append(item)

        else:
            in_progress.append(item)

    return {
        "completed_modules": completed,
        "failed_enrolments": failed,
        "in_progress_modules": in_progress,
    }


# ==========================================================
# Programme module eligibility
# ==========================================================

def _build_module_eligibility(
    db: Session,
    student: models.Student,
) -> list[dict]:
    """
    Build a verified eligibility explanation for every
    module belonging to the student's programme.

    This allows the assistant to answer questions such as:

        Why can't I take MAT312?
        What prerequisites am I missing?
        Have I already completed CSC211?
        Can I take CSC312?
    """

    # ------------------------------------------------------
    # Student's programme modules
    # ------------------------------------------------------

    programme_modules = (
        db.query(models.ProgrammeModule)
        .options(
            joinedload(
                models.ProgrammeModule.module
            ).joinedload(
                models.Module.prerequisites
            )
        )
        .filter(
            models.ProgrammeModule.programme_id
            == student.programme_id
        )
        .all()
    )

    # ------------------------------------------------------
    # Student enrolments
    # ------------------------------------------------------

    enrolments = (
        db.query(models.Enrolment)
        .filter(
            models.Enrolment.student_id
            == student.id
        )
        .all()
    )

    # ------------------------------------------------------
    # Build state sets
    # ------------------------------------------------------

    completed_ids = {
        enrolment.module_id
        for enrolment in enrolments
        if enrolment.status == "completed"
    }

    failed_ids = {
        enrolment.module_id
        for enrolment in enrolments
        if enrolment.status == "failed"
    }

    enrolled_ids = {
        enrolment.module_id
        for enrolment in enrolments
        if enrolment.status
        not in {
            "completed",
            "failed",
        }
    }

    result = []

    # ------------------------------------------------------
    # Determine eligibility
    # ------------------------------------------------------

    for link in programme_modules:

        module = link.module

        if module is None:
            continue

        prerequisites = [
            {
                "code": prereq.code,
                "name": prereq.name,
            }
            for prereq in module.prerequisites
        ]

        missing_prerequisites = [
            {
                "code": prereq.code,
                "name": prereq.name,
            }
            for prereq in module.prerequisites
            if prereq.id not in completed_ids
        ]

        is_completed = (
            module.id in completed_ids
        )

        is_failed = (
            module.id in failed_ids
        )

        is_enrolled = (
            module.id in enrolled_ids
        )

        prerequisites_met = (
            len(missing_prerequisites) == 0
        )

        # --------------------------------------------------
        # Determine current state
        # --------------------------------------------------

        if is_completed:

            eligibility_status = (
                "already_completed"
            )

            reason = (
                "The student has already completed "
                "this module."
            )

            is_eligible = False

        elif is_failed:

            eligibility_status = (
                "failed_needs_retake"
            )

            reason = (
                "The student previously failed this "
                "module and it requires attention "
                "or a retake."
            )

            is_eligible = False

        elif is_enrolled:

            eligibility_status = (
                "already_enrolled"
            )

            reason = (
                "The student is already enrolled "
                "for this module."
            )

            is_eligible = False

        elif not prerequisites_met:

            eligibility_status = (
                "missing_prerequisites"
            )

            missing_codes = [
                item["code"]
                for item in missing_prerequisites
            ]

            reason = (
                "Missing prerequisite(s): "
                + ", ".join(missing_codes)
            )

            is_eligible = False

        else:

            eligibility_status = "eligible"

            reason = (
                "All recorded prerequisites "
                "have been completed."
            )

            is_eligible = True

        # --------------------------------------------------
        # Add module
        # --------------------------------------------------

        result.append(
            {
                "module": (
                    _module_to_dict(module)
                ),

                "is_compulsory": (
                    link.is_compulsory
                ),

                "prerequisites": (
                    prerequisites
                ),

                "missing_prerequisites": (
                    missing_prerequisites
                ),

                "prerequisites_met": (
                    prerequisites_met
                ),

                "is_eligible": (
                    is_eligible
                ),

                "eligibility_status": (
                    eligibility_status
                ),

                "reason": reason,
            }
        )

    result.sort(
        key=lambda item: (
            item["module"]["level"],
            item["module"]["code"],
        )
    )

    return result


# ==========================================================
# Student assistant context
# ==========================================================

def build_student_assistant_context(
    db: Session,
    student: models.Student,
) -> dict:

    # ------------------------------------------------------
    # Existing verified progress calculations
    # ------------------------------------------------------

    summary = (
        progress_service.build_progress_summary(
            db,
            student,
        )
    )

    eligible_results = (
        progress_service.get_eligible_modules(
            db,
            student,
        )
    )

    # ------------------------------------------------------
    # Academic history
    # ------------------------------------------------------

    academic_history = (
        _build_academic_history(
            db,
            student,
        )
    )

    history_groups = (
        _split_history(
            academic_history
        )
    )

    # ------------------------------------------------------
    # Full programme eligibility
    # ------------------------------------------------------

    module_eligibility = (
        _build_module_eligibility(
            db,
            student,
        )
    )

    # ------------------------------------------------------
    # Missing compulsory modules
    # ------------------------------------------------------

    missing_compulsory = [
        _module_to_dict(module)
        for module in summary.get(
            "missing_compulsory_modules",
            [],
        )
    ]

    # ------------------------------------------------------
    # Failed modules
    # ------------------------------------------------------

    failed_modules = [
        _module_to_dict(module)
        for module in summary.get(
            "failed_modules",
            [],
        )
    ]

    # ------------------------------------------------------
    # Eligible modules
    # ------------------------------------------------------

    eligible_modules = []

    for item in eligible_results:

        module = item.get("module")

        if module is None:
            continue

        eligible_modules.append(
            {
                **_module_to_dict(module),
                "reason": item.get("reason"),
            }
        )

    # ------------------------------------------------------
    # Programme
    # ------------------------------------------------------

    programme = summary.get(
        "programme"
    )

    programme_data = None

    if programme is not None:

        programme_data = {
            "code": programme.code,
            "name": programme.name,
            "total_credits_required": (
                programme.total_credits_required
            ),
        }

    # ======================================================
    # Final verified student context
    # ======================================================

    return {

        "student": {
            "current_year": (
                student.current_year
            ),

            "programme": (
                programme_data
            ),
        },

        # --------------------------------------------------
        # Progress
        # --------------------------------------------------

        "progress": {
            "credits_completed": (
                summary.get(
                    "credits_completed"
                )
            ),

            "credits_required": (
                summary.get(
                    "credits_required"
                )
            ),

            "credits_remaining": (
                summary.get(
                    "credits_remaining"
                )
            ),

            "percentage_complete": (
                summary.get(
                    "percentage_complete"
                )
            ),

            "weighted_average": (
                summary.get(
                    "weighted_average"
                )
            ),

            "modules_completed": (
                summary.get(
                    "modules_completed"
                )
            ),

            "modules_failed_pending_retake": (
                summary.get(
                    "modules_failed_pending_retake"
                )
            ),
        },

        # --------------------------------------------------
        # Requirements
        # --------------------------------------------------

        "missing_compulsory_modules": (
            missing_compulsory
        ),

        # --------------------------------------------------
        # Failed modules
        # --------------------------------------------------

        "failed_modules": (
            failed_modules
        ),

        "failed_enrolments": (
            history_groups[
                "failed_enrolments"
            ]
        ),

        # --------------------------------------------------
        # Eligible modules
        # --------------------------------------------------

        "eligible_modules": (
            eligible_modules
        ),

        # --------------------------------------------------
        # Detailed eligibility
        # --------------------------------------------------

        "module_eligibility": (
            module_eligibility
        ),

        # --------------------------------------------------
        # Academic history
        # --------------------------------------------------

        "academic_history": (
            academic_history
        ),

        "completed_modules": (
            history_groups[
                "completed_modules"
            ]
        ),

        "in_progress_modules": (
            history_groups[
                "in_progress_modules"
            ]
        ),

        # --------------------------------------------------
        # Category progress
        # --------------------------------------------------

        "category_breakdown": (
            summary.get(
                "category_breakdown",
                {},
            )
        ),

        # --------------------------------------------------
        # Personalized support and community resources
        # --------------------------------------------------

        "si_elep_support": _build_student_support_matches(
            academic_history,
            eligible_modules,
        ),

        "past_papers": _build_student_past_papers(
            db,
            student,
            academic_history,
            eligible_modules,
        ),

        "notifications": _build_student_notifications_summary(
            db,
            student,
        ),

        "equipped_marcel_cosmetic": next(
            (
                row.reward_id
                for row in db.query(models.StudentRewardPurchase).filter(
                    models.StudentRewardPurchase.student_id == student.id,
                    models.StudentRewardPurchase.category == "marcel",
                    models.StudentRewardPurchase.is_equipped.is_(True),
                ).all()
            ),
            None,
        ),
    }

# ==========================================================
# Marcel 2.0 contextual helpers
# ==========================================================

def _normalise_module_code(value: str | None) -> str:
    return "".join((value or "").upper().split())


def _build_student_support_matches(
    academic_history: list[dict],
    eligible_modules: list[dict],
) -> list[dict]:
    """Match the student's current/eligible modules to verified SI/ELEP support."""
    codes = set()
    for item in academic_history:
        if item.get("status") not in {"completed", "failed"}:
            module = item.get("module") or {}
            if module.get("code"):
                codes.add(_normalise_module_code(module["code"]))
    for module in eligible_modules:
        if module.get("code"):
            codes.add(_normalise_module_code(module["code"]))

    matches = []
    for facilitator in VERIFIED_SEMESTER2_FACILITATORS:
        assignment = _normalise_module_code(facilitator.get("module_assignment"))
        supported = sorted(code for code in codes if code and code in assignment)
        if supported:
            matches.append({**facilitator, "matched_modules": supported})
    return matches


def _build_student_past_papers(
    db: Session,
    student: models.Student,
    academic_history: list[dict],
    eligible_modules: list[dict],
) -> list[dict]:
    """Expose only active past-paper metadata relevant to this student's modules."""
    codes = {
        (item.get("module") or {}).get("code")
        for item in academic_history
        if (item.get("module") or {}).get("code")
    }
    codes.update(module.get("code") for module in eligible_modules if module.get("code"))
    codes.discard(None)
    if not codes:
        return []

    rows = (
        db.query(models.PastPaper)
        .filter(
            models.PastPaper.is_active.is_(True),
            models.PastPaper.module_code.in_(codes),
        )
        .order_by(models.PastPaper.paper_year.desc(), models.PastPaper.module_code.asc())
        .limit(80)
        .all()
    )
    return [
        {
            "module_code": row.module_code,
            "module_name": row.module_name,
            "year": row.paper_year,
            "semester": row.semester,
            "level": row.level,
            "description": row.description,
            "file_name": row.file_name,
            "file_url": row.file_url,
        }
        for row in rows
    ]


def _build_student_notifications_summary(
    db: Session,
    student: models.Student,
) -> dict:
    pending_requests = (
        db.query(models.PrivateChatRequest)
        .filter(
            models.PrivateChatRequest.receiver_id == student.id,
            models.PrivateChatRequest.status == "pending",
        )
        .count()
    )
    unread_messages = (
        db.query(models.PrivateMessage)
        .join(models.PrivateConversation)
        .filter(
            models.PrivateMessage.sender_id != student.id,
            models.PrivateMessage.read_at.is_(None),
            models.PrivateConversation.is_active.is_(True),
            (
                (models.PrivateConversation.student_one_id == student.id)
                | (models.PrivateConversation.student_two_id == student.id)
            ),
        )
        .count()
    )
    return {
        "pending_chat_requests": pending_requests,
        "unread_private_messages": unread_messages,
    }


def build_admin_assistant_context(
    db: Session,
) -> dict:
    """Build aggregate-only analytics for authenticated admins."""
    students = (
        db.query(models.Student)
        .options(joinedload(models.Student.programme))
        .filter(models.Student.is_active.is_(True))
        .all()
    )
    progress_bands = {"0-25%": 0, "26-50%": 0, "51-75%": 0, "76-100%": 0}
    year_counts = {}
    programme_stats = {}
    fail_counts = {}
    graduation_ready = 0
    prerequisite_blocks = 0
    below_target = 0

    for student in students:
        summary = progress_service.build_progress_summary(db, student)
        percentage = float(summary.get("percentage_complete") or 0)
        band = "0-25%" if percentage <= 25 else "26-50%" if percentage <= 50 else "51-75%" if percentage <= 75 else "76-100%"
        progress_bands[band] += 1
        year_counts[student.current_year] = year_counts.get(student.current_year, 0) + 1

        programme = student.programme
        if programme:
            stats = programme_stats.setdefault(programme.code, {"name": programme.name, "count": 0, "progress": [], "averages": []})
            stats["count"] += 1
            stats["progress"].append(percentage)
            average = summary.get("weighted_average")
            if average is not None:
                stats["averages"].append(float(average))
                if student.target_average is not None and float(average) < float(student.target_average):
                    below_target += 1

        blocked = False
        for failed in summary.get("failed_modules", []):
            module = failed.get("module") if isinstance(failed, dict) else None
            if module is not None:
                fail_counts[module.id] = fail_counts.get(module.id, 0) + 1
            if isinstance(failed, dict) and failed.get("is_prerequisite_for_major"):
                blocked = True
        if blocked:
            prerequisite_blocks += 1
        if (
            summary.get("credits_remaining") == 0
            and not summary.get("missing_compulsory_modules")
            and not summary.get("failed_modules")
        ):
            graduation_ready += 1

    bottlenecks = []
    for module_id, count in sorted(fail_counts.items(), key=lambda item: (-item[1], item[0]))[:8]:
        module = db.query(models.Module).filter(models.Module.id == module_id).first()
        if module:
            bottlenecks.append({"code": module.code, "name": module.name, "fail_count": count})

    programmes = []
    for code, values in sorted(programme_stats.items()):
        programmes.append({
            "programme_code": code,
            "programme_name": values["name"],
            "student_count": values["count"],
            "avg_percentage_complete": round(sum(values["progress"]) / len(values["progress"]), 1) if values["progress"] else None,
            "avg_weighted_average": round(sum(values["averages"]) / len(values["averages"]), 2) if values["averages"] else None,
        })

    return {
        "active_students": len(students),
        "graduation_ready_count": graduation_ready,
        "requirements_remaining_count": max(len(students) - graduation_ready, 0),
        "failed_prerequisite_count": prerequisite_blocks,
        "below_target_count": below_target,
        "progress_distribution": [{"label": label, "student_count": count} for label, count in progress_bands.items()],
        "students_by_year": [{"year": year, "student_count": count} for year, count in sorted(year_counts.items())],
        "programme_performance": programmes,
        "bottleneck_modules": bottlenecks,
    }


def build_facilitator_context(
    db: Session,
) -> list[dict]:
    """
    Return public, verified SI/ELEP facilitator information for Marcel.

    Semester 2 data supplied by the project owner is always available to
    guests, students, and admins. Verified database rows can extend/override
    the same facilitator + programme entry without creating duplicates.
    """
    combined = {
        (item["programme_type"].upper(), item["name"].casefold()): dict(item)
        for item in VERIFIED_SEMESTER2_FACILITATORS
    }

    facilitators = (
        db.query(models.Facilitator)
        .filter(
            models.Facilitator.is_active.is_(True),
            models.Facilitator.verified_at.isnot(None),
        )
        .all()
    )

    for facilitator in facilitators:
        item = {
            "name": facilitator.name,
            "programme_type": facilitator.programme_type,
            "module_assignment": facilitator.module_assignment,
            "campus": facilitator.campus,
            "session_time": facilitator.session_time,
            "consultation_time": facilitator.consultation_time,
            "is_assistant": facilitator.is_assistant,
        }
        combined[
            (facilitator.programme_type.upper(), facilitator.name.casefold())
        ] = item

    return sorted(
        combined.values(),
        key=lambda item: (
            item["programme_type"].upper(),
            item["name"].casefold(),
        ),
    )
