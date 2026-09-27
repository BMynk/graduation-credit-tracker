import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app import models

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)

def override_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(autouse=True)
def isolated_db_override():
    """Keep this module's in-memory DB override from leaking into other test modules."""
    app.dependency_overrides[get_db] = override_db
    try:
        yield
    finally:
        app.dependency_overrides.pop(get_db, None)

def test_private_chat_tables_are_created():
    Base.metadata.create_all(bind=engine)
    names = set(Base.metadata.tables)
    assert "private_chat_requests" in names
    assert "private_conversations" in names
    assert "private_messages" in names

def test_private_chat_models_persist():
    Base.metadata.create_all(bind=engine)
    db = TestingSession()
    try:
        programme = models.Programme(code="TEST", name="Test Programme", total_credits_required=360)
        db.add(programme)
        db.flush()
        one = models.Student(student_number="T001", name="Student One", email="one@example.test", programme_id=programme.id, current_year=1)
        two = models.Student(student_number="T002", name="Student Two", email="two@example.test", programme_id=programme.id, current_year=1)
        db.add_all([one, two])
        db.flush()
        request = models.PrivateChatRequest(sender_id=one.id, receiver_id=two.id)
        db.add(request)
        db.commit()
        assert request.status == "pending"

        request.status = "accepted"
        conversation = models.PrivateConversation(student_one_id=min(one.id, two.id), student_two_id=max(one.id, two.id))
        db.add(conversation)
        db.flush()
        message = models.PrivateMessage(conversation_id=conversation.id, sender_id=one.id, content="Hello")
        db.add(message)
        db.commit()
        assert message.content == "Hello"
        assert conversation.is_active is True
    finally:
        db.close()


def _private_fixture(db, prefix="P"):
    programme = models.Programme(
        code=f"{prefix}TEST",
        name=f"{prefix} Test Programme",
        total_credits_required=384,
    )
    db.add(programme)
    db.flush()
    one = models.Student(
        student_number=f"{prefix}001",
        name="Student One",
        email=f"{prefix.lower()}one@example.test",
        programme_id=programme.id,
        current_year=1,
    )
    two = models.Student(
        student_number=f"{prefix}002",
        name="Student Two",
        email=f"{prefix.lower()}two@example.test",
        programme_id=programme.id,
        current_year=1,
    )
    db.add_all([one, two])
    db.flush()
    conversation = models.PrivateConversation(
        student_one_id=min(one.id, two.id),
        student_two_id=max(one.id, two.id),
    )
    db.add(conversation)
    db.flush()
    return one, two, conversation


def test_private_message_history_returns_latest_200_in_chronological_order():
    from app.routers import community

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSession()
    try:
        one, _, conversation = _private_fixture(db, "H")
        for index in range(205):
            db.add(models.PrivateMessage(
                conversation_id=conversation.id,
                sender_id=one.id,
                content=f"message-{index + 1}",
            ))
        db.commit()

        rows = community.private_messages(
            conversation.id,
            db=db,
            current_student=one,
        )

        assert len(rows) == 200
        assert rows[0].content == "message-6"
        assert rows[-1].content == "message-205"
    finally:
        db.close()


def test_read_all_does_not_mark_messages_from_inactive_conversations():
    from app.routers import community

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSession()
    try:
        one, two, active = _private_fixture(db, "R")
        inactive = models.PrivateConversation(
            student_one_id=active.student_one_id,
            student_two_id=active.student_two_id,
            is_active=False,
        )
        # The pair is unique, so reuse the original conversation as inactive and
        # create a second student pair for the active control.
        active.is_active = False
        db.flush()
        inactive_message = models.PrivateMessage(
            conversation_id=active.id,
            sender_id=two.id,
            content="old inactive message",
        )
        db.add(inactive_message)

        three = models.Student(
            student_number="R003",
            name="Student Three",
            email="rthree@example.test",
            programme_id=one.programme_id,
            current_year=1,
        )
        db.add(three)
        db.flush()
        active_two = models.PrivateConversation(
            student_one_id=min(one.id, three.id),
            student_two_id=max(one.id, three.id),
        )
        db.add(active_two)
        db.flush()
        active_message = models.PrivateMessage(
            conversation_id=active_two.id,
            sender_id=three.id,
            content="active unread message",
        )
        db.add(active_message)
        db.commit()

        community.mark_notifications_read(db=db, current_student=one)
        db.refresh(inactive_message)
        db.refresh(active_message)

        assert inactive_message.read_at is None
        assert active_message.read_at is not None
    finally:
        db.close()
