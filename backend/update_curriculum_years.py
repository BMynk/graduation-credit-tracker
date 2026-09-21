import re

from app.database import SessionLocal
from app import models


def main():
    db = SessionLocal()

    try:
        links = db.query(models.ProgrammeModule).all()

        updated = 0
        skipped = []

        for link in links:
            code = link.module.code.upper().strip()

            match = re.search(r"(\d{3})", code)

            if not match:
                skipped.append(code)
                continue

            digits = match.group(1)

            year = int(digits[0])
            semester = int(digits[1])

            if year not in range(1, 7):
                skipped.append(code)
                continue

            if semester not in (1, 2):
                skipped.append(code)
                continue

            link.year = year
            link.semester = semester

            updated += 1

        db.commit()

        print()
        print("====================================")
        print("CURRICULUM UPDATE COMPLETE")
        print("====================================")
        print("Updated curriculum links:", updated)
        print("Skipped modules:", sorted(set(skipped)))
        print("====================================")
        print()

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()