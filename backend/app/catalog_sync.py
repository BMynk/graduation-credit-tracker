"""Non-destructive synchronization of the 2026 Science & Agriculture catalogue.

Production databases can pre-date newer seed data. This sync adds missing catalogue
rows without dropping tables or touching students, admins, enrolments, or existing
curriculum records.
"""
from sqlalchemy.orm import Session

from app import models
from app.database import SessionLocal
from seed import (
    ACTIVE_PROGRAMME_CODES,
    ALIAS_CODES,
    MODULES,
    PROGRAMMES,
    PROGRAMME_MODULES,
    REQUIREMENT_GROUPS,
    curriculum_position,
)


def _remove_retired_programmes(db: Session) -> None:
    retired = (
        db.query(models.Programme)
        .filter(~models.Programme.code.in_(ACTIVE_PROGRAMME_CODES))
        .all()
    )
    for programme in retired:
        student_count = (
            db.query(models.Student)
            .filter(models.Student.programme_id == programme.id)
            .count()
        )
        if student_count:
            raise RuntimeError(
                f"Cannot remove retired programme {programme.code}: "
                f"{student_count} student account(s) are still assigned to it."
            )

        groups = (
            db.query(models.ProgrammeRequirementGroup)
            .filter(models.ProgrammeRequirementGroup.programme_id == programme.id)
            .all()
        )
        for group in groups:
            db.delete(group)

        links = (
            db.query(models.ProgrammeModule)
            .filter(models.ProgrammeModule.programme_id == programme.id)
            .all()
        )
        for link in links:
            db.delete(link)

        db.flush()
        db.delete(programme)

    db.flush()


def sync_2026_catalog(db: Session) -> None:
    _remove_retired_programmes(db)
    programmes = {p.code: p for p in db.query(models.Programme).all()}
    for spec in PROGRAMMES:
        if spec["code"] not in programmes:
            row = models.Programme(
                code=spec["code"],
                name=spec["name"],
                faculty=spec["faculty"],
                total_credits_required=384,
            )
            db.add(row)
            db.flush()
            programmes[row.code] = row

    modules = {m.code: m for m in db.query(models.Module).all()}
    for code, name, credits, category, level in MODULES:
        if code not in modules:
            row = models.Module(
                code=code,
                name=name,
                credits=credits,
                category=category,
                level=level,
                description=None,
            )
            db.add(row)
            db.flush()
            modules[code] = row

    existing_links = {
        (row.programme_id, row.module_id)
        for row in db.query(models.ProgrammeModule).all()
    }
    for programme_code, groups in PROGRAMME_MODULES.items():
        programme = programmes.get(programme_code)
        if programme is None:
            continue
        choice_codes = {
            ALIAS_CODES.get(code, code)
            for spec in REQUIREMENT_GROUPS.get(programme_code, [])
            for code in spec["options"]
        }
        for bucket, compulsory_default in (("compulsory", True), ("elective", False)):
            for code in groups.get(bucket, []):
                actual = ALIAS_CODES.get(code, code)
                module = modules.get(actual)
                if module is None:
                    continue
                pair = (programme.id, module.id)
                if pair in existing_links:
                    continue
                year, semester = curriculum_position(module)
                db.add(models.ProgrammeModule(
                    programme_id=programme.id,
                    module_id=module.id,
                    is_compulsory=(
                        compulsory_default and actual not in choice_codes
                    ),
                    year=year,
                    semester=semester,
                ))
                existing_links.add(pair)

    existing_groups = {
        (row.programme_id, row.key)
        for row in db.query(models.ProgrammeRequirementGroup).all()
    }
    for programme_code, specs in REQUIREMENT_GROUPS.items():
        programme = programmes.get(programme_code)
        if programme is None:
            continue
        for spec in specs:
            group_key = (programme.id, spec["key"])
            if group_key in existing_groups:
                continue
            group = models.ProgrammeRequirementGroup(
                programme_id=programme.id,
                key=spec["key"],
                label=spec["label"],
                year=spec["year"],
                semester=spec["semester"],
                min_modules=spec["min_modules"],
                min_credits=spec["min_credits"],
            )
            db.add(group)
            db.flush()
            for code in spec["options"]:
                module = modules.get(ALIAS_CODES.get(code, code))
                if module is not None:
                    db.add(models.ProgrammeRequirementOption(
                        group_id=group.id,
                        module_id=module.id,
                    ))
            for path_spec in spec.get("paths", []):
                path = models.ProgrammeRequirementPath(
                    group_id=group.id,
                    key=path_spec["key"],
                    label=path_spec["label"],
                )
                db.add(path)
                db.flush()
                for code in path_spec["modules"]:
                    module = modules.get(ALIAS_CODES.get(code, code))
                    if module is not None:
                        db.add(models.ProgrammeRequirementPathOption(
                            path_id=path.id,
                            module_id=module.id,
                        ))
            existing_groups.add(group_key)

    db.commit()


def sync_2026_catalog_on_startup() -> None:
    db = SessionLocal()
    try:
        sync_2026_catalog(db)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
