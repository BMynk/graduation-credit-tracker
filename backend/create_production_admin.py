import os

from app.database import SessionLocal, engine
from app.migrations import run_schema_migrations
from app import models
from app.security import hash_password


def create_production_admin():
    # Render runs this script before Uvicorn. Apply compatibility migrations
    # first so ORM queries work against databases created by older releases.
    run_schema_migrations(engine)

    username = os.getenv("PRODUCTION_ADMIN_USERNAME")
    password = os.getenv("PRODUCTION_ADMIN_PASSWORD")

    if not username or not password:
        raise RuntimeError(
            "PRODUCTION_ADMIN_USERNAME and "
            "PRODUCTION_ADMIN_PASSWORD must be configured."
        )

    db = SessionLocal()

    try:
        existing_admin = (
            db.query(models.Admin)
            .filter(models.Admin.username == username)
            .first()
        )

        if existing_admin:
            print("Production admin account already exists.")
            return

        admin = models.Admin(
            name="System Administrator",
            username=username,
            hashed_password=hash_password(password),
            is_active=True,
            is_super_admin=True,
            created_by_id=None,
        )

        db.add(admin)
        db.commit()

        print("Production admin created successfully.")

    except Exception as exc:
        db.rollback()
        print(f"Failed to create admin: {exc}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    create_production_admin()