import pytest

def test_chat_validation_empty_message(client, test_user):
    # Try chat without session id first (malformed)
    response = client.post(
        "/api/chatbot/sessions/not-a-uuid/chat",
        json={"role": "user", "content": "Hello", "language": "English", "mode": "General Assistant"},
        headers={"X-User-Id": str(test_user.id)}
    )
    assert response.status_code == 422 # Pydantic UUID validation fails
    
    # Create valid session
    session_response = client.post(
        "/api/chatbot/sessions",
        json={"title": "Test"},
        headers={"X-User-Id": str(test_user.id)}
    )
    session_id = session_response.json()["id"]
    
    # Empty message
    response = client.post(
        f"/api/chatbot/sessions/{session_id}/chat",
        json={"role": "user", "content": "   ", "language": "English", "mode": "General Assistant"},
        headers={"X-User-Id": str(test_user.id)}
    )
    assert response.status_code == 422

def test_chat_validation_long_message(client, test_user):
    session_response = client.post(
        "/api/chatbot/sessions",
        json={"title": "Test"},
        headers={"X-User-Id": str(test_user.id)}
    )
    session_id = session_response.json()["id"]
    
    # Message exceeding 4000 chars
    long_msg = "A" * 5001
    response = client.post(
        f"/api/chatbot/sessions/{session_id}/chat",
        json={"role": "user", "content": long_msg, "language": "English", "mode": "General Assistant"},
        headers={"X-User-Id": str(test_user.id)}
    )
    assert response.status_code == 422

def test_chat_validation_invalid_language(client, test_user):
    session_response = client.post(
        "/api/chatbot/sessions",
        json={"title": "Test"},
        headers={"X-User-Id": str(test_user.id)}
    )
    session_id = session_response.json()["id"]
    
    response = client.post(
        f"/api/chatbot/sessions/{session_id}/chat",
        json={"role": "user", "content": "Hello", "language": "Valyrian", "mode": "General Assistant"},
        headers={"X-User-Id": str(test_user.id)}
    )
    assert response.status_code == 422

def test_chat_validation_invalid_mode(client, test_user):
    session_response = client.post(
        "/api/chatbot/sessions",
        json={"title": "Test"},
        headers={"X-User-Id": str(test_user.id)}
    )
    session_id = session_response.json()["id"]
    
    response = client.post(
        f"/api/chatbot/sessions/{session_id}/chat",
        json={"role": "user", "content": "Hello", "language": "English", "mode": "Hacker Mode"},
        headers={"X-User-Id": str(test_user.id)}
    )
    assert response.status_code == 422
