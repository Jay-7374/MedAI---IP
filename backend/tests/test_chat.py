import pytest
from app.models import ChatbotSession, ChatbotMessage
import json

def test_normal_chat(client, test_user, block_external_llm_calls):
    mock_primary = block_external_llm_calls["primary"]
    mock_fallback = block_external_llm_calls["fallback"]
    
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
            yield MockChunk("Hello")
            yield MockChunk(" World")
            yield MockChunk("!")
            
        async def close(self):
            pass

    class AsyncMockSuccessStream:
        def __await__(self):
            async def wrapper():
                return AsyncMockStream()
            return wrapper().__await__()
            
    mock_primary.side_effect = None
    mock_fallback.side_effect = None
    mock_primary.return_value = AsyncMockSuccessStream()
    
    session_response = client.post(
        "/api/chatbot/sessions",
        json={"title": "Chat Test"},
        headers={"X-User-Id": str(test_user.id)}
    )
    session_id = session_response.json()["id"]
    
    response = client.post(
        f"/api/chatbot/sessions/{session_id}/chat",
        json={"role": "user", "content": "Hi", "language": "English", "mode": "General Assistant"},
        headers={"X-User-Id": str(test_user.id)}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"
    
    content = response.content.decode("utf-8")
    assert 'data: {"content": "Hello"}' in content
    assert 'data: {"content": " World"}' in content
    assert 'data: {"content": "!"}' in content
    assert "data: [DONE]" in content
    
    msgs_response = client.get(
        f"/api/chatbot/sessions/{session_id}/messages",
        headers={"X-User-Id": str(test_user.id)}
    )
    msgs = msgs_response.json()
    assert len(msgs) == 2
    assert msgs[0]["role"] == "user"
    assert msgs[0]["content"] == "Hi"
    
    assert msgs[1]["role"] == "assistant"
    assert msgs[1]["content"] == "Hello World!"
    assert msgs[1]["status"] == "completed"
