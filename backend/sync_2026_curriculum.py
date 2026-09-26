"""Non-destructively synchronize the 2026 UFH BSc curriculum.

Unlike seed.py this script NEVER drops tables and never deletes students,
enrolments, marks, rewards, community data, or authentication records.

Usage from backend:
    python sync_2026_curriculum.py
"""

from app import models
from app.database import Base, SessionLocal, engine
from seed import PROGRAMMES, MODULES, PROGRAMME_MODULES, REQUIREMENT_GROUPS, ALIAS_CODES, curriculum_position


def sync():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        programmes = {}
        for spec in PROGRAMMES:
            programme = db.query(models.Programme).filter(models.Programme.code == spec["code"]).first()
            if programme is None:
                programme = models.Programme(code=spec["code"], name=spec["name"], faculty=spec["faculty"], total_credits_required=384)
                db.add(programme)
                db.flush()
            else:
                programme.name = spec["name"]
                programme.faculty = spec["faculty"]
                programme.total_credits_required = 384
            programmes[spec["code"]] = programme

        modules = {}
        for code, name, credits, category, level in MODULES:
            module = db.query(models.Module).filter(models.Module.code == code).first()
            if module is None:
                module = models.Module(code=code, name=name, credits=credits, category=category, level=level)
                db.add(module)
                db.flush()
            module.credits = credits
            module.level = level
            modules[code] = module

        for programme_code, groups in PROGRAMME_MODULES.items():
            programme = programmes.get(programme_code)
            if programme is None:
                continue

            # Remove stale programme-module links only when they are no longer
            # part of the verified 2026 curriculum. This changes curriculum
            # metadata, not the student's enrolment/mark history.
            desired_codes = {
                ALIAS_CODES.get(raw_code, raw_code)
                for key in ("compulsory", "elective")
                for raw_code in groups.get(key, [])
            }
            current_links = (
                db.query(models.ProgrammeModule)
                .join(models.Module)
                .filter(models.ProgrammeModule.programme_id == programme.id)
                .all()
            )
            for link in current_links:
                if link.module.code not in desired_codes:
                    db.delete(link)
            db.flush()

            choice_codes = {
                ALIAS_CODES.get(code, code)
                for spec in REQUIREMENT_GROUPS.get(programme_code, [])
                for code in spec["options"]
            }
            desired = {}
            for compulsory, key in ((True, "compulsory"), (False, "elective")):
                for raw_code in groups.get(key, []):
                    code = ALIAS_CODES.get(raw_code, raw_code)
                    module = modules.get(code)
                    if module is None:
                        continue
                    year, semester = curriculum_position(module)
                    desired[module.id] = (compulsory and code not in choice_codes, year, semester)
            for module_id, (compulsory, year, semester) in desired.items():
                link = db.query(models.ProgrammeModule).filter(
                    models.ProgrammeModule.programme_id == programme.id,
                    models.ProgrammeModule.module_id == module_id,
                ).first()
                if link is None:
                    link = models.ProgrammeModule(programme_id=programme.id, module_id=module_id)
                    db.add(link)
                link.is_compulsory = compulsory
                link.year = year
                link.semester = semester

        for programme_code, specs in REQUIREMENT_GROUPS.items():
            programme = programmes.get(programme_code)
            if programme is None:
                continue
            existing = db.query(models.ProgrammeRequirementGroup).filter(
                models.ProgrammeRequirementGroup.programme_id == programme.id
            ).all()
            for group in existing:
                db.delete(group)
            db.flush()
            for spec in specs:
                group = models.ProgrammeRequirementGroup(
                    programme_id=programme.id, key=spec["key"], label=spec["label"],
                    year=spec["year"], semester=spec["semester"],
                    min_modules=spec["min_modules"], min_credits=spec["min_credits"],
                )
                db.add(group)
                db.flush()
                for raw_code in spec["options"]:
                    module = modules.get(ALIAS_CODES.get(raw_code, raw_code))
                    if module is not None:
                        db.add(models.ProgrammeRequirementOption(group_id=group.id, module_id=module.id))

        db.commit()
        print(f"2026 curriculum sync complete: {len(programmes)} programmes, {len(modules)} modules.")
        print("No student, enrolment, mark, EXP, reward, message or past-paper records were deleted.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    sync()
