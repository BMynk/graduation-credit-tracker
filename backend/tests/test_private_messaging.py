import os
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-that-is-long-enough-for-tests")

from fastapi.testclient import TestClient
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

app.dependency_overrides[get_db] = override_db

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
