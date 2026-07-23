import pytest
from app.models import ChatbotSession, ChatbotMessage
from tests.test_fallback import setup_fallback_mocks

def test_retry(client, test_user, db_session, block_external_llm_calls):
    mock_primary, _ = setup_fallback_mocks(block_external_llm_calls)
    
    session_response = client.post("/api/chatbot/sessions", json={"title": "Retry Test"}, headers={"X-User-Id": str(test_user.id)})
    session_id = session_response.json()["id"]
    
    msg1 = ChatbotMessage(session_id=session_id, role="user", content="Test", status="completed")
    msg2 = ChatbotMessage(session_id=session_id, role="assistant", content="", status="failed")
    db_session.add(msg1)
    db_session.add(msg2)
    db_session.commit()
    
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
            yield MockChunk("Retry ")
            yield MockChunk("Worked")
            
        async def close(self): pass

    class AsyncMockSuccessStream:
        def __await__(self):
            async def wrapper():
                return AsyncMockStream()
            return wrapper().__await__()
            
    mock_primary.return_value = AsyncMockSuccessStream()
    
    response = client.post(f"/api/chatbot/sessions/{session_id}/chat/retry", headers={"X-User-Id": str(test_user.id)})
    assert response.status_code == 200
    
    content = response.content.decode("utf-8")
    assert 'data: {"content": "Retry "}' in content
    assert 'data: {"content": "Worked"}' in content
    
    msgs = client.get(f"/api/chatbot/sessions/{session_id}/messages", headers={"X-User-Id": str(test_user.id)}).json()
    assert len(msgs) == 3
    assert msgs[0]["role"] == "user"
    assert msgs[1]["role"] == "assistant"
    assert msgs[2]["role"] == "assistant"
    assert msgs[2]["content"] == "Retry Worked"
    assert msgs[2]["status"] == "completed"
