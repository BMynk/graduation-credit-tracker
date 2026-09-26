# app/routers/planning.py

from typing import List, Optional
import re

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_student
from app.services import progress_service


router = APIRouter(
    prefix="/planning",
    tags=["Planning"],
)


# ============================================================
# SCHEMAS
# ============================================================

class ModulePlanItem(BaseModel):
    code: str
    name: str
    credits: int
    level: int
    category: str

    is_compulsory: bool

    # Curriculum position
    curriculum_year: int
    curriculum_semester: int

    # Student progression information
    student_current_year: int
    is_previous_year: bool
    is_current_year: bool
    is_future_year: bool

    # Student/module state
    is_completed: bool
    is_failed: bool
    is_retake: bool
    is_enrolled: bool

    # Eligibility
    is_eligible: bool
    reason: Optional[str] = None

    prerequisites_met: bool
    missing_prerequisites: List[str] = []


class PlanRequest(BaseModel):
    module_codes: List[str]
    semester: str


class PlanResponse(BaseModel):
    selected_modules: List[ModulePlanItem]

    total_credits: int
    compulsory_count: int
    elective_count: int

    warnings: List[str]
    errors: List[str] = []
    is_valid: bool

    recommended_modules: List[ModulePlanItem]
    missing_compulsory: List[ModulePlanItem]


# ============================================================
# HELPERS
# ============================================================

def _passed_module_ids(
    db: Session,
    student: models.Student,
) -> set:
    """
    Return IDs of modules that the student has completed.
    """

    rows = (
        db.query(models.Enrolment.module_id)
        .filter(
            models.Enrolment.student_id == student.id,
            models.Enrolment.status == "completed",
        )
        .all()
    )

    return {row[0] for row in rows}


def _get_student_enrolment_state(
    db: Session,
    student: models.Student,
):
    """
    Collect module state information for the current student.
    """

    enrolments = (
        db.query(models.Enrolment)
        .filter(
            models.Enrolment.student_id == student.id
        )
        .all()
    )

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
        if enrolment.status in {
            "planned",
            "in-progress",
        }
    }

    return (
        completed_ids,
        failed_ids,
        enrolled_ids,
    )


def _validate_semester_value(
    semester: str,
) -> str:
    """
    Validate the semester identifier used for saved plans.

    Existing enrolments use strings such as:
        2026-S1
        2026-S2
    """

    semester = semester.strip().upper()

    if not re.fullmatch(r"\\d{4}-S[12]", semester):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Semester must use the format YYYY-S1 or YYYY-S2 "
                "(for example, 2026-S2)."
            ),
        )

    return semester


def _semester_number(semester: str) -> int:
    """Return 1 or 2 from a validated YYYY-S1/YYYY-S2 value."""
    return int(semester[-1])


def _build_planning_modules(
    db: Session,
    student: models.Student,
) -> List[ModulePlanItem]:
    """
    Build the authoritative planner module list.

    Rules
    -----
    1. Completed modules cannot be planned again.

    2. Modules from a future curriculum year are locked.

    3. Modules in the student's current curriculum year may
       be planned when prerequisites are satisfied.

    4. Outstanding modules from previous curriculum years
       remain available.

    5. Failed modules from previous years remain available
       as retakes.

    6. Prerequisites are always enforced.

    7. Modules already planned/in-progress cannot be selected
       again.
    """

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

    (
        completed_ids,
        failed_ids,
        enrolled_ids,
    ) = _get_student_enrolment_state(
        db,
        student,
    )

    passed_ids = _passed_module_ids(
        db,
        student,
    )

    # Once a prospectus choice/OR group is satisfied, unused alternatives
    # are no longer outstanding planner recommendations.
    satisfied_choice_alternative_ids = set()
    requirement_groups = (
        db.query(models.ProgrammeRequirementGroup)
        .options(
            joinedload(models.ProgrammeRequirementGroup.options)
            .joinedload(models.ProgrammeRequirementOption.module)
        )
        .filter(models.ProgrammeRequirementGroup.programme_id == student.programme_id)
        .all()
    )
    for group in requirement_groups:
        completed_options = [
            option for option in group.options
            if option.module_id in passed_ids
        ]
        completed_credits = sum(
            option.module.credits
            for option in completed_options
            if option.module is not None
        )
        if (
            len(completed_options) >= group.min_modules
            and completed_credits >= group.min_credits
        ):
            satisfied_choice_alternative_ids.update(
                option.module_id
                for option in group.options
                if option.module_id not in passed_ids
            )

    student_year = student.current_year

    result: List[ModulePlanItem] = []

    for link in programme_modules:
        module = link.module

        if module is None:
            continue

        curriculum_year = link.year
        curriculum_semester = link.semester

        is_completed = (
            module.id in completed_ids
        )

        is_failed = (
            module.id in failed_ids
        )

        is_enrolled = (
            module.id in enrolled_ids
        )

        is_previous_year = (
            curriculum_year < student_year
        )

        is_current_year = (
            curriculum_year == student_year
        )

        is_future_year = (
            curriculum_year > student_year
        )

        # ----------------------------------------------------
        # PREREQUISITES
        # ----------------------------------------------------

        missing_prerequisites = []

        for prerequisite in module.prerequisites:
            if prerequisite.id not in passed_ids:
                missing_prerequisites.append(
                    prerequisite.code
                )

        prerequisites_met = (
            len(missing_prerequisites) == 0
        )

        # ----------------------------------------------------
        # ELIGIBILITY
        # ----------------------------------------------------

        is_eligible = False
        reason = None

        if is_completed:
            reason = "Already completed"

        elif module.id in satisfied_choice_alternative_ids:
            reason = "Curriculum choice requirement already satisfied"

        elif is_enrolled:
            reason = (
                "Already planned or currently in progress"
            )

        elif is_future_year:
            reason = (
                f"Available when you progress to "
                f"Year {curriculum_year}"
            )

        elif not prerequisites_met:
            reason = (
                "Missing prerequisites: "
                + ", ".join(
                    missing_prerequisites
                )
            )

        elif is_failed:
            is_eligible = True

            if is_previous_year:
                reason = (
                    f"Retake from Year "
                    f"{curriculum_year}"
                )
            else:
                reason = "Eligible for retake"

        elif is_previous_year:
            is_eligible = True
            reason = (
                f"Outstanding Year "
                f"{curriculum_year} module"
            )

        elif is_current_year:
            is_eligible = True
            reason = (
                f"Year {curriculum_year} • "
                f"Semester {curriculum_semester}"
            )

        else:
            reason = "Not currently available"

        result.append(
            ModulePlanItem(
                code=module.code,
                name=module.name,
                credits=module.credits,
                level=module.level,
                category=module.category,

                is_compulsory=link.is_compulsory,

                curriculum_year=curriculum_year,
                curriculum_semester=(
                    curriculum_semester
                ),

                student_current_year=student_year,

                is_previous_year=(
                    is_previous_year
                ),

                is_current_year=(
                    is_current_year
                ),

                is_future_year=(
                    is_future_year
                ),

                is_completed=is_completed,
                is_failed=is_failed,

                is_retake=(
                    is_failed
                    and not is_completed
                ),

                is_enrolled=is_enrolled,

                is_eligible=is_eligible,
                reason=reason,

                prerequisites_met=(
                    prerequisites_met
                ),

                missing_prerequisites=(
                    missing_prerequisites
                ),
            )
        )

    # --------------------------------------------------------
    # SORTING
    # --------------------------------------------------------

    result.sort(
        key=lambda item: (
            item.curriculum_year,
            item.curriculum_semester,
            not item.is_compulsory,
            item.code,
        )
    )

    return result


def _planning_module_map(
    db: Session,
    student: models.Student,
):
    modules = _build_planning_modules(
        db,
        student,
    )

    return {
        module.code: module
        for module in modules
    }


# ============================================================
# EXISTING ELIGIBLE MODULE ENDPOINT
# ============================================================

@router.get(
    "/eligible-modules",
    response_model=list[
        schemas.EligibleModuleOut
    ],
)
def eligible_modules(
    current_student: models.Student = Depends(
        get_current_student
    ),
    db: Session = Depends(get_db),
):
    """
    Existing eligibility endpoint retained for compatibility.
    """

    results = (
        progress_service.get_eligible_modules(
            db,
            current_student,
        )
    )

    return [
        schemas.EligibleModuleOut(
            **schemas.ModuleOut.model_validate(
                result["module"]
            ).model_dump(),
            reason=result["reason"],
        )
        for result in results
    ]


# ============================================================
# GRADUATION AUDIT
# ============================================================

@router.get(
    "/graduation-audit",
    response_model=schemas.GraduationAudit,
)
def graduation_audit(
    current_student: models.Student = Depends(
        get_current_student
    ),
    db: Session = Depends(get_db),
):
    return (
        progress_service.build_graduation_audit(
            db,
            current_student,
        )
    )


# ============================================================
# PLANNER MODULES
# ============================================================

@router.get(
    "/planning-modules",
    response_model=List[ModulePlanItem],
)
def get_planning_modules(
    current_student: models.Student = Depends(
        get_current_student
    ),
    db: Session = Depends(get_db),
):
    """
    Return the student's complete curriculum with authoritative
    planning eligibility.

    The frontend should use:
        curriculum_year
        curriculum_semester
        is_eligible
        is_previous_year
        is_current_year
        is_future_year
        is_retake

    to build the grouped Planner interface.
    """

    return _build_planning_modules(
        db,
        current_student,
    )


# ============================================================
# GENERATE PLAN
# ============================================================

@router.post(
    "/plan",
    response_model=PlanResponse,
)
def generate_plan(
    payload: PlanRequest,
    current_student: models.Student = Depends(
        get_current_student
    ),
    db: Session = Depends(get_db),
):
    """
    Analyse a proposed semester plan.

    The backend independently checks eligibility instead of
    trusting the frontend.
    """

    semester = _validate_semester_value(
        payload.semester
    )
    target_semester = _semester_number(semester)

    all_modules = (
        _build_planning_modules(
            db,
            current_student,
        )
    )

    module_map = {
        module.code: module
        for module in all_modules
    }

    selected_modules = []
    warnings = []
    errors = []

    total_credits = 0
    compulsory_count = 0
    elective_count = 0

    # --------------------------------------------------------
    # DUPLICATE MODULE CODES
    # --------------------------------------------------------

    requested_codes = list(
        dict.fromkeys(
            payload.module_codes
        )
    )

    # --------------------------------------------------------
    # VALIDATE SELECTED MODULES
    # --------------------------------------------------------

    for code in requested_codes:
        module = module_map.get(code)

        if module is None:
            warnings.append(
                f"{code}: module not found "
                f"in your programme"
            )
            continue

        if not module.is_eligible:
            errors.append(
                f"{code}: {module.reason}"
            )
            continue

        if module.curriculum_semester != target_semester:
            errors.append(
                f"{code}: offered in Semester "
                f"{module.curriculum_semester}, not Semester "
                f"{target_semester}."
            )
            continue

        selected_modules.append(
            module
        )

        total_credits += module.credits

        if module.is_compulsory:
            compulsory_count += 1
        else:
            elective_count += 1

    # --------------------------------------------------------
    # MISSING COMPULSORY MODULES
    # --------------------------------------------------------

    missing_compulsory = []

    for module in all_modules:
        if not module.is_compulsory:
            continue

        if module.is_completed:
            continue

        # Do not tell a student to take a future-year
        # compulsory module yet.
        if module.is_future_year:
            continue

        if module.code in requested_codes:
            continue

        if module.curriculum_semester != target_semester:
            continue

        missing_compulsory.append(
            module
        )

    # --------------------------------------------------------
    # GENERAL PLAN WARNINGS
    # --------------------------------------------------------

    is_valid = True

    if total_credits > 60:
        warnings.append(
            f"Total credits ({total_credits}) "
            f"exceeds the recommended maximum "
            f"of 60."
        )
        is_valid = False

    if total_credits < 45:
        warnings.append(
            f"Total credits ({total_credits}) are below the typical "
            f"45-credit planning guide. A lighter valid semester may "
            f"still be appropriate depending on your curriculum."
        )

    # Invalid selections should also make the plan invalid.
    invalid_requested = [
        code
        for code in requested_codes
        if (
            code not in module_map
            or not module_map[code].is_eligible
        )
    ]

    if invalid_requested:
        is_valid = False

    if errors:
        is_valid = False

    # --------------------------------------------------------
    # RECOMMENDATIONS
    # --------------------------------------------------------

    recommended_modules = []

    # Priority:
    # 1. Previous-year retakes/outstanding compulsory modules
    # 2. Current-year compulsory modules
    # 3. Other eligible modules

    recommendation_candidates = [
        module
        for module in all_modules
        if (
            module.is_eligible
            and module.curriculum_semester == target_semester
            and module.code
            not in requested_codes
        )
    ]

    recommendation_candidates.sort(
        key=lambda module: (
            # Retakes first
            not module.is_retake,

            # Previous-year work next
            not module.is_previous_year,

            # Compulsory before electives
            not module.is_compulsory,

            module.curriculum_year,
            module.curriculum_semester,
            module.code,
        )
    )

    recommended_modules = (
        recommendation_candidates[:5]
    )

    return PlanResponse(
        selected_modules=selected_modules,
        total_credits=total_credits,
        compulsory_count=compulsory_count,
        elective_count=elective_count,
        warnings=warnings,
        errors=errors,
        is_valid=is_valid,
        recommended_modules=(
            recommended_modules
        ),
        missing_compulsory=(
            missing_compulsory
        ),
    )


# ============================================================
# SAVE PLAN
# ============================================================

@router.post(
    "/save-plan",
    status_code=status.HTTP_201_CREATED,
)
def save_plan(
    payload: PlanRequest,
    current_student: models.Student = Depends(
        get_current_student
    ),
    db: Session = Depends(get_db),
):
    """
    Save a student's semester plan.

    SECURITY / DATA-INTEGRITY RULE:
    Never trust eligibility information from the frontend.

    Every requested module is rebuilt and validated against
    the current database state before anything is saved.
    """

    semester = _validate_semester_value(
        payload.semester
    )
    target_semester = _semester_number(semester)

    module_map = _planning_module_map(
        db,
        current_student,
    )

    requested_codes = list(
        dict.fromkeys(
            payload.module_codes
        )
    )

    # --------------------------------------------------------
    # VALIDATE EVERYTHING BEFORE DELETING/SAVING
    # --------------------------------------------------------

    validation_errors = []

    valid_modules = []

    for code in requested_codes:
        module = module_map.get(code)

        if module is None:
            validation_errors.append(
                f"{code}: module is not part "
                f"of your programme"
            )
            continue

        if not module.is_eligible:
            validation_errors.append(
                f"{code}: {module.reason}"
            )
            continue

        if module.curriculum_semester != target_semester:
            validation_errors.append(
                f"{code}: offered in Semester "
                f"{module.curriculum_semester}, not Semester "
                f"{target_semester}."
            )
            continue

        valid_modules.append(
            module
        )

    if validation_errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": (
                    "One or more modules cannot "
                    "be added to this plan."
                ),
                "errors": validation_errors,
            },
        )

    # --------------------------------------------------------
    # CREDIT LIMIT
    # --------------------------------------------------------

    total_credits = sum(
        module.credits
        for module in valid_modules
    )

    if total_credits > 60:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": (
                    f"Plan contains {total_credits} "
                    f"credits. The maximum allowed "
                    f"for this planner is 60."
                ),
            },
        )

    # --------------------------------------------------------
    # REPLACE EXISTING PLAN FOR THIS SEMESTER
    # --------------------------------------------------------

    (
        db.query(models.Enrolment)
        .filter(
            models.Enrolment.student_id
            == current_student.id,

            models.Enrolment.semester
            == semester,

            models.Enrolment.status
            == "planned",
        )
        .delete(
            synchronize_session=False
        )
    )

    # Flush deletion before creating replacements.
    db.flush()

    created = 0

    for planned_module in valid_modules:
        module = (
            db.query(models.Module)
            .filter(
                models.Module.code
                == planned_module.code
            )
            .first()
        )

        if module is None:
            continue

        # Determine next attempt number.
        previous_attempts = (
            db.query(models.Enrolment)
            .filter(
                models.Enrolment.student_id
                == current_student.id,

                models.Enrolment.module_id
                == module.id,
            )
            .all()
        )

        next_attempt = 1

        if previous_attempts:
            next_attempt = (
                max(
                    enrolment.attempt
                    for enrolment
                    in previous_attempts
                )
                + 1
            )

        db.add(
            models.Enrolment(
                student_id=current_student.id,
                module_id=module.id,
                semester=semester,
                grade=None,
                status="planned",
                attempt=next_attempt,
            )
        )

        created += 1

    db.commit()

    return {
        "message": (
            f"Plan saved for {semester}"
        ),
        "modules_saved": created,
        "total_credits": total_credits,
    }