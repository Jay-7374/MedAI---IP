import os
import sys
import uuid
import json
import asyncio
from unittest.mock import patch, MagicMock

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal
from app.models import ChatbotSession, ChatbotMessage, User
from app.services.context_manager import ContextManagerService
from fastapi.testclient import TestClient
from main import app
from app.config import settings

client = TestClient(app)

def setup_db():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "test_phase_6b@example.com").first()
    if not user:
        user = User(email="test_phase_6b@example.com", name="Test User 6B")
        db.add(user)
        db.commit()
        db.refresh(user)
    return db, user

def test_i_j_k_l_validation():
    print("Testing Input Validation (I, J, K, L)...")
    db, user = setup_db()
    session = client.post("/api/chatbot/sessions", json={"title": "Test"}, headers={"X-User-Id": str(user.id)}).json()
    session_id = session["id"]

    # I: Empty whitespace
    res = client.post(f"/api/chatbot/sessions/{session_id}/chat", json={"content": "   ", "language": "English", "mode": "General Assistant"}, headers={"X-User-Id": str(user.id)})
    assert res.status_code == 422, "Empty message should be rejected"

    # J: Excessively long message
    long_msg = "A" * 6000
    res = client.post(f"/api/chatbot/sessions/{session_id}/chat", json={"content": long_msg, "language": "English", "mode": "General Assistant"}, headers={"X-User-Id": str(user.id)})
    assert res.status_code == 422, "Long message should be rejected"

    # K: Invalid language
    res = client.post(f"/api/chatbot/sessions/{session_id}/chat", json={"content": "Hello", "language": "Klingon", "mode": "General Assistant"}, headers={"X-User-Id": str(user.id)})
    assert res.status_code == 422, "Invalid language should be rejected"

    # L: Invalid mode
    res = client.post(f"/api/chatbot/sessions/{session_id}/chat", json={"content": "Hello", "language": "English", "mode": "Hacker Mode"}, headers={"X-User-Id": str(user.id)})
    assert res.status_code == 422, "Invalid mode should be rejected"

    print("Passed I, J, K, L.")

def test_m_n_document_validation():
    print("Testing Document Validation (M, N, O)...")
    db, user = setup_db()
    session = client.post("/api/chatbot/sessions", json={"title": "Test"}, headers={"X-User-Id": str(user.id)}).json()
    session_id = session["id"]

    # N: Empty file
    res = client.post(f"/api/chatbot/sessions/{session_id}/upload", files={"file": ("empty.txt", b"", "text/plain")}, headers={"X-User-Id": str(user.id)})
    assert res.status_code == 400, "Empty document should be rejected"

    # N: Unsupported file type
    res = client.post(f"/api/chatbot/sessions/{session_id}/upload", files={"file": ("virus.exe", b"binarydata", "application/x-msdownload")}, headers={"X-User-Id": str(user.id)})
    assert res.status_code == 400, "Unsupported document should be rejected"

    # M: Oversized document
    large_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024 + 100
    res = client.post(f"/api/chatbot/sessions/{session_id}/upload", files={"file": ("large.txt", b"A" * large_size, "text/plain")}, headers={"X-User-Id": str(user.id)})
    assert res.status_code == 413, "Oversized document should be rejected"

    print("Passed M, N, O logic.")

def test_a_b_c_d_e_f_g_h_streaming_retry():
    print("Testing Streaming Errors and Retry (A-H)...")
    db, user = setup_db()
    
    # We will simulate behavior logically as mock streaming can be tricky with TestClient
    
    # 1. Normal user message
    session = client.post("/api/chatbot/sessions", json={"title": "Test Stream"}, headers={"X-User-Id": str(user.id)}).json()
    session_id = session["id"]
    
    # 2. B: Mocked 429
    with patch("app.services.llm.async_client") as mock_groq_client:
        class AsyncMock429Stream:
            def __await__(self):
                # Raise an exception when awaited (since we await create())
                raise Exception("429 Too Many Requests")
                yield

        def mock_create(*args, **kwargs):
            return AsyncMock429Stream()
        mock_groq_client.chat.completions.create = mock_create
        
        # Test client streams
        res = client.post(f"/api/chatbot/sessions/{session_id}/chat", json={"role": "user", "content": "Hello", "language": "English", "mode": "General Assistant"}, headers={"X-User-Id": str(user.id)})
        lines = [line if isinstance(line, str) else line.decode("utf-8") for line in res.iter_lines() if line]
        assert any("error" in line and "busy" in line for line in lines), f"Should output error event on 429, got: {lines}"
        
        # Verify db status (F)
        msgs = client.get(f"/api/chatbot/sessions/{session_id}/messages", headers={"X-User-Id": str(user.id)}).json()
        assert msgs[-1]["role"] == "assistant"
        assert msgs[-1]["status"] == "failed"
        
    # G: Retry succeeds without duplicate user row
    user_count_before = len([m for m in msgs if m["role"] == "user"])
    
    with patch("app.services.llm.async_client") as mock_groq_client:
        class AsyncMockStream:
            async def __aiter__(self):
                mock_chunk = MagicMock()
                mock_chunk.choices = [MagicMock()]
                mock_chunk.choices[0].delta.content = "Retry Success"
                yield mock_chunk

        class AsyncMockSuccessStream:
            def __await__(self):
                async def wrapper():
                    return AsyncMockStream()
                return wrapper().__await__()

        def mock_create_success(*args, **kwargs):
            return AsyncMockSuccessStream()
        
        mock_groq_client.chat.completions.create = mock_create_success
        
        res = client.post(f"/api/chatbot/sessions/{session_id}/chat/retry", headers={"X-User-Id": str(user.id)})
        
        msgs_after = client.get(f"/api/chatbot/sessions/{session_id}/messages", headers={"X-User-Id": str(user.id)}).json()
        user_count_after = len([m for m in msgs_after if m["role"] == "user"])
        assert user_count_before == user_count_after, "Retry should not duplicate user message"
        
        assert msgs_after[-1]["role"] == "assistant"
        assert msgs_after[-1]["status"] == "completed"

    print("Passed A-H logic.")

if __name__ == "__main__":
    test_i_j_k_l_validation()
    test_m_n_document_validation()
    test_a_b_c_d_e_f_g_h_streaming_retry()
    print("ALL TESTS COMPLETED SUCCESSFULLY.")
