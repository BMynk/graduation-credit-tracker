# app/services/progress_service.py
import math
from collections import defaultdict
from typing import List, Optional
from datetime import datetime
from app.email_service import send_grade_released_email, send_achievement_unlocked_email
from app.models import StudentAchievement
from sqlalchemy.orm import Session, joinedload

from app import models
from app.config import settings
from app.exceptions import DuplicateModuleCompletionError, PrerequisiteNotMetError


def _passed_module_ids(db: Session, student: models.Student) -> set:
    rows = (
        db.query(models.Enrolment.module_id)
        .filter(models.Enrolment.student_id == student.id, models.Enrolment.status == "completed")
        .all()
    )
    return {r[0] for r in rows}


def check_prerequisites_met(db: Session, student: models.Student, module: models.Module) -> List[str]:
    if not module.prerequisites:
        return []
    passed_ids = _passed_module_ids(db, student)
    return [p.code for p in module.prerequisites if p.id not in passed_ids]


def _save_completion(db, student, module, semester, grade) -> models.Enrolment:
    existing = (
        db.query(models.Enrolment)
        .filter(models.Enrolment.student_id == student.id, models.Enrolment.module_id == module.id)
        .order_by(models.Enrolment.attempt.desc())
        .first()
    )
    if existing and existing.status == "completed":
        raise DuplicateModuleCompletionError(module.code)

    status = "completed" if grade >= settings.pass_mark else "failed"
    next_attempt = (existing.attempt + 1) if existing else 1

    enrolment = models.Enrolment(
        student_id=student.id, module_id=module.id, semester=semester,
        grade=grade, status=status, attempt=next_attempt,
    )
    db.add(enrolment)
    db.commit()
    db.refresh(enrolment)
    return enrolment


def record_module_completion(db, student, module_code, semester, grade) -> models.Enrolment:
    """Self-service path (student-facing) - enforces prerequisites."""
    module = db.query(models.Module).filter(models.Module.code == module_code).first()
    if module is None:
        raise ValueError(f"No module with code '{module_code}'")
    missing = check_prerequisites_met(db, student, module)
    if missing:
        raise PrerequisiteNotMetError(module_code, missing)
    return _save_completion(db, student, module, semester, grade)


def record_official_completion(db, student, module_code, semester, grade) -> models.Enrolment:
    """Admin path - official record entry, doesn't block on unmet prerequisites."""
    module = db.query(models.Module).filter(models.Module.code == module_code).first()
    if module is None:
        raise ValueError(f"No module with code '{module_code}'")
    return _save_completion(db, student, module, semester, grade)


def _relevant_prerequisite_ids(db: Session, student: models.Student) -> set:
    """Direct prerequisites of any compulsory module in the student's programme."""
    compulsory = (
        db.query(models.ProgrammeModule)
        .options(joinedload(models.ProgrammeModule.module).joinedload(models.Module.prerequisites))
        .filter(
            models.ProgrammeModule.programme_id == student.programme_id,
            models.ProgrammeModule.is_compulsory.is_(True),
        )
        .all()
    )
    relevant = set()
    for link in compulsory:
        for prereq in link.module.prerequisites:
            relevant.add(prereq.id)
    return relevant


def build_progress_summary(db: Session, student: models.Student) -> dict:
    programme = student.programme

    completed_enrolments = (
        db.query(models.Enrolment)
        .options(joinedload(models.Enrolment.module))
        .filter(models.Enrolment.student_id == student.id, models.Enrolment.status == "completed")
        .all()
    )
    passed_module_ids = {e.module_id for e in completed_enrolments}

    all_failed = (
        db.query(models.Enrolment)
        .options(joinedload(models.Enrolment.module))
        .filter(models.Enrolment.student_id == student.id, models.Enrolment.status == "failed")
        .order_by(models.Enrolment.id.desc())
        .all()
    )
    seen_modules = set()
    pending_failed = []
    for e in all_failed:
        if e.module_id in passed_module_ids or e.module_id in seen_modules:
            continue
        seen_modules.add(e.module_id)
        pending_failed.append(e)

    relevant_prereq_ids = _relevant_prerequisite_ids(db, student)
    failed_modules = [
        {
            "module": e.module,
            "semester": e.semester,
            "grade": e.grade,
            "attempt": e.attempt,
            "is_prerequisite_for_major": e.module_id in relevant_prereq_ids,
        }
        for e in pending_failed
    ]

    credits_completed = sum(e.module.credits for e in completed_enrolments)
    credits_required = programme.total_credits_required
    credits_remaining = max(credits_required - credits_completed, 0)
    percentage = round((credits_completed / credits_required) * 100, 1) if credits_required else 0.0

    # Academic average: every recorded module mark counts equally.
    # Credits affect degree progress only; they never weight a mark.
    graded = (
        db.query(models.Enrolment)
        .filter(
            models.Enrolment.student_id == student.id,
            models.Enrolment.grade.isnot(None),
        )
        .all()
    )
    weighted_average = (
        round(sum(e.grade for e in graded) / len(graded), 2)
        if graded else None
    )

    category_breakdown: dict = defaultdict(lambda: {"credits_completed": 0, "modules_completed": 0})
    for e in completed_enrolments:
        cat = e.module.category
        category_breakdown[cat]["credits_completed"] += e.module.credits
        category_breakdown[cat]["modules_completed"] += 1

    compulsory_links = (
        db.query(models.ProgrammeModule)
        .options(joinedload(models.ProgrammeModule.module))
        .filter(
            models.ProgrammeModule.programme_id == programme.id,
            models.ProgrammeModule.is_compulsory.is_(True),
        )
        .all()
    )
    missing_compulsory = [link.module for link in compulsory_links if link.module_id not in passed_module_ids]
    missing_compulsory.sort(key=lambda m: (m.level, m.code))

    return {
        "programme": programme,
        "current_year": student.current_year,
        "credits_completed": credits_completed,
        "credits_required": credits_required,
        "credits_remaining": credits_remaining,
        "percentage_complete": percentage,
        "weighted_average": weighted_average,
        "modules_completed": len(completed_enrolments),
        "modules_failed_pending_retake": len(pending_failed),
        "category_breakdown": dict(category_breakdown),
        "missing_compulsory_modules": missing_compulsory,
        "failed_modules": failed_modules,
    }


def build_graduation_audit(
    db: Session,
    student: models.Student,
) -> dict:
    """
    Enhanced graduation audit with curriculum year/semester
    information for every programme module.
    """

    summary = build_progress_summary(db, student)

    # ---------------------------------------------------------
    # PROGRAMME CURRICULUM
    # ---------------------------------------------------------

    programme_modules = (
        db.query(models.ProgrammeModule)
        .filter(
            models.ProgrammeModule.programme_id
            == student.programme_id
        )
        .options(
            joinedload(models.ProgrammeModule.module)
            .joinedload(models.Module.prerequisites)
        )
        .all()
    )

    # ---------------------------------------------------------
    # STUDENT COMPLETION STATE
    # ---------------------------------------------------------

    completed_enrolments = (
        db.query(models.Enrolment)
        .filter(
            models.Enrolment.student_id == student.id,
            models.Enrolment.status == "completed",
        )
        .all()
    )

    completed_ids = {
        enrolment.module_id
        for enrolment in completed_enrolments
    }

    # ---------------------------------------------------------
    # HELPER
    # ---------------------------------------------------------

    def module_info(
        link: models.ProgrammeModule,
    ) -> dict:
        """
        Convert a ProgrammeModule relationship into the
        curriculum-aware module object returned to the frontend.
        """

        module = link.module

        return {
            "code": module.code,
            "name": module.name,
            "credits": module.credits,
            "level": module.level,
            "category": module.category,
            "year": link.year,
            "semester": link.semester,
            "is_compulsory": link.is_compulsory,
        }

    # ---------------------------------------------------------
    # CATEGORIZE REQUIREMENTS
    #
    # Keep ProgrammeModule links rather than only Module objects.
    # The link contains the authoritative curriculum year and
    # semester.
    # ---------------------------------------------------------

    compulsory_links = []
    elective_links = []

    completed_compulsory_links = []
    completed_elective_links = []

    missing_compulsory_links = []
    missing_elective_links = []

    for link in programme_modules:
        module = link.module

        if module is None:
            continue

        if link.is_compulsory:
            compulsory_links.append(link)

            if module.id in completed_ids:
                completed_compulsory_links.append(link)
            else:
                missing_compulsory_links.append(link)

        else:
            elective_links.append(link)

            if module.id in completed_ids:
                completed_elective_links.append(link)
            else:
                missing_elective_links.append(link)

    # ---------------------------------------------------------
    # SORT CURRICULUM
    # ---------------------------------------------------------

    curriculum_sort = lambda link: (
        link.year,
        link.semester,
        link.module.code,
    )

    compulsory_links.sort(key=curriculum_sort)
    elective_links.sort(key=curriculum_sort)

    completed_compulsory_links.sort(
        key=curriculum_sort
    )

    completed_elective_links.sort(
        key=curriculum_sort
    )

    missing_compulsory_links.sort(
        key=curriculum_sort
    )

    missing_elective_links.sort(
        key=curriculum_sort
    )

    # ---------------------------------------------------------
    # CREDITS BY LEVEL
    # ---------------------------------------------------------

    credits_by_level = {}

    for link in programme_modules:
        module = link.module

        if module is None:
            continue

        level = module.level

        if level not in credits_by_level:
            credits_by_level[level] = {
                "total": 0,
                "completed": 0,
            }

        credits_by_level[level]["total"] += (
            module.credits
        )

        if module.id in completed_ids:
            credits_by_level[level][
                "completed"
            ] += module.credits

    # ---------------------------------------------------------
    # CREDITS BY CATEGORY
    # ---------------------------------------------------------

    credits_by_category = {}

    for link in programme_modules:
        module = link.module

        if module is None:
            continue

        category = module.category

        if category not in credits_by_category:
            credits_by_category[category] = {
                "total": 0,
                "completed": 0,
            }

        credits_by_category[category][
            "total"
        ] += module.credits

        if module.id in completed_ids:
            credits_by_category[category][
                "completed"
            ] += module.credits

    # ---------------------------------------------------------
    # COMPLETION PERCENTAGES
    # ---------------------------------------------------------

    compulsory_percentage = (
        round(
            (
                len(completed_compulsory_links)
                / len(compulsory_links)
            )
            * 100,
            1,
        )
        if compulsory_links
        else 0
    )

    elective_percentage = (
        round(
            (
                len(completed_elective_links)
                / len(elective_links)
            )
            * 100,
            1,
        )
        if elective_links
        else 0
    )

    # ---------------------------------------------------------
    # GRADUATION STATUS
    # ---------------------------------------------------------

    on_track = True
    reasons = []
    urgent_items = []

    if missing_compulsory_links:
        on_track = False

        reasons.append(
            f"Missing "
            f"{len(missing_compulsory_links)} "
            f"compulsory module(s)"
        )

        urgent_items.extend(
            [
                link.module.code
                for link
                in missing_compulsory_links[:5]
            ]
        )

    # ---------------------------------------------------------
    # FAILED MODULES BLOCKING MAJOR
    # ---------------------------------------------------------

    failed_blocking = [
        failed
        for failed in summary["failed_modules"]
        if failed["is_prerequisite_for_major"]
    ]

    if failed_blocking:
        on_track = False

        reasons.append(
            f"{len(failed_blocking)} failed "
            f"module(s) blocking your major"
        )

        urgent_items.extend(
            [
                failed["module"].code
                for failed in failed_blocking
            ]
        )

    # ---------------------------------------------------------
    # TARGET AVERAGE
    # ---------------------------------------------------------

    if (
        summary["weighted_average"] is not None
        and summary["weighted_average"]
        < student.target_average
    ):
        on_track = False

        reasons.append(
            f"Current overall average "
            f"({summary['weighted_average']}) "
            f"below target "
            f"({student.target_average})"
        )

    # ---------------------------------------------------------
    # IN-PROGRESS MODULES
    # ---------------------------------------------------------

    in_progress = (
        db.query(models.Enrolment)
        .filter(
            models.Enrolment.student_id
            == student.id,
            models.Enrolment.status
            == "in-progress",
        )
        .all()
    )

    # ---------------------------------------------------------
    # PREREQUISITE WARNINGS
    # ---------------------------------------------------------

    prerequisite_warnings = []

    outstanding_links = (
        missing_compulsory_links
        + missing_elective_links
    )

    for link in outstanding_links:
        module = link.module

        for prerequisite in module.prerequisites:
            if prerequisite.id not in completed_ids:
                prerequisite_warnings.append(
                    {
                        "module": module.code,
                        "missing_prereq":
                            prerequisite.code,
                        "year": link.year,
                        "semester": link.semester,
                    }
                )

    # ---------------------------------------------------------
    # REQUIREMENTS BREAKDOWN
    # ---------------------------------------------------------

    requirements_breakdown = {
        "compulsory": {
            "completed":
                len(completed_compulsory_links),

            "total":
                len(compulsory_links),

            "percentage":
                compulsory_percentage,

            "completed_modules": [
                module_info(link)
                for link
                in completed_compulsory_links
            ],

            "missing_modules": [
                module_info(link)
                for link
                in missing_compulsory_links
            ],
        },

        "elective": {
            "completed":
                len(completed_elective_links),

            "total":
                len(elective_links),

            "percentage":
                elective_percentage,

            "completed_modules": [
                module_info(link)
                for link
                in completed_elective_links
            ],

            "missing_modules": [
                module_info(link)
                for link
                in missing_elective_links
            ],
        },

        "by_level":
            credits_by_level,

        "by_category":
            credits_by_category,
    }

    # ---------------------------------------------------------
    # CURRICULUM ROADMAP
    #
    # This gives PlanningPage a ready-made Year -> Semester
    # structure without needing to guess from module levels.
    # ---------------------------------------------------------

    curriculum_by_year = {}

    for link in programme_modules:
        module = link.module

        if module is None:
            continue

        year_key = str(link.year)
        semester_key = str(link.semester)

        if year_key not in curriculum_by_year:
            curriculum_by_year[year_key] = {}

        if (
            semester_key
            not in curriculum_by_year[year_key]
        ):
            curriculum_by_year[
                year_key
            ][semester_key] = []

        info = module_info(link)

        info["is_completed"] = (
            module.id in completed_ids
        )

        curriculum_by_year[
            year_key
        ][semester_key].append(info)

    # Sort each semester by module code.
    for year_data in curriculum_by_year.values():
        for semester_modules in year_data.values():
            semester_modules.sort(
                key=lambda item: item["code"]
            )

    # ---------------------------------------------------------
    # REMAINING SEMESTERS
    # ---------------------------------------------------------
    # Keep the historical average as an informational statistic,
    # but do not use it to predict graduation time. A student may
    # have completed only a small number of credits in an earlier
    # semester, which can otherwise produce projections such as
    # 23 semesters.
    avg_credits_per_semester = None

    distinct_semesters = (
        db.query(models.Enrolment.semester)
        .filter(
            models.Enrolment.student_id == student.id,
            models.Enrolment.status == "completed",
        )
        .distinct()
        .count()
    )

    if distinct_semesters > 0:
        avg_credits_per_semester = round(
            summary["credits_completed"] / distinct_semesters,
            1,
        )

    # Project from the actual outstanding curriculum. GCT has two
    # semesters per academic year and permits at most 80 credits in
    # a semester. Each curriculum semester therefore contributes at
    # least one future semester when it still contains requirements;
    # overloaded curriculum semesters require additional semesters.
    MAX_CREDITS_PER_SEMESTER = 80
    outstanding_by_curriculum_semester = defaultdict(int)

    for link in outstanding_links:
        if link.module is None:
            continue
        key = (link.year, link.semester)
        outstanding_by_curriculum_semester[key] += link.module.credits

    projected_semesters_remaining = sum(
        max(1, math.ceil(credits / MAX_CREDITS_PER_SEMESTER))
        for credits in outstanding_by_curriculum_semester.values()
        if credits > 0
    )

    if not outstanding_by_curriculum_semester:
        projected_semesters_remaining = 0

    # ---------------------------------------------------------
    # FINAL RESPONSE
    # ---------------------------------------------------------

    return {
        "on_track":
            on_track,

        "reasons":
            reasons,

        "urgent_items":
            urgent_items,

        "projected_semesters_remaining":
            projected_semesters_remaining,

        "average_credits_per_semester":
            avg_credits_per_semester,

        "requirements_breakdown":
            requirements_breakdown,

        "curriculum_by_year":
            curriculum_by_year,

        "prerequisite_warnings":
            prerequisite_warnings,

        "in_progress_modules":
            len(in_progress),

        "summary":
            summary,
    }


def get_eligible_modules(db: Session, student: models.Student) -> List[dict]:
    passed_ids = _passed_module_ids(db, student)
    programme_module_ids = {
        link.module_id
        for link in db.query(models.ProgrammeModule).filter(
            models.ProgrammeModule.programme_id == student.programme_id
        )
    }
    candidates = (
        db.query(models.Module)
        .filter(models.Module.id.in_(programme_module_ids))
        .filter(models.Module.id.notin_(passed_ids) if passed_ids else True)
        .all()
    )
    eligible = []
    for module in candidates:
        missing = [p.code for p in module.prerequisites if p.id not in passed_ids]
        if not missing:
            reason = "Prerequisites satisfied" if module.prerequisites else "No prerequisites required"
            eligible.append({"module": module, "reason": reason})
    eligible.sort(key=lambda item: (item["module"].level, item["module"].code))
    return eligible


# ---------- Peer Comparison ----------

def get_peer_comparison(
    db: Session,
    student: models.Student,
) -> dict:
    """
    Calculate anonymized peer comparison statistics.

    Students are compared only with active students
    in the same programme and academic year.

    No peer names, student numbers, or individual
    peer marks are returned.
    """

    # ---------------------------------------------------------
    # Find students in the same cohort
    # ---------------------------------------------------------

    peers = (
        db.query(models.Student)
        .filter(
            models.Student.programme_id
            == student.programme_id,
            models.Student.current_year
            == student.current_year,
            models.Student.is_active.is_(True),
            models.Student.id != student.id,
        )
        .all()
    )

    # ---------------------------------------------------------
    # Get current student's weighted average
    # ---------------------------------------------------------

    own_summary = build_progress_summary(
        db,
        student,
    )

    own_avg = own_summary.get(
        "weighted_average"
    )

    # ---------------------------------------------------------
    # No other students in cohort
    # ---------------------------------------------------------

    if not peers:
        return {
            "stats": {
                "programme_code":
                    student.programme.code,
                "programme_name":
                    student.programme.name,
                "year":
                    student.current_year,

                "total_students": 1,

                "your_rank": (
                    1
                    if own_avg is not None
                    else None
                ),

                "percentile": (
                    100.0
                    if own_avg is not None
                    else None
                ),

                "your_average":
                    own_avg,

                "cohort_average":
                    None,

                "max_average":
                    None,

                "min_average":
                    None,

                "distribution":
                    [],

                "students_with_averages": (
                    1
                    if own_avg is not None
                    else 0
                ),

                "peer_count": 0,

                "students_without_averages": (
                    0
                    if own_avg is not None
                    else 1
                ),
            },

            "message":
                "No other students in your cohort yet. "
                "Check back later!",
        }

    # ---------------------------------------------------------
    # Calculate peer weighted averages
    # ---------------------------------------------------------

    peer_averages = []

    for peer in peers:
        peer_summary = build_progress_summary(
            db,
            peer,
        )

        peer_avg = peer_summary.get(
            "weighted_average"
        )

        if peer_avg is not None:
            peer_averages.append(
                float(peer_avg)
            )

    # ---------------------------------------------------------
    # Basic cohort counts
    # ---------------------------------------------------------

    total_students = len(peers) + 1

    peer_count = len(peers)

    students_with_averages = (
        len(peer_averages)
        + (
            1
            if own_avg is not None
            else 0
        )
    )

    students_without_averages = (
        total_students
        - students_with_averages
    )

    # ---------------------------------------------------------
    # Peers exist, but none have graded averages yet
    # ---------------------------------------------------------

    if not peer_averages:
        distribution = []

        if own_avg is not None:
            bins = [
                0,
                10,
                20,
                30,
                40,
                50,
                60,
                70,
                80,
                90,
                100,
            ]

            for i in range(
                len(bins) - 1
            ):
                low = bins[i]
                high = bins[i + 1]

                if low == 90:
                    count = (
                        1
                        if float(own_avg) >= 90
                        else 0
                    )
                else:
                    count = (
                        1
                        if (
                            low
                            <= float(own_avg)
                            < high
                        )
                        else 0
                    )

                distribution.append(
                    {
                        "range": (
                            f"{low}-{high}%"
                            if low < 90
                            else "90-100%"
                        ),
                        "count": count,
                    }
                )

        return {
            "stats": {
                "programme_code":
                    student.programme.code,

                "programme_name":
                    student.programme.name,

                "year":
                    student.current_year,

                "total_students":
                    total_students,

                "your_rank":
                    None,

                "percentile":
                    None,

                "your_average":
                    own_avg,

                "cohort_average":
                    None,

                "max_average":
                    None,

                "min_average":
                    None,

                "distribution":
                    distribution,

                "students_with_averages":
                    students_with_averages,

                "peer_count":
                    peer_count,

                "students_without_averages":
                    students_without_averages,
            },

            "message":
                "Your peers have not completed "
                "enough graded modules yet.",
        }

    # ---------------------------------------------------------
    # Sort peer averages
    # ---------------------------------------------------------

    peer_averages.sort()

    total_peers_with_averages = len(
        peer_averages
    )

    # ---------------------------------------------------------
    # Calculate current student's rank and percentile
    # ---------------------------------------------------------

    if own_avg is None:
        higher = None
        rank = None
        percentile = None

    else:
        own_avg_float = float(
            own_avg
        )

        higher = sum(
            1
            for avg in peer_averages
            if avg > own_avg_float
        )

        rank = higher + 1

        comparison_population = (
            total_peers_with_averages
            + 1
        )

        lower_or_equal = sum(
            1
            for avg in peer_averages
            if avg <= own_avg_float
        )

        percentile = (
            (
                lower_or_equal
                / comparison_population
            )
            * 100
        )

    # ---------------------------------------------------------
    # Calculate peer cohort statistics
    #
    # These statistics represent OTHER students,
    # not the current student.
    # ---------------------------------------------------------

    cohort_avg = (
        sum(peer_averages)
        / total_peers_with_averages
    )

    max_avg = max(
        peer_averages
    )

    min_avg = min(
        peer_averages
    )

    # ---------------------------------------------------------
    # Build distribution
    #
    # The distribution includes the current student's
    # average when available so their position can be
    # highlighted on the frontend.
    # ---------------------------------------------------------

    bins = [
        0,
        10,
        20,
        30,
        40,
        50,
        60,
        70,
        80,
        90,
        100,
    ]

    all_averages = (
        peer_averages.copy()
    )

    if own_avg is not None:
        all_averages.append(
            float(own_avg)
        )

    distribution = []

    for i in range(
        len(bins) - 1
    ):
        low = bins[i]
        high = bins[i + 1]

        if low == 90:
            count = sum(
                1
                for avg in all_averages
                if avg >= 90
            )

        else:
            count = sum(
                1
                for avg in all_averages
                if low <= avg < high
            )

        distribution.append(
            {
                "range": (
                    f"{low}-{high}%"
                    if low < 90
                    else "90-100%"
                ),
                "count": count,
            }
        )

    # ---------------------------------------------------------
    # Calculate difference from cohort average
    # ---------------------------------------------------------

    average_difference = None

    if (
        own_avg is not None
        and cohort_avg is not None
    ):
        average_difference = round(
            float(own_avg)
            - cohort_avg,
            1,
        )

    # ---------------------------------------------------------
    # Calculate top percentage
    # ---------------------------------------------------------

    top_percentage = None

    if percentile is not None:
        top_percentage = max(
            1,
            round(
                100 - percentile
            ),
        )

    # ---------------------------------------------------------
    # Determine comparison status
    # ---------------------------------------------------------

    comparison_status = (
        "unavailable"
    )

    if average_difference is not None:
        if average_difference > 0:
            comparison_status = (
                "above_average"
            )

        elif average_difference < 0:
            comparison_status = (
                "below_average"
            )

        else:
            comparison_status = (
                "at_average"
            )

    # ---------------------------------------------------------
    # Final response
    # ---------------------------------------------------------

    return {
        "stats": {
            "programme_code":
                student.programme.code,

            "programme_name":
                student.programme.name,

            "year":
                student.current_year,

            "total_students":
                total_students,

            "peer_count":
                peer_count,

            "students_with_averages":
                students_with_averages,

            "students_without_averages":
                students_without_averages,

            "your_rank":
                rank,

            "percentile": (
                round(
                    percentile,
                    1,
                )
                if percentile is not None
                else None
            ),

            "top_percentage":
                top_percentage,

            "your_average": (
                round(
                    float(own_avg),
                    1,
                )
                if own_avg is not None
                else None
            ),

            "cohort_average": (
                round(
                    cohort_avg,
                    1,
                )
                if cohort_avg is not None
                else None
            ),

            "average_difference":
                average_difference,

            "max_average": (
                round(
                    max_avg,
                    1,
                )
                if max_avg is not None
                else None
            ),

            "min_average": (
                round(
                    min_avg,
                    1,
                )
                if min_avg is not None
                else None
            ),

            "comparison_status":
                comparison_status,

            "distribution":
                distribution,
        },

        "message": (
            "Here's how you compare "
            "to your peers."
            if own_avg is not None
            else
            "Complete more graded "
            "modules to see your comparison."
        ),
    }

ACHIEVEMENT_DEFINITIONS = {
    # =========================================================
    # PROGRESS / MILESTONES
    # =========================================================
    "first_steps": {
        "id": "first_steps",
        "title": "First Steps",
        "description": "Complete your first module",
        "icon": "🌱",
        "category": "milestone",
        "rarity": "common",
        "xp": 100,
    },
    "getting_started": {
        "id": "getting_started",
        "title": "Getting Started",
        "description": "Complete 5 modules",
        "icon": "🚀",
        "category": "milestone",
        "rarity": "common",
        "xp": 150,
    },
    "module_master": {
        "id": "module_master",
        "title": "Module Master",
        "description": "Complete 10 modules",
        "icon": "🎓",
        "category": "milestone",
        "rarity": "uncommon",
        "xp": 250,
    },
    "module_machine": {
        "id": "module_machine",
        "title": "Module Machine",
        "description": "Complete 15 modules",
        "icon": "⚙️",
        "category": "milestone",
        "rarity": "rare",
        "xp": 350,
    },
    "quarter_way": {
        "id": "quarter_way",
        "title": "Quarter Way",
        "description": "Complete 25% of your degree credits",
        "icon": "🗺️",
        "category": "milestone",
        "rarity": "common",
        "xp": 150,
    },
    "halfway_there": {
        "id": "halfway_there",
        "title": "Halfway There!",
        "description": "Complete 50% of your degree credits",
        "icon": "🏔️",
        "category": "milestone",
        "rarity": "uncommon",
        "xp": 300,
    },
    "credit_king": {
        "id": "credit_king",
        "title": "Final Stretch",
        "description": "Complete 75% of your degree credits",
        "icon": "👑",
        "category": "milestone",
        "rarity": "rare",
        "xp": 450,
    },
    "almost_there": {
        "id": "almost_there",
        "title": "Almost There!",
        "description": "Complete 90% of your degree credits",
        "icon": "🏁",
        "category": "milestone",
        "rarity": "epic",
        "xp": 600,
    },
    "degree_conquered": {
        "id": "degree_conquered",
        "title": "Degree Conquered",
        "description": "Complete all credits required for your degree",
        "icon": "🏆",
        "category": "milestone",
        "rarity": "legendary",
        "xp": 1000,
    },

    # =========================================================
    # CREDIT ACHIEVEMENTS
    # =========================================================
    "credit_50": {
        "id": "credit_50",
        "title": "Credit Collector",
        "description": "Earn 50 academic credits",
        "icon": "💳",
        "category": "milestone",
        "rarity": "common",
        "xp": 100,
    },
    "credit_100": {
        "id": "credit_100",
        "title": "Century Club",
        "description": "Earn 100 academic credits",
        "icon": "💯",
        "category": "milestone",
        "rarity": "uncommon",
        "xp": 200,
    },
    "credit_200": {
        "id": "credit_200",
        "title": "Credit Machine",
        "description": "Earn 200 academic credits",
        "icon": "💰",
        "category": "milestone",
        "rarity": "rare",
        "xp": 400,
    },

    # =========================================================
    # YEAR / LEVEL ACHIEVEMENTS
    # =========================================================
    "year_1_complete": {
        "id": "year_1_complete",
        "title": "Year One Complete",
        "description": "Complete all Level 1 modules in your programme",
        "icon": "📚",
        "category": "academic",
        "rarity": "uncommon",
        "xp": 300,
    },
    "year_2_complete": {
        "id": "year_2_complete",
        "title": "Year Two Complete",
        "description": "Complete all Level 2 modules in your programme",
        "icon": "📘",
        "category": "academic",
        "rarity": "rare",
        "xp": 450,
    },
    "year_3_complete": {
        "id": "year_3_complete",
        "title": "Final Boss Defeated",
        "description": "Complete all Level 3 modules in your programme",
        "icon": "🐉",
        "category": "academic",
        "rarity": "epic",
        "xp": 700,
    },

    # =========================================================
    # COMPULSORY / ELECTIVE ACHIEVEMENTS
    # =========================================================
    "all_compulsory_complete": {
        "id": "all_compulsory_complete",
        "title": "Compulsory Conqueror",
        "description": "Complete every compulsory module in your programme",
        "icon": "🎯",
        "category": "academic",
        "rarity": "legendary",
        "xp": 800,
    },
    "elective_explorer": {
        "id": "elective_explorer",
        "title": "Elective Explorer",
        "description": "Complete at least 2 elective modules",
        "icon": "🧭",
        "category": "academic",
        "rarity": "common",
        "xp": 150,
    },
    "elective_expert": {
        "id": "elective_expert",
        "title": "Elective Expert",
        "description": "Complete at least 4 elective modules",
        "icon": "🗺️",
        "category": "academic",
        "rarity": "rare",
        "xp": 350,
    },

    # =========================================================
    # ACADEMIC PERFORMANCE
    # =========================================================
    "gpa_65": {
        "id": "gpa_65",
        "title": "Rising Star",
        "description": "Achieve a overall average of 65% or higher",
        "icon": "✨",
        "category": "excellence",
        "rarity": "common",
        "xp": 150,
    },
    "gpa_70": {
        "id": "gpa_70",
        "title": "Academic Excellence",
        "description": "Achieve a overall average of 70% or higher",
        "icon": "⭐",
        "category": "excellence",
        "rarity": "uncommon",
        "xp": 250,
    },
    "gpa_75": {
        "id": "gpa_75",
        "title": "Top Achiever",
        "description": "Achieve a overall average of 75% or higher",
        "icon": "🌟",
        "category": "excellence",
        "rarity": "rare",
        "xp": 350,
    },
    "gpa_80": {
        "id": "gpa_80",
        "title": "Academic Elite",
        "description": "Achieve a overall average of 80% or higher",
        "icon": "🏅",
        "category": "excellence",
        "rarity": "epic",
        "xp": 500,
    },
    "gpa_85": {
        "id": "gpa_85",
        "title": "Elite Scholar",
        "description": "Achieve a overall average of 85% or higher",
        "icon": "💎",
        "category": "excellence",
        "rarity": "legendary",
        "xp": 750,
    },

    # =========================================================
    # SEMESTER ACHIEVEMENTS
    # =========================================================
    "perfect_semester": {
        "id": "perfect_semester",
        "title": "Clean Semester",
        "description": "Complete at least 3 modules in one semester without failing any",
        "icon": "💯",
        "category": "excellence",
        "rarity": "uncommon",
        "xp": 250,
    },
    "two_clean_semesters": {
        "id": "two_clean_semesters",
        "title": "On Fire",
        "description": "Complete 2 clean semesters",
        "icon": "🔥",
        "category": "excellence",
        "rarity": "rare",
        "xp": 400,
    },
    "three_clean_semesters": {
        "id": "three_clean_semesters",
        "title": "Hat Trick",
        "description": "Complete 3 clean semesters",
        "icon": "🎩",
        "category": "excellence",
        "rarity": "epic",
        "xp": 600,
    },

    # =========================================================
    # PERSEVERANCE
    # =========================================================
    "retake_success": {
        "id": "retake_success",
        "title": "Comeback King",
        "description": "Pass a module you previously failed",
        "icon": "🔄",
        "category": "perseverance",
        "rarity": "uncommon",
        "xp": 250,
    },
    "multiple_comebacks": {
        "id": "multiple_comebacks",
        "title": "Never Give Up",
        "description": "Successfully recover from 2 previously failed modules",
        "icon": "💪",
        "category": "perseverance",
        "rarity": "rare",
        "xp": 400,
    },
    "redemption_arc": {
        "id": "redemption_arc",
        "title": "Redemption Arc",
        "description": "Score 60% or higher when successfully retaking a failed module",
        "icon": "⚡",
        "category": "perseverance",
        "rarity": "epic",
        "xp": 500,
    },

    # =========================================================
    # SPECIAL
    # =========================================================
    "all_clear": {
        "id": "all_clear",
        "title": "Flawless Record",
        "description": "Complete your modules without recording a failed enrolment",
        "icon": "✨",
        "category": "excellence",
        "rarity": "rare",
        "xp": 350,
    },
    "final_module": {
        "id": "final_module",
        "title": "The Final Module",
        "description": "Have only one programme module left to complete",
        "icon": "⚔️",
        "category": "milestone",
        "rarity": "epic",
        "xp": 500,
    },
}


# XP level system
ACHIEVEMENT_LEVELS = [
    {
        "level": 1,
        "title": "Rookie",
        "min_xp": 0,
    },
    {
        "level": 2,
        "title": "Explorer",
        "min_xp": 500,
    },
    {
        "level": 3,
        "title": "Achiever",
        "min_xp": 1200,
    },
    {
        "level": 4,
        "title": "Scholar",
        "min_xp": 2200,
    },
    {
        "level": 5,
        "title": "Master",
        "min_xp": 3500,
    },
    {
        "level": 6,
        "title": "Legend",
        "min_xp": 5500,
    },
]


def _get_completed_levels(
    db: Session,
    student: models.Student,
) -> dict:
    """Get completion status by programme module level."""

    programme_modules = (
        db.query(models.ProgrammeModule)
        .filter(
            models.ProgrammeModule.programme_id
            == student.programme_id
        )
        .options(
            joinedload(
                models.ProgrammeModule.module
            )
        )
        .all()
    )

    completed_ids = {
        e.module_id
        for e in db.query(models.Enrolment)
        .filter(
            models.Enrolment.student_id
            == student.id,
            models.Enrolment.status
            == "completed",
        )
        .all()
    }

    level_counts = {}

    for link in programme_modules:
        level = link.module.level

        if level not in level_counts:
            level_counts[level] = {
                "total": 0,
                "completed": 0,
            }

        level_counts[level]["total"] += 1

        if link.module.id in completed_ids:
            level_counts[level][
                "completed"
            ] += 1

    return level_counts


def _get_all_pass_count(
    db: Session,
    student: models.Student,
) -> bool:
    """Return True when no failed enrolment exists."""

    failed = (
        db.query(models.Enrolment)
        .filter(
            models.Enrolment.student_id
            == student.id,
            models.Enrolment.status
            == "failed",
        )
        .first()
    )

    return failed is None


def _get_achievement_level(
    total_xp: int,
) -> dict:
    """Calculate achievement level from XP."""

    current = ACHIEVEMENT_LEVELS[0]

    for level in ACHIEVEMENT_LEVELS:
        if total_xp >= level["min_xp"]:
            current = level
        else:
            break

    current_index = ACHIEVEMENT_LEVELS.index(
        current
    )

    if (
        current_index
        < len(ACHIEVEMENT_LEVELS) - 1
    ):
        next_level = ACHIEVEMENT_LEVELS[
            current_index + 1
        ]

        xp_to_next = max(
            next_level["min_xp"] - total_xp,
            0,
        )

        level_range = (
            next_level["min_xp"]
            - current["min_xp"]
        )

        progress_in_level = (
            total_xp - current["min_xp"]
        )

        level_progress = (
            round(
                (
                    progress_in_level
                    / level_range
                )
                * 100,
                1,
            )
            if level_range > 0
            else 100
        )

        return {
            "level": current["level"],
            "level_title": current["title"],
            "next_level": next_level[
                "level"
            ],
            "next_level_title": next_level[
                "title"
            ],
            "xp_to_next_level": xp_to_next,
            "level_progress": min(
                level_progress,
                100,
            ),
            "current_level_min_xp": current[
                "min_xp"
            ],
            "next_level_min_xp": next_level[
                "min_xp"
            ],
        }

    return {
        "level": current["level"],
        "level_title": current["title"],
        "next_level": None,
        "next_level_title": None,
        "xp_to_next_level": 0,
        "level_progress": 100,
        "current_level_min_xp": current[
            "min_xp"
        ],
        "next_level_min_xp": None,
    }


def calculate_achievements(
    db: Session,
    student: models.Student,
) -> set:
    """Calculate all unlocked achievements."""

    summary = build_progress_summary(
        db,
        student,
    )

    enrolments = (
        db.query(models.Enrolment)
        .filter(
            models.Enrolment.student_id
            == student.id
        )
        .all()
    )

    completed_enrolments = [
        e
        for e in enrolments
        if e.status == "completed"
    ]

    completed_ids = {
        e.module_id
        for e in completed_enrolments
    }

    programme_modules = (
        db.query(models.ProgrammeModule)
        .filter(
            models.ProgrammeModule.programme_id
            == student.programme_id
        )
        .options(
            joinedload(
                models.ProgrammeModule.module
            )
        )
        .all()
    )

    total_modules = len(
        programme_modules
    )

    total_compulsory = len(
        [
            pm
            for pm in programme_modules
            if pm.is_compulsory
        ]
    )

    completed_compulsory = len(
        [
            pm
            for pm in programme_modules
            if pm.is_compulsory
            and pm.module.id
            in completed_ids
        ]
    )

    completed_elective = len(
        [
            pm
            for pm in programme_modules
            if not pm.is_compulsory
            and pm.module.id
            in completed_ids
        ]
    )

    credits_completed = (
        summary["credits_completed"]
    )

    credits_required = (
        summary["credits_required"]
    )

    weighted_average = summary.get(
        "weighted_average"
    )

    achievements = []

    # ---------------------------------------------------------
    # Module milestones
    # ---------------------------------------------------------

    completed_count = len(
        completed_ids
    )

    if completed_count >= 1:
        achievements.append(
            "first_steps"
        )

    if completed_count >= 5:
        achievements.append(
            "getting_started"
        )

    if completed_count >= 10:
        achievements.append(
            "module_master"
        )

    if completed_count >= 15:
        achievements.append(
            "module_machine"
        )

    # ---------------------------------------------------------
    # Degree progress
    # ---------------------------------------------------------

    if credits_required > 0:
        degree_progress = (
            credits_completed
            / credits_required
        )

        if degree_progress >= 0.25:
            achievements.append(
                "quarter_way"
            )

        if degree_progress >= 0.50:
            achievements.append(
                "halfway_there"
            )

        if degree_progress >= 0.75:
            achievements.append(
                "credit_king"
            )

        if degree_progress >= 0.90:
            achievements.append(
                "almost_there"
            )

        if credits_completed >= credits_required:
            achievements.append(
                "degree_conquered"
            )

    # ---------------------------------------------------------
    # Credit milestones
    # ---------------------------------------------------------

    if credits_completed >= 50:
        achievements.append(
            "credit_50"
        )

    if credits_completed >= 100:
        achievements.append(
            "credit_100"
        )

    if credits_completed >= 200:
        achievements.append(
            "credit_200"
        )

    # ---------------------------------------------------------
    # Compulsory / elective
    # ---------------------------------------------------------

    if (
        total_compulsory > 0
        and completed_compulsory
        == total_compulsory
    ):
        achievements.append(
            "all_compulsory_complete"
        )

    if completed_elective >= 2:
        achievements.append(
            "elective_explorer"
        )

    if completed_elective >= 4:
        achievements.append(
            "elective_expert"
        )

    # ---------------------------------------------------------
    # Programme levels
    # ---------------------------------------------------------

    level_counts = _get_completed_levels(
        db,
        student,
    )

    for level, achievement_id in [
        (1, "year_1_complete"),
        (2, "year_2_complete"),
        (3, "year_3_complete"),
    ]:
        level_data = level_counts.get(
            level,
            {},
        )

        if (
            level_data.get("total", 0) > 0
            and level_data.get(
                "completed",
                0,
            )
            == level_data.get(
                "total",
                0,
            )
        ):
            achievements.append(
                achievement_id
            )

    # ---------------------------------------------------------
    # Overall-average achievements
    # ---------------------------------------------------------

    if weighted_average is not None:
        if weighted_average >= 65:
            achievements.append(
                "gpa_65"
            )

        if weighted_average >= 70:
            achievements.append(
                "gpa_70"
            )

        if weighted_average >= 75:
            achievements.append(
                "gpa_75"
            )

        if weighted_average >= 80:
            achievements.append(
                "gpa_80"
            )

        if weighted_average >= 85:
            achievements.append(
                "gpa_85"
            )

    # ---------------------------------------------------------
    # Semester achievements
    # ---------------------------------------------------------

    semester_modules = {}

    for enrolment in enrolments:
        if not enrolment.semester:
            continue

        semester_modules.setdefault(
            enrolment.semester,
            [],
        ).append(enrolment)

    clean_semesters = 0

    for semester_enrolments in (
        semester_modules.values()
    ):
        # Only count a meaningful semester.
        # Planned/in-progress modules do not
        # count as a completed clean semester.
        finished = [
            e
            for e in semester_enrolments
            if e.status
            in ("completed", "failed")
        ]

        if (
            len(finished) >= 3
            and all(
                e.status == "completed"
                for e in finished
            )
        ):
            clean_semesters += 1

    if clean_semesters >= 1:
        achievements.append(
            "perfect_semester"
        )

    if clean_semesters >= 2:
        achievements.append(
            "two_clean_semesters"
        )

    if clean_semesters >= 3:
        achievements.append(
            "three_clean_semesters"
        )

    # ---------------------------------------------------------
    # Retakes / perseverance
    # ---------------------------------------------------------

    failed_module_ids = {
        e.module_id
        for e in enrolments
        if e.status == "failed"
    }

    recovered_module_ids = (
        failed_module_ids
        .intersection(completed_ids)
    )

    if recovered_module_ids:
        achievements.append(
            "retake_success"
        )

    if len(recovered_module_ids) >= 2:
        achievements.append(
            "multiple_comebacks"
        )

    # A successful retake with a mark >= 60.
    redemption = False

    for enrolment in completed_enrolments:
        if (
            enrolment.module_id
            in failed_module_ids
            and enrolment.grade is not None
            and enrolment.grade >= 60
        ):
            redemption = True
            break

    if redemption:
        achievements.append(
            "redemption_arc"
        )

    # ---------------------------------------------------------
    # Special achievements
    # ---------------------------------------------------------

    if (
        _get_all_pass_count(
            db,
            student,
        )
        and completed_count > 0
    ):
        achievements.append(
            "all_clear"
        )

    remaining_modules = max(
        total_modules - completed_count,
        0,
    )

    if (
        total_modules > 0
        and remaining_modules == 1
    ):
        achievements.append(
            "final_module"
        )

    return set(achievements)


def get_achievement_summary(
    db: Session,
    student: models.Student,
) -> dict:
    """Build achievement dashboard data."""

    unlocked_ids = calculate_achievements(
        db,
        student,
    )

    achievements = []

    for key, defn in (
        ACHIEVEMENT_DEFINITIONS.items()
    ):
        unlocked = (
            key in unlocked_ids
        )

        achievements.append(
            {
                "id": defn["id"],
                "title": defn["title"],
                "description": defn[
                    "description"
                ],
                "icon": defn["icon"],
                "category": defn[
                    "category"
                ],
                "rarity": defn.get(
                    "rarity",
                    "common",
                ),
                "xp": defn.get(
                    "xp",
                    100,
                ),
                "unlocked": unlocked,
                "unlocked_at": (
                    datetime.now()
                    if unlocked
                    else None
                ),
                "progress": (
                    100
                    if unlocked
                    else None
                ),
                "progress_label": None,
            }
        )

    unlocked = [
        achievement
        for achievement in achievements
        if achievement["unlocked"]
    ]

    locked = [
        achievement
        for achievement in achievements
        if not achievement["unlocked"]
    ]

    total = len(achievements)
    unlocked_count = len(unlocked)

    total_xp = sum(
        achievement["xp"]
        for achievement in unlocked
    )

    level_info = _get_achievement_level(
        total_xp
    )

    rarity_summary = {
        "common": 0,
        "uncommon": 0,
        "rare": 0,
        "epic": 0,
        "legendary": 0,
    }

    for achievement in unlocked:
        rarity = achievement.get(
            "rarity",
            "common",
        )

        rarity_summary[rarity] = (
            rarity_summary.get(
                rarity,
                0,
            )
            + 1
        )

    return {
        "total_achievements": total,
        "unlocked_achievements": (
            unlocked_count
        ),
        "locked_achievements": (
            total - unlocked_count
        ),
        "completion_percentage": (
            round(
                (
                    unlocked_count
                    / total
                )
                * 100,
                1,
            )
            if total > 0
            else 0
        ),

        # XP / level system
        "total_xp": total_xp,
        **level_info,

        # Extra stats
        "rarity_summary": (
            rarity_summary
        ),

        # Achievement lists
        "achievements": (
            unlocked + locked
        ),
        "recent_unlocks": (
            unlocked[-5:]
        ),
        "next_milestones": (
            locked[:5]
        ),
    }

def notify_grade_released(
    db: Session,
    student: models.Student,
    module: models.Module,
    grade: float,
    semester: str,
) -> None:
    """
    Send a grade-release email when an official passing
    grade is recorded for a student.
    """
    if grade >= settings.pass_mark:
        send_grade_released_email(
            student,
            module,
            grade,
            semester,
        )