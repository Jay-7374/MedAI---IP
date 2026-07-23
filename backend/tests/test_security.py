import pytest
from fastapi.testclient import TestClient
from uuid import uuid4
from unittest.mock import patch
from app.models import User, ChatbotSession

def test_missing_authentication(client):
    """Test A: Missing Authentication"""
    response = client.get("/api/chatbot/sessions")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

def test_invalid_authentication(client):
    """Test B: Invalid Authentication"""
    response = client.get("/api/chatbot/sessions", headers={"Authorization": "Bearer invalid_token"})
    assert response.status_code == 401
    assert "Could not validate credentials" in response.json()["detail"]

def test_successful_authenticated_flow(client, auth_headers):
    """Test D: Successful authenticated flow"""
    response = client.get("/api/chatbot/sessions", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_identity_spoofing(client, auth_headers, test_user, test_user_2):
    """Test I: Identity spoofing via fake X-User-Id"""
    # Send test_user's token but test_user_2's X-User-Id
    spoof_headers = {**auth_headers, "X-User-Id": str(test_user_2.id)}
    # It should succeed but return test_user's sessions, completely ignoring X-User-Id
    response = client.post(
        "/api/chatbot/sessions",
        headers=spoof_headers,
        json={"title": "Spoof Session", "language": "English", "mode": "General"}
    )
    assert response.status_code == 200
    session_data = response.json()
    assert session_data["user_id"] == test_user.id # Ensures the token's identity was used

def test_cross_user_access(client, auth_headers, test_user_2, db_session):
    """Tests E, F, G, H: Cross-User Read/Write/Delete"""
    # Create a session for test_user_2
    session_id = uuid4()
    new_session = ChatbotSession(
        id=session_id,
        user_id=test_user_2.id,
        title="User 2 Session",
        language="English",
        mode="General"
    )
    db_session.add(new_session)
    db_session.commit()

    # User 1 tries to read User 2's session
    response = client.get(f"/api/chatbot/sessions/{session_id}", headers=auth_headers)
    assert response.status_code == 403

    # User 1 tries to delete User 2's session
    response = client.delete(f"/api/chatbot/sessions/{session_id}", headers=auth_headers)
    assert response.status_code == 403

    # User 1 tries to read User 2's messages
    response = client.get(f"/api/chatbot/sessions/{session_id}/messages", headers=auth_headers)
    assert response.status_code == 403

    # User 1 tries to chat in User 2's session
    response = client.post(
        f"/api/chatbot/sessions/{session_id}/chat",
        headers=auth_headers,
        json={"content": "Hello", "role": "user"}
    )
    assert response.status_code == 403
