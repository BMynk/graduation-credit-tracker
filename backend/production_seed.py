# backend/production_seed.py

import re

from app import models
from app.database import Base, SessionLocal, engine

from seed import (
    PROGRAMMES,
    MODULES,
    PREREQUISITES,
    PROGRAMME_MODULES,
    ALIAS_CODES,
)


def curriculum_position(module_code: str):
    """
    Derive curriculum year and semester using the same logic
    already used by update_curriculum_years.py.
    """
    match = re.search(r"(\d{3})", module_code.upper().strip())

    if not match:
        return None, None

    digits = match.group(1)

    year = int(digits[0])
    semester = int(digits[1])

    if year not in range(1, 7):
        return None, None

    if semester not in (1, 2):
        return None, None

    return year, semester


def seed_production():
    # Safe: creates missing tables only.
    # It does NOT delete existing tables or records.
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        print("========================================")
        print("GCT PRODUCTION DATABASE INITIALIZATION")
        print("========================================")

        # -----------------------------------------------------
        # Programmes
        # -----------------------------------------------------

        print("\n1. Initializing programmes...")

        programme_by_code = {}

        for data in PROGRAMMES:
            programme = (
                db.query(models.Programme)
                .filter(models.Programme.code == data["code"])
                .first()
            )

            if programme is None:
                programme = models.Programme(**data)
                db.add(programme)
                db.flush()

                print(f"   Created programme {data['code']}")
            else:
                # Keep reference information synchronized.
                programme.name = data["name"]
                programme.faculty = data["faculty"]

            programme.total_credits_required = 384
            programme_by_code[data["code"]] = programme

        db.flush()

        # -----------------------------------------------------
        # Modules
        # -----------------------------------------------------

        print("\n2. Initializing modules...")

        module_by_code = {}

        for code, name, credits, category, level in MODULES:
            module = (
                db.query(models.Module)
                .filter(models.Module.code == code)
                .first()
            )

            if module is None:
                module = models.Module(
                    code=code,
                    name=name,
                    credits=credits,
                    category=category,
                    level=level,
                    description=None,
                )

                db.add(module)
                db.flush()

                print(f"   Created module {code}")
            else:
                module.name = name
                module.credits = credits
                module.category = category
                module.level = level

            module_by_code[code] = module

        db.flush()

        # -----------------------------------------------------
        # Prerequisites
        # -----------------------------------------------------

        print("\n3. Initializing prerequisites...")

        for code, prerequisite_codes in PREREQUISITES.items():
            module = module_by_code.get(code)

            if module is None:
                print(f"   WARNING: module {code} not found")
                continue

            resolved = []

            for prerequisite_code in prerequisite_codes:
                actual_code = ALIAS_CODES.get(
                    prerequisite_code,
                    prerequisite_code,
                )

                prerequisite = module_by_code.get(actual_code)

                if prerequisite is None:
                    print(
                        "   WARNING: prerequisite "
                        f"{prerequisite_code} for {code} not found"
                    )
                    continue

                resolved.append(prerequisite)

            # Synchronize the prerequisite relationship.
            module.prerequisites = resolved

        db.flush()

        # -----------------------------------------------------
        # Programme curriculum
        # -----------------------------------------------------

        print("\n4. Initializing programme curricula...")

        created_links = 0
        updated_links = 0

        for programme_code, groups in PROGRAMME_MODULES.items():
            programme = programme_by_code.get(programme_code)

            if programme is None:
                print(
                    f"   WARNING: programme {programme_code} not found"
                )
                continue

            for group_name, is_compulsory in (
                ("compulsory", True),
                ("elective", False),
            ):
                for original_code in groups.get(group_name, []):
                    actual_code = ALIAS_CODES.get(
                        original_code,
                        original_code,
                    )

                    module = module_by_code.get(actual_code)

                    if module is None:
                        print(
                            "   WARNING: module "
                            f"{original_code} -> {actual_code} "
                            f"not found for {programme_code}"
                        )
                        continue

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

                    year, semester = curriculum_position(
                        module.code
                    )

                    if link is None:
                        link = models.ProgrammeModule(
                            programme_id=programme.id,
                            module_id=module.id,
                            is_compulsory=is_compulsory,
                            year=year,
                            semester=semester,
                        )

                        db.add(link)
                        created_links += 1

                    else:
                        link.is_compulsory = is_compulsory
                        link.year = year
                        link.semester = semester
                        updated_links += 1

        db.flush()

        # -----------------------------------------------------
        # Commit
        # -----------------------------------------------------

        db.commit()

        print("\n========================================")
        print("PRODUCTION CURRICULUM INITIALIZED")
        print("========================================")
        print(f"Programmes: {len(programme_by_code)}")
        print(f"Modules: {len(module_by_code)}")
        print(f"Curriculum links created: {created_links}")
        print(f"Curriculum links updated: {updated_links}")
        print("Demo students created: 0")
        print("Admins created: 0")
        print("Tables deleted: 0")
        print("========================================")

    except Exception:
        db.rollback()
        print("\nProduction initialization FAILED.")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_production()