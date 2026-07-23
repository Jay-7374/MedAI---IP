import pytest
import uuid
from sqlalchemy.dialects import postgresql
from sqlalchemy.types import String, TypeDecorator

class StringUUID(TypeDecorator):
    impl = String
    cache_ok = True

    def __init__(self, as_uuid=False, **kwargs):
        super().__init__(36, **kwargs)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        elif isinstance(value, uuid.UUID):
            return value.hex
        else:
            return uuid.UUID(str(value)).hex

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return uuid.UUID(value)

# Patch postgresql.UUID BEFORE importing any models
postgresql.UUID = StringUUID

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, get_db
import app.models
from main import app as fastapi_app
import app.database

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

from sqlalchemy.pool import StaticPool

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

fastapi_app.dependency_overrides[get_db] = override_get_db
app.database.SessionLocal = TestingSessionLocal
app.database.engine = engine

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    db = TestingSessionLocal()
    yield db
    from app.models import ChatbotSession, ChatbotMessage, ChatbotDocument
    db.query(ChatbotMessage).delete()
    db.query(ChatbotDocument).delete()
    db.query(ChatbotSession).delete()
    db.commit()
    db.close()

@pytest.fixture(scope="function")
def test_user(db_session):
    user = db_session.query(app.models.User).filter(app.models.User.email == "test_pytest@example.com").first()
    if not user:
        user = app.models.User(id=1, email="test_pytest@example.com", name="Pytest User")
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def test_user_2(db_session):
    user = db_session.query(app.models.User).filter(app.models.User.email == "test2_pytest@example.com").first()
    if not user:
        user = app.models.User(id=2, email="test2_pytest@example.com", name="Pytest User 2")
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def auth_headers(test_user):
    from app.services.auth_service import create_access_token
    token = create_access_token(data={"sub": str(test_user.id), "role": "patient"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def client():
    with TestClient(fastapi_app) as c:
        yield c

@pytest.fixture(scope="function", autouse=True)
def block_external_llm_calls(monkeypatch):
    mock_primary = MagicMock()
    
    mock_fallback = MagicMock()
    
    def smart_create(*args, **kwargs):
        model = kwargs.get("model", "")
        if "gpt-oss-120b" in model:
            return mock_fallback(*args, **kwargs)
        else:
            return mock_primary(*args, **kwargs)
            
    mock_async_client = MagicMock()
    mock_async_client.chat.completions.create = MagicMock(side_effect=smart_create)
    
    monkeypatch.setattr("app.services.llm.async_client", mock_async_client)
    
    mock_sync_client = MagicMock()
    
    class MockMessage:
        content = "Mock Summary"
        
    class MockChoice:
        message = MockMessage()
        
    class MockCompletion:
        choices = [MockChoice()]
        
    mock_sync_client.chat.completions.create.return_value = MockCompletion()
    
    mock_groq_class = MagicMock(return_value=mock_sync_client)
    monkeypatch.setattr("app.services.document_service.Groq", mock_groq_class)
    monkeypatch.setattr("app.services.context_manager.Groq", mock_groq_class)
    
    return {"primary": mock_primary, "fallback": mock_fallback, "sync": mock_sync_client}
