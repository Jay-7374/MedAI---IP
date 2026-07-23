import pytest
import asyncio
from app.models import ChatbotSession

def setup_fallback_mocks(block_external_llm_calls):
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

    async def fallback_success_stream(*args, **kwargs):
        class Stream:
            async def __aiter__(self):
                yield MockChunk("Fallback Success")
            async def close(self):
                pass
        return Stream()

    mock_fallback.side_effect = fallback_success_stream
    return mock_primary, mock_fallback

def test_fallback_on_429(client, test_user, block_external_llm_calls, auth_headers):
    mock_primary, mock_fallback = setup_fallback_mocks(block_external_llm_calls)
    
    import groq
    from httpx import Response, Request
    error_429 = groq.RateLimitError("429 Too Many Requests", response=Response(429, request=Request('POST', 'http://a')), body=None)
    
    async def primary_fail_stream(*args, **kwargs):
        raise error_429
            
    mock_primary.side_effect = primary_fail_stream
    
    session_response = client.post("/api/chatbot/sessions", json={"title": "T"}, headers=auth_headers)
    session_id = session_response.json()["id"]
    
    response = client.post(
        f"/api/chatbot/sessions/{session_id}/chat",
        json={"role": "user", "content": "Hi", "language": "English", "mode": "General Assistant"},
        headers=auth_headers
    )
    
    content = response.content.decode("utf-8")
    assert 'data: {"content": "Fallback Success"}' in content
    
    assert mock_fallback.call_count == 1
    
    primary_call_kwargs = mock_primary.call_args.kwargs
    assert primary_call_kwargs["model"] == "llama-3.3-70b-versatile"
    fallback_call_kwargs = mock_fallback.call_args.kwargs
    assert fallback_call_kwargs["model"] == "openai/gpt-oss-120b"
    
    msgs = client.get(f"/api/chatbot/sessions/{session_id}/messages", headers=auth_headers).json()
    assert msgs[-1]["content"] == "Fallback Success"

def test_no_fallback_midstream(client, test_user, block_external_llm_calls, auth_headers):
    mock_primary, mock_fallback = setup_fallback_mocks(block_external_llm_calls)
    
    import groq
    from httpx import Response, Request
    error_500 = groq.InternalServerError("500 Server Error", response=Response(500, request=Request('POST', 'http://a')), body=None)

    class MockChunk:
        def __init__(self, content):
            class Delta:
                pass
            class Choice:
                pass
            self.choices = [Choice()]
            self.choices[0].delta = Delta()
            self.choices[0].delta.content = content

    async def primary_mid_fail_stream(*args, **kwargs):
        class Stream:
            async def __aiter__(self):
                yield MockChunk("Started")
                raise error_500
        return Stream()
            
    mock_primary.side_effect = primary_mid_fail_stream
    
    session_response = client.post("/api/chatbot/sessions", json={"title": "T"}, headers=auth_headers)
    session_id = session_response.json()["id"]
    
    response = client.post(
        f"/api/chatbot/sessions/{session_id}/chat",
        json={"role": "user", "content": "Hi", "language": "English", "mode": "General Assistant"},
        headers=auth_headers
    )
    
    content = response.content.decode("utf-8")
    assert 'data: {"content": "Started"}' in content
    assert 'data: {"error":' in content
    
    assert mock_fallback.call_count == 0

def test_no_fallback_on_auth_error(client, test_user, block_external_llm_calls, auth_headers):
    mock_primary, mock_fallback = setup_fallback_mocks(block_external_llm_calls)
    
    import groq
    from httpx import Response, Request
    error_401 = groq.AuthenticationError("401 Unauthorized", response=Response(401, request=Request('POST', 'http://a')), body=None)
    
    async def primary_auth_fail(*args, **kwargs):
        raise error_401
            
    mock_primary.side_effect = primary_auth_fail
    
    session_response = client.post("/api/chatbot/sessions", json={"title": "T"}, headers=auth_headers)
    session_id = session_response.json()["id"]
    
    response = client.post(
        f"/api/chatbot/sessions/{session_id}/chat",
        json={"role": "user", "content": "Hi", "language": "English", "mode": "General Assistant"},
        headers=auth_headers
    )
    
    content = response.content.decode("utf-8")
    assert 'data: {"error":' in content
    assert mock_fallback.call_count == 0

def test_both_fail(client, test_user, block_external_llm_calls, auth_headers):
    mock_primary, mock_fallback = setup_fallback_mocks(block_external_llm_calls)
    
    import groq
    from httpx import Response, Request
    error_429 = groq.RateLimitError("429 Too Many Requests", response=Response(429, request=Request('POST', 'http://a')), body=None)
    error_503 = groq.APIConnectionError(request=Request('POST', 'http://a'))
    
    async def primary_fail_stream(*args, **kwargs):
        raise error_429
            
    async def fallback_fail_stream(*args, **kwargs):
        raise error_503
            
    mock_primary.side_effect = primary_fail_stream
    mock_fallback.side_effect = fallback_fail_stream
    
    session_response = client.post("/api/chatbot/sessions", json={"title": "T"}, headers=auth_headers)
    session_id = session_response.json()["id"]
    
    response = client.post(
        f"/api/chatbot/sessions/{session_id}/chat",
        json={"role": "user", "content": "Hi", "language": "English", "mode": "General Assistant"},
        headers=auth_headers
    )
    
    content = response.content.decode("utf-8")
    assert 'data: {"error":' in content
    
    msgs = client.get(f"/api/chatbot/sessions/{session_id}/messages", headers=auth_headers).json()
    assert msgs[-1]["role"] == "user"
