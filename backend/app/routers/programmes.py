# app/routers/programmes.py

from collections import defaultdict
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_admin


router = APIRouter(
    prefix="/programmes",
    tags=["Programmes"],
)


# ============================================================
# PUBLIC ENDPOINTS
# ============================================================

@router.get(
    "",
    response_model=list[schemas.ProgrammeOut],
)
def list_programmes(
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Programme)
        .order_by(models.Programme.name)
        .all()
    )


@router.get("/verification/report")
def get_curriculum_verification_report(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Read-only drift audit against the bundled 2026 reference, not official certification."""
    from seed import PROGRAMMES, MODULES, PROGRAMME_MODULES, REQUIREMENT_GROUPS, ALIAS_CODES, curriculum_position

    reference_modules = {m[0]: m for m in MODULES}
    actual_programmes = {p.code: p for p in db.query(models.Programme).all()}
    reports = []
    for spec in PROGRAMMES:
        code = spec["code"]
        programme = actual_programmes.get(code)
        expected = {}
        choice_codes = {
            ALIAS_CODES.get(raw, raw)
            for requirement in REQUIREMENT_GROUPS.get(code, [])
            for raw in requirement["options"]
        }
        for group in ("compulsory", "elective"):
            for raw_code in PROGRAMME_MODULES.get(code, {}).get(group, []):
                module_code = ALIAS_CODES.get(raw_code, raw_code)
                if module_code in reference_modules:
                    expected[module_code] = (reference_modules[module_code], group == "compulsory" and module_code not in choice_codes)
        issues = []
        if programme is None:
            issues.append({"module": None, "type": "missing_programme", "detail": "Programme missing from database"})
        else:
            links = db.query(models.ProgrammeModule).options(
                joinedload(models.ProgrammeModule.module)
            ).filter(models.ProgrammeModule.programme_id == programme.id).all()
            actual = {link.module.code: link for link in links if link.module}
            for module_code, (ref, compulsory) in expected.items():
                link = actual.get(module_code)
                if link is None:
                    issues.append({"module": module_code, "type": "missing_module", "detail": "Reference module not linked"})
                    continue
                expected_year, expected_semester = curriculum_position(link.module)
                for field, observed, target in (
                    ("credits", link.module.credits, ref[2]),
                    ("year", link.year, expected_year),
                    ("semester", link.semester, expected_semester),
                    ("compulsory", link.is_compulsory, compulsory),
                ):
                    if observed != target:
                        issues.append({"module": module_code, "type": "mismatch",
                                       "detail": f"{field}: database={observed}, reference={target}"})
            for module_code in sorted(actual.keys() - expected.keys()):
                issues.append({"module": module_code, "type": "extra_module", "detail": "Not in bundled reference"})
        reports.append({"programme_code": code, "programme_name": spec["name"],
                        "issues": issues, "issue_count": len(issues)})
    return {
        "reference": "Bundled 2026 dataset — NOT independently verified against the official UFH prospectus",
        "warning": "These are differences from the bundled dataset, not proven prospectus errors. Review programme entry year and official UFH documentation before applying changes. No student records are modified.",
        "programmes": reports,
    }


@router.get(
    "/{code}",
    response_model=schemas.ProgrammeOut,
)
def get_programme(
    code: str,
    db: Session = Depends(get_db),
):
    programme = (
        db.query(models.Programme)
        .filter(models.Programme.code == code)
        .first()
    )

    if programme is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown programme code '{code}'",
        )

    return programme


@router.get(
    "/{code}/curriculum",
    response_model=schemas.ProgrammeCurriculumOut,
)
def get_curriculum(
    code: str,
    db: Session = Depends(get_db),
):
    """
    Return the curriculum for a programme.

    Modules remain grouped by module level for compatibility
    with the existing frontend/API structure.

    Each module now also includes:
    - curriculum_year
    - curriculum_semester
    """

    programme = (
        db.query(models.Programme)
        .filter(models.Programme.code == code)
        .first()
    )

    if programme is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown programme code '{code}'",
        )

    links = (
        db.query(models.ProgrammeModule)
        .options(
            joinedload(models.ProgrammeModule.module)
        )
        .filter(
            models.ProgrammeModule.programme_id
            == programme.id
        )
        .all()
    )

    by_level: dict = defaultdict(list)

    for link in links:
        module = link.module

        if module is None:
            continue

        by_level[module.level].append(
            schemas.CurriculumModuleOut(
                code=module.code,
                name=module.name,
                credits=module.credits,
                category=module.category,
                level=module.level,
                description=module.description,
                is_compulsory=link.is_compulsory,
                curriculum_year=link.year,
                curriculum_semester=link.semester,
            )
        )

    # Sort each level by:
    # year -> semester -> module code
    for level_modules in by_level.values():
        level_modules.sort(
            key=lambda module: (
                module.curriculum_year,
                module.curriculum_semester,
                module.code,
            )
        )

    return schemas.ProgrammeCurriculumOut(
        code=programme.code,
        name=programme.name,
        faculty=programme.faculty,
        total_credits_required=(
            programme.total_credits_required
        ),
        modules_by_level=dict(by_level),
    )


@router.get("/{code}/requirements")
def get_programme_requirements(code: str, db: Session = Depends(get_db)):
    """Return explicit prospectus choice groups for a programme."""
    programme = db.query(models.Programme).filter(models.Programme.code == code).first()
    if programme is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown programme code '{code}'")

    groups = (
        db.query(models.ProgrammeRequirementGroup)
        .options(
            joinedload(models.ProgrammeRequirementGroup.options)
            .joinedload(models.ProgrammeRequirementOption.module)
        )
        .filter(models.ProgrammeRequirementGroup.programme_id == programme.id)
        .order_by(
            models.ProgrammeRequirementGroup.year,
            models.ProgrammeRequirementGroup.semester,
            models.ProgrammeRequirementGroup.key,
        )
        .all()
    )
    return [
        {
            "key": group.key,
            "label": group.label,
            "year": group.year,
            "semester": group.semester,
            "min_modules": group.min_modules,
            "min_credits": group.min_credits,
            "options": [
                {
                    "code": option.module.code,
                    "name": option.module.name,
                    "credits": option.module.credits,
                }
                for option in group.options
                if option.module is not None
            ],
        }
        for group in groups
    ]


# ============================================================
# PROGRAMME-MODULE MANAGEMENT
# ADMIN ONLY
# ============================================================

@router.get(
    "/{code}/modules",
    response_model=List[schemas.ProgrammeModuleOut],
)
def get_programme_modules(
    code: str,
    db: Session = Depends(get_db),
):
    """
    Get all modules linked to a programme.

    Includes:
    - compulsory/elective status
    - curriculum year
    - curriculum semester
    """

    programme = (
        db.query(models.Programme)
        .options(
            joinedload(
                models.Programme.programme_modules
            ).joinedload(
                models.ProgrammeModule.module
            )
        )
        .filter(models.Programme.code == code)
        .first()
    )

    if not programme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Programme not found",
        )

    results = []

    for link in programme.programme_modules:
        if link.module is None:
            continue

        results.append(
            schemas.ProgrammeModuleOut(
                programme_code=programme.code,
                programme_name=programme.name,
                module_code=link.module.code,
                module_name=link.module.name,
                is_compulsory=link.is_compulsory,
                year=link.year,
                semester=link.semester,
            )
        )

    # Sort by curriculum position first.
    results.sort(
        key=lambda item: (
            item.year,
            item.semester,
            item.module_code,
        )
    )

    return results


@router.post(
    "/{code}/modules",
    status_code=status.HTTP_201_CREATED,
)
def add_module_to_programme(
    code: str,
    payload: schemas.ProgrammeModuleAdd,
    current_admin: models.Admin = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    """
    Add a module to a programme's curriculum.

    The admin must also provide:
    - curriculum year
    - curriculum semester
    """

    programme = (
        db.query(models.Programme)
        .filter(models.Programme.code == code)
        .first()
    )

    if not programme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Programme not found",
        )

    module = (
        db.query(models.Module)
        .filter(
            models.Module.code
            == payload.module_code
        )
        .first()
    )

    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )

    existing = (
        db.query(models.ProgrammeModule)
        .filter(
            models.ProgrammeModule.programme_id
            == programme.id,
            models.ProgrammeModule.module_id
            == module.id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Module '{payload.module_code}' "
                f"is already linked to programme "
                f"'{code}'"
            ),
        )

    link = models.ProgrammeModule(
        programme_id=programme.id,
        module_id=module.id,
        is_compulsory=payload.is_compulsory,
        year=payload.year,
        semester=payload.semester,
    )

    db.add(link)
    db.commit()
    db.refresh(link)

    return {
        "message": (
            f"Module '{payload.module_code}' "
            f"added to programme '{code}'"
        ),
        "module_code": module.code,
        "is_compulsory": link.is_compulsory,
        "year": link.year,
        "semester": link.semester,
    }


@router.patch(
    "/{code}/modules/{module_code}",
)
def update_programme_module(
    code: str,
    module_code: str,
    payload: schemas.ProgrammeModuleUpdate,
    current_admin: models.Admin = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    """
    Update curriculum information for a module.

    The admin may independently change:
    - compulsory/elective status
    - curriculum year
    - curriculum semester
    """

    programme = (
        db.query(models.Programme)
        .filter(models.Programme.code == code)
        .first()
    )

    if not programme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Programme not found",
        )

    module = (
        db.query(models.Module)
        .filter(
            models.Module.code == module_code
        )
        .first()
    )

    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )

    link = (
        db.query(models.ProgrammeModule)
        .filter(
            models.ProgrammeModule.programme_id
            == programme.id,
            models.ProgrammeModule.module_id
            == module.id,
        )
        .first()
    )

    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Module '{module_code}' is not "
                f"linked to programme '{code}'"
            ),
        )

    # Only change values that were actually supplied.
    if payload.is_compulsory is not None:
        link.is_compulsory = (
            payload.is_compulsory
        )

    if payload.year is not None:
        link.year = payload.year

    if payload.semester is not None:
        link.semester = payload.semester

    db.commit()
    db.refresh(link)

    return {
        "message": (
            f"Module '{module_code}' "
            f"curriculum details updated"
        ),
        "module_code": module_code,
        "is_compulsory": link.is_compulsory,
        "year": link.year,
        "semester": link.semester,
    }


@router.delete(
    "/{code}/modules/{module_code}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_module_from_programme(
    code: str,
    module_code: str,
    current_admin: models.Admin = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    """
    Remove a module from a programme's curriculum.
    """

    programme = (
        db.query(models.Programme)
        .filter(models.Programme.code == code)
        .first()
    )

    if not programme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Programme not found",
        )

    module = (
        db.query(models.Module)
        .filter(
            models.Module.code == module_code
        )
        .first()
    )

    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )

    link = (
        db.query(models.ProgrammeModule)
        .filter(
            models.ProgrammeModule.programme_id
            == programme.id,
            models.ProgrammeModule.module_id
            == module.id,
        )
        .first()
    )

    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Module '{module_code}' is not "
                f"linked to programme '{code}'"
            ),
        )

    db.delete(link)
    db.commit()

    return None