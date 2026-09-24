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


# ============================================================
# MODULE PREREQUISITES ASSOCIATION TABLE
# ============================================================

module_prerequisites = Table(
    "module_prerequisites",
    Base.metadata,
    Column(
        "module_id",
        Integer,
        ForeignKey("modules.id"),
        primary_key=True,
    ),
    Column(
        "prerequisite_id",
        Integer,
        ForeignKey("modules.id"),
        primary_key=True,
    ),
)


# ============================================================
# ADMIN
# ============================================================

class Admin(Base):
    __tablename__ = "admins"
    __table_args__ = {"extend_existing": True}

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    username = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    email = Column(
        String,
        unique=True,
        nullable=True,
    )

    hashed_password = Column(
        String,
        nullable=False,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    is_super_admin = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    created_by_id = Column(
        Integer,
        ForeignKey("admins.id"),
        nullable=True,
    )

    created_by = relationship(
        "Admin",
        remote_side=[id],
        backref="created_admins",
    )


# ============================================================
# PROGRAMME
# ============================================================

class Programme(Base):
    __tablename__ = "programmes"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    code = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    name = Column(
        String,
        unique=True,
        nullable=False,
    )

    faculty = Column(
        String,
        nullable=True,
    )

    total_credits_required = Column(
        Integer,
        default=384,
        nullable=False,
    )

    students = relationship(
        "Student",
        back_populates="programme",
    )

    programme_modules = relationship(
        "ProgrammeModule",
        back_populates="programme",
        cascade="all, delete-orphan",
    )


# ============================================================
# MODULE
# ============================================================

class Module(Base):
    __tablename__ = "modules"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    code = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    name = Column(
        String,
        nullable=False,
    )

    credits = Column(
        Integer,
        nullable=False,
    )

    category = Column(
        String,
        default="core",
        nullable=False,
    )

    level = Column(
        Integer,
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    prerequisites = relationship(
        "Module",
        secondary=module_prerequisites,
        primaryjoin=id == module_prerequisites.c.module_id,
        secondaryjoin=id == module_prerequisites.c.prerequisite_id,
        backref="unlocks",
    )

    programme_links = relationship(
        "ProgrammeModule",
        back_populates="module",
        cascade="all, delete-orphan",
    )


# ============================================================
# PROGRAMME MODULE
# ============================================================

class ProgrammeModule(Base):
    __tablename__ = "programme_modules"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    programme_id = Column(
        Integer,
        ForeignKey("programmes.id"),
        nullable=False,
    )

    module_id = Column(
        Integer,
        ForeignKey("modules.id"),
        nullable=False,
    )

    is_compulsory = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    # The academic year in which this module belongs
    # within this specific programme.
    year = Column(
        Integer,
        default=1,
        nullable=False,
    )

    # 1 = Semester 1
    # 2 = Semester 2
    semester = Column(
        Integer,
        default=1,
        nullable=False,
    )

    programme = relationship(
        "Programme",
        back_populates="programme_modules",
    )

    module = relationship(
        "Module",
        back_populates="programme_links",
    )

    __table_args__ = (
        UniqueConstraint(
            "programme_id",
            "module_id",
            name="uq_programme_module",
        ),
    )

# ============================================================
# STUDENT
# ============================================================

class Student(Base):
    __tablename__ = "students"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    student_number = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
    )

    # --------------------------------------------------------
    # Student login PIN
    #
    # The plaintext PIN is never stored in the database.
    # Only the hashed PIN is stored.
    #
    # The student keeps the same PIN until a new PIN is
    # requested. When a new PIN is generated, this hash is
    # replaced and the old PIN immediately stops working.
    # --------------------------------------------------------

    pin_hash = Column(
        String,
        nullable=True,
    )

    # --------------------------------------------------------
    # Academic information
    # --------------------------------------------------------

    programme_id = Column(
        Integer,
        ForeignKey("programmes.id"),
        nullable=False,
    )

    current_year = Column(
        Integer,
        default=1,
        nullable=False,
    )

    target_average = Column(
        Float,
        default=60.0,
        nullable=False,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # --------------------------------------------------------
    # Relationships
    # --------------------------------------------------------

    programme = relationship(
        "Programme",
        back_populates="students",
    )

    enrolments = relationship(
        "Enrolment",
        back_populates="student",
        cascade="all, delete-orphan",
    )


# ============================================================
# ENROLMENT
# ============================================================

class Enrolment(Base):
    __tablename__ = "enrolments"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False,
    )

    module_id = Column(
        Integer,
        ForeignKey("modules.id"),
        nullable=False,
    )

    semester = Column(
        String,
        nullable=False,
    )

    grade = Column(
        Float,
        nullable=True,
    )

    status = Column(
        String,
        default="planned",
        nullable=False,
    )

    attempt = Column(
        Integer,
        default=1,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    student = relationship(
        "Student",
        back_populates="enrolments",
    )

    module = relationship(
        "Module",
    )

    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "module_id",
            "attempt",
            name="uq_student_module_attempt",
        ),
    )


# ============================================================
# STUDENT ACHIEVEMENT
# ============================================================

class StudentAchievement(Base):
    __tablename__ = "student_achievements"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False,
    )

    achievement_id = Column(
        String,
        nullable=False,
    )

    unlocked_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    notified = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    student = relationship(
        "Student",
        backref="achievements",
    )

    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "achievement_id",
            name="uq_student_achievement",
        ),
    )

# ============================================================
# SUPPORT SERVICE
# ============================================================

class SupportService(Base):
    __tablename__ = "support_services"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
        index=True,
    )

    short_name = Column(
        String,
        nullable=True,
        index=True,
    )

    category = Column(
        String,
        nullable=False,
        default="student_support",
    )

    description = Column(
        Text,
        nullable=False,
    )

    location = Column(
        String,
        nullable=True,
    )

    campus = Column(
        String,
        nullable=True,
    )

    email = Column(
        String,
        nullable=True,
    )

    phone = Column(
        String,
        nullable=True,
    )

    website = Column(
        String,
        nullable=True,
    )

    opening_hours = Column(
        String,
        nullable=True,
    )

    how_to_access = Column(
        Text,
        nullable=True,
    )

    is_emergency = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    verified_at = Column(
        DateTime,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

# ============================================================
# FACILITATOR
# ============================================================

class Facilitator(Base):
    __tablename__ = "facilitators"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
        index=True,
    )

    # SI or ELEP
    programme_type = Column(
        String,
        nullable=False,
        index=True,
    )

    # Preserve module assignment exactly as supplied
    # in the official profile document.
    module_assignment = Column(
        String,
        nullable=False,
        index=True,
    )

    campus = Column(
        String,
        nullable=False,
        default="Alice",
        index=True,
    )

    session_time = Column(
        String,
        nullable=True,
    )

    consultation_time = Column(
        String,
        nullable=True,
    )

    is_assistant = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    verified_at = Column(
        DateTime,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

# ============================================================
# COMMUNITY
# ============================================================

class Community(Base):
    __tablename__ = "communities"

    id = Column(Integer, primary_key=True, index=True)
    programme_id = Column(Integer, ForeignKey("programmes.id"), nullable=False, index=True)
    year_level = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    programme = relationship("Programme")
    channels = relationship(
        "CommunityChannel", back_populates="community",
        cascade="all, delete-orphan", order_by="CommunityChannel.id",
    )

    __table_args__ = (
        UniqueConstraint("programme_id", "year_level", name="uq_community_programme_year"),
    )


class CommunityChannel(Base):
    __tablename__ = "community_channels"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False, index=True)
    slug = Column(String(50), nullable=False)
    name = Column(String(80), nullable=False)
    description = Column(String(240), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    community = relationship("Community", back_populates="channels")
    messages = relationship(
        "CommunityMessage", back_populates="channel", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("community_id", "slug", name="uq_community_channel_slug"),
    )


class CommunityMessage(Base):
    __tablename__ = "community_messages"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("community_channels.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    parent_message_id = Column(Integer, ForeignKey("community_messages.id"), nullable=True, index=True)
    content = Column(Text, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    edited_at = Column(DateTime, nullable=True)

    channel = relationship("CommunityChannel", back_populates="messages")
    student = relationship("Student")
    parent = relationship("CommunityMessage", remote_side=[id], backref="replies")
    reactions = relationship(
        "CommunityReaction", back_populates="message", cascade="all, delete-orphan"
    )


class CommunityReaction(Base):
    __tablename__ = "community_reactions"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("community_messages.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    emoji = Column(String(16), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    message = relationship("CommunityMessage", back_populates="reactions")
    student = relationship("Student")

    __table_args__ = (
        UniqueConstraint(
            "message_id", "student_id", "emoji",
            name="uq_community_reaction_student_emoji",
        ),
    )


# ============================================================
# PRIVATE STUDENT MESSAGING
# ============================================================

class PrivateChatRequest(Base):
    __tablename__ = "private_chat_requests"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    status = Column(String(20), default="pending", nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    responded_at = Column(DateTime, nullable=True)

    sender = relationship("Student", foreign_keys=[sender_id])
    receiver = relationship("Student", foreign_keys=[receiver_id])

    __table_args__ = (
        UniqueConstraint("sender_id", "receiver_id", name="uq_private_chat_request_pair"),
    )


class PrivateConversation(Base):
    __tablename__ = "private_conversations"

    id = Column(Integer, primary_key=True, index=True)
    student_one_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    student_two_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    student_one = relationship("Student", foreign_keys=[student_one_id])
    student_two = relationship("Student", foreign_keys=[student_two_id])
    messages = relationship(
        "PrivateMessage", back_populates="conversation", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("student_one_id", "student_two_id", name="uq_private_conversation_pair"),
    )


class PrivateMessage(Base):
    __tablename__ = "private_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("private_conversations.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)

    conversation = relationship("PrivateConversation", back_populates="messages")
    sender = relationship("Student")


# ============================================================
# COMMUNITY PAST PAPER LIBRARY
# ============================================================

class PastPaper(Base):
    __tablename__ = "past_papers"

    id = Column(Integer, primary_key=True, index=True)
    uploader_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    programme_id = Column(Integer, ForeignKey("programmes.id"), nullable=False, index=True)
    module_code = Column(String(30), nullable=False, index=True)
    module_name = Column(String(180), nullable=True)
    paper_year = Column(Integer, nullable=False, index=True)
    semester = Column(Integer, nullable=True, index=True)
    level = Column(Integer, nullable=False, index=True)
    description = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(1000), nullable=False)
    storage_key = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    uploader = relationship("Student")
    programme = relationship("Programme")
