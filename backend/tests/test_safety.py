import pytest
from app.services.context_manager import ContextManagerService
from app.config import settings

def test_medical_safety_prompt_inclusion(db_session, test_user):
    from app.models import ChatbotSession
    session = ChatbotSession(user_id=test_user.id, title="Safety Test", mode="General Assistant")
    db_session.add(session)
    db_session.commit()
    
    payload = ContextManagerService.build_messages_payload(db_session, str(session.id), "I have chest pain.")
    
    system_msg = payload[0]["content"]
    
    # Must contain the medical safety clauses
    assert "call their local emergency services immediately" in system_msg.lower()
    assert "911" not in system_msg  # Verify Phase 6C fix where specific numbers are avoided

def test_mode_customization(db_session, test_user):
    from app.models import ChatbotSession
    session = ChatbotSession(user_id=test_user.id, title="Mode Test", mode="Symptom Checker")
    db_session.add(session)
    db_session.commit()
    
    payload = ContextManagerService.build_messages_payload(db_session, str(session.id), "Hello")
    system_msg = payload[0]["content"]
    
    assert "clinical symptom analyzer" in system_msg

def test_language_customization(db_session, test_user):
    from app.models import ChatbotSession
    session = ChatbotSession(user_id=test_user.id, title="Lang Test", language="French")
    db_session.add(session)
    db_session.commit()
    
    payload = ContextManagerService.build_messages_payload(db_session, str(session.id), "Hello")
    
    # Check that a language directive is injected
    lang_msgs = [m for m in payload if m["role"] == "system" and "French" in m["content"]]
    assert len(lang_msgs) >= 1
    assert any("Respond naturally in French" in m["content"] for m in lang_msgs)
