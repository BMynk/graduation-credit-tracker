from sqlalchemy import create_engine, inspect, text
from sqlalchemy.pool import StaticPool

from app.migrations import ensure_admin_token_version_column


def _legacy_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE admins (
                    id INTEGER PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    username VARCHAR NOT NULL UNIQUE,
                    hashed_password VARCHAR NOT NULL,
                    is_active BOOLEAN NOT NULL DEFAULT 1,
                    is_super_admin BOOLEAN NOT NULL DEFAULT 0
                )
                """
            )
        )
        connection.execute(
            text(
                """
                INSERT INTO admins
                    (id, name, username, hashed_password, is_active, is_super_admin)
                VALUES
                    (1, 'Legacy Admin', 'legacy', 'hash', 1, 1)
                """
            )
        )
    return engine


def test_legacy_admin_table_gets_token_version_without_losing_data():
    engine = _legacy_engine()

    changed = ensure_admin_token_version_column(engine)

    assert changed is True
    columns = {
        column["name"]
        for column in inspect(engine).get_columns("admins")
    }
    assert "token_version" in columns

    with engine.connect() as connection:
        row = connection.execute(
            text(
                "SELECT username, token_version "
                "FROM admins WHERE id = 1"
            )
        ).mappings().one()

    assert row["username"] == "legacy"
    assert row["token_version"] == 0


def test_admin_token_version_migration_is_idempotent():
    engine = _legacy_engine()

    assert ensure_admin_token_version_column(engine) is True
    assert ensure_admin_token_version_column(engine) is False

    columns = [
        column["name"]
        for column in inspect(engine).get_columns("admins")
    ]
    assert columns.count("token_version") == 1
