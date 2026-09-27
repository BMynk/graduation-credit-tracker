"""Small idempotent schema migrations for deployments without Alembic.

SQLAlchemy's create_all() creates missing tables but does not add columns to
existing tables. Keep targeted compatibility migrations here until the project
adopts a full migration framework.
"""

import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


logger = logging.getLogger(__name__)


def ensure_admin_token_version_column(engine: Engine) -> bool:
    """Ensure legacy admins tables have the token_version column.

    Returns True when this call added the column and False when no change was
    needed. The SQL form is supported by both SQLite and PostgreSQL, the two
    database backends configured by this project.
    """
    inspector = inspect(engine)
    if "admins" not in inspector.get_table_names():
        return False

    columns = {column["name"] for column in inspector.get_columns("admins")}
    if "token_version" in columns:
        return False

    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE admins "
                "ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0"
            )
        )

    logger.info("Added admins.token_version compatibility column")
    return True


def ensure_student_token_version_column(engine: Engine) -> bool:
    """Ensure legacy students tables have the token_version column."""
    inspector = inspect(engine)
    if "students" not in inspector.get_table_names():
        return False

    columns = {column["name"] for column in inspector.get_columns("students")}
    if "token_version" in columns:
        return False

    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE students "
                "ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0"
            )
        )

    logger.info("Added students.token_version compatibility column")
    return True


def run_schema_migrations(engine: Engine) -> None:
    ensure_admin_token_version_column(engine)
    ensure_student_token_version_column(engine)
