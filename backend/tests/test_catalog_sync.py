import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./catalog_sync_test.db")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.database import Base
from app.catalog_sync import sync_2026_catalog
from seed import PROGRAMMES


def test_catalog_sync_keeps_original_10_and_preserves_unrelated_data():
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
        retired = models.Programme(
            code="40043",
            name="Retired Chemistry and Physics",
            faculty="Science & Agriculture",
            total_credits_required=384,
        )
        db.add_all([legacy, retired])
        db.commit()

        sync_2026_catalog(db)

        science_codes = {
            row.code
            for row in db.query(models.Programme).filter(
                models.Programme.code.in_([item["code"] for item in PROGRAMMES])
            ).all()
        }
        assert science_codes == {item["code"] for item in PROGRAMMES}
        assert len(science_codes) == 10

        assert db.query(models.Programme).filter(
            models.Programme.code == "40043"
        ).first() is None

        # Unrelated programme data is preserved.
        assert db.query(models.Programme).filter(
            models.Programme.code == "LEGACY"
        ).one().name == "Existing Programme"

        # Running startup sync again must be idempotent.
        sync_2026_catalog(db)
        assert db.query(models.Programme).filter(
            models.Programme.code.in_([item["code"] for item in PROGRAMMES])
        ).count() == 10
    finally:
        db.close()
