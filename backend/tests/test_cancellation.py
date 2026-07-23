import pytest
import asyncio
from app.models import ChatbotSession, ChatbotMessage

@pytest.mark.skip(reason="TestClient hangs on streaming disconnect")
def test_cancellation_preserves_partial_response(client, test_user, db_session, block_external_llm_calls):
    mock_primary = block_external_llm_calls["primary"]
    
    session_response = client.post("/api/chatbot/sessions", json={"title": "Cancel Test"}, headers={"X-User-Id": str(test_user.id)})
    session_id = session_response.json()["id"]
    
    class MockChunk:
        def __init__(self, content):
            class Delta:
                pass
            class Choice:
                pass
            self.choices = [Choice()]
            self.choices[0].delta = Delta()
            self.choices[0].delta.content = content

    class AsyncMockStream:
        async def __aiter__(self):
            yield MockChunk("Partial ")
            yield MockChunk("text")
            raise asyncio.CancelledError() 
            
        async def close(self): pass

    class AsyncMockSuccessStream:
        def __await__(self):
            async def wrapper():
                return AsyncMockStream()
            return wrapper().__await__()
            
    mock_primary.return_value = AsyncMockSuccessStream()
    
    try:
        response = client.post(
            f"/api/chatbot/sessions/{session_id}/chat",
            json={"role": "user", "content": "Hi", "language": "English", "mode": "General Assistant"},
            headers={"X-User-Id": str(test_user.id)}
        )
    except Exception:
        pass 
        
    msgs = client.get(f"/api/chatbot/sessions/{session_id}/messages", headers={"X-User-Id": str(test_user.id)}).json()
    assert len(msgs) == 2
    assert msgs[1]["role"] == "assistant"
    assert msgs[1]["content"] == "Partial text"
    assert msgs[1]["status"] == "completed"

@pytest.mark.skip(reason="TestClient hangs on streaming disconnect")
def test_cancellation_empty_response(client, test_user, db_session, block_external_llm_calls):
    mock_primary = block_external_llm_calls["primary"]
    
    session_response = client.post("/api/chatbot/sessions", json={"title": "Cancel Empty"}, headers={"X-User-Id": str(test_user.id)})
    session_id = session_response.json()["id"]

    class AsyncMockStream:
        async def __aiter__(self):
            raise asyncio.CancelledError() 
            
        async def close(self): pass

    class AsyncMockSuccessStream:
        def __await__(self):
            async def wrapper():
                return AsyncMockStream()
            return wrapper().__await__()
            
    mock_primary.return_value = AsyncMockSuccessStream()
    
    try:
        client.post(
            f"/api/chatbot/sessions/{session_id}/chat",
            json={"role": "user", "content": "Hi", "language": "English", "mode": "General Assistant"},
            headers={"X-User-Id": str(test_user.id)}
        )
    except Exception:
        pass
        
    msgs = client.get(f"/api/chatbot/sessions/{session_id}/messages", headers={"X-User-Id": str(test_user.id)}).json()
    assert len(msgs) == 1
    assert msgs[0]["role"] == "user"
