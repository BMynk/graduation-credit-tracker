# app/models.py
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base

module_prerequisites = Table(
    "module_prerequisites",
    Base.metadata,
    Column("module_id", Integer, ForeignKey("modules.id"), primary_key=True),
    Column("prerequisite_id", Integer, ForeignKey("modules.id"), primary_key=True),
)


class Admin(Base):
    __tablename__ = "admins"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_super_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by_id = Column(Integer, ForeignKey("admins.id"), nullable=True)

    created_by = relationship("Admin", remote_side=[id], backref="created_admins")


class Programme(Base):
    __tablename__ = "programmes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, unique=True, nullable=False)
    faculty = Column(String, nullable=True)
    total_credits_required = Column(Integer, default=384, nullable=False)

    students = relationship("Student", back_populates="programme")
    programme_modules = relationship(
        "ProgrammeModule", back_populates="programme", cascade="all, delete-orphan"
    )


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    credits = Column(Integer, nullable=False)
    category = Column(String, default="core", nullable=False)
    level = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)

    prerequisites = relationship(
        "Module",
        secondary=module_prerequisites,
        primaryjoin=id == module_prerequisites.c.module_id,
        secondaryjoin=id == module_prerequisites.c.prerequisite_id,
        backref="unlocks",
    )
    programme_links = relationship(
        "ProgrammeModule", back_populates="module", cascade="all, delete-orphan"
    )


class ProgrammeModule(Base):
    __tablename__ = "programme_modules"

    id = Column(Integer, primary_key=True, index=True)
    programme_id = Column(Integer, ForeignKey("programmes.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    is_compulsory = Column(Boolean, default=False, nullable=False)

    programme = relationship("Programme", back_populates="programme_modules")
    module = relationship("Module", back_populates="programme_links")

    __table_args__ = (
        UniqueConstraint("programme_id", "module_id", name="uq_programme_module"),
    )


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    student_number = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    pin_hash = Column(String, nullable=True)
    programme_id = Column(Integer, ForeignKey("programmes.id"), nullable=False)
    current_year = Column(Integer, default=1, nullable=False)
    target_average = Column(Float, default=60.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    programme = relationship("Programme", back_populates="students")
    enrolments = relationship(
        "Enrolment", back_populates="student", cascade="all, delete-orphan"
    )


class Enrolment(Base):
    __tablename__ = "enrolments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    semester = Column(String, nullable=False)
    grade = Column(Float, nullable=True)
    status = Column(String, default="planned", nullable=False)
    attempt = Column(Integer, default=1, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    student = relationship("Student", back_populates="enrolments")
    module = relationship("Module")

    __table_args__ = (
        UniqueConstraint("student_id", "module_id", "attempt", name="uq_student_module_attempt"),
    )

class StudentAchievement(Base):
    __tablename__ = "student_achievements"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    achievement_id = Column(String, nullable=False)  # e.g., "first_steps"
    unlocked_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    notified = Column(Boolean, default=False, nullable=False)

    student = relationship("Student", backref="achievements")

    __table_args__ = (
        UniqueConstraint("student_id", "achievement_id", name="uq_student_achievement"),
    )