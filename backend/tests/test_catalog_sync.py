import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./catalog_sync_test.db")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.database import Base
from app.catalog_sync import sync_2026_catalog
from seed import PROGRAMMES


def test_catalog_sync_adds_all_programmes_without_removing_existing_data():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    db = sessionmaker(bind=engine, autocommit=False, autoflush=False)()
    try:
        legacy = models.Programme(
            code="LEGACY",
            name="Existing Programme",
            faculty="Existing Faculty",
            total_credits_required=120,
        )
        db.add(legacy)
        db.commit()

        sync_2026_catalog(db)

        science_codes = {
            row.code
            for row in db.query(models.Programme).filter(
                models.Programme.code.in_([item["code"] for item in PROGRAMMES])
            ).all()
        }
        assert science_codes == {item["code"] for item in PROGRAMMES}
        assert len(science_codes) == 30

        # The sync is additive: unrelated production data is preserved.
        assert db.query(models.Programme).filter(
            models.Programme.code == "LEGACY"
        ).one().name == "Existing Programme"

        # Running startup sync again must be idempotent.
        sync_2026_catalog(db)
        assert db.query(models.Programme).filter(
            models.Programme.code.in_([item["code"] for item in PROGRAMMES])
        ).count() == 30
    finally:
        db.close()
