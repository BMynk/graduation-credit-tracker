from app.database import SessionLocal
from app import models
from app.security import hash_password


def create_production_admin():
    db = SessionLocal()

    try:
        existing_admin = (
            db.query(models.Admin)
            .filter(models.Admin.username == "admin")
            .first()
        )

        if existing_admin:
            print("Admin account already exists.")
            return

        admin = models.Admin(
            name="System Administrator",
            username="admin",
            hashed_password=hash_password("AdminPass123!"),
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