import pytest
from app.models import ChatbotSession, ChatbotMessage
from app.services.context_manager import ContextManagerService

def test_max_context_window(client, test_user, db_session):
    # ContextManagerService limits to 10 previous messages by default
    session = ChatbotSession(user_id=test_user.id, title="Context Test", conversation_summary="PREVIOUS SUMMARY")
    db_session.add(session)
    db_session.commit()
    
    # Insert 15 messages
    for i in range(15):
        msg = ChatbotMessage(session_id=session.id, role="user" if i % 2 == 0 else "assistant", content=f"Msg {i}", status="completed")
        db_session.add(msg)
        
    db_session.add(ChatbotMessage(session_id=session.id, role="user", content="Current message", status="completed"))
    db_session.commit()
    
    payload = ContextManagerService.build_messages_payload(db_session, str(session.id), "Current message")
    
    # We should have System, (Summary if any), context messages, language rule, Current
    # MAX_CONTEXT_MESSAGES = 10, meaning we take the last 10.
    roles = [m["role"] for m in payload]
    assert roles[0] == "system"
    assert payload[-1]["content"] == "Current message"
    
    # Verify summary is present
    summary_found = False
    for m in payload:
        if m["role"] == "system" and "PREVIOUS SUMMARY" in m["content"]:
            summary_found = True
            break
    assert summary_found, "Rolling summary must be included"
    
    # Extract just the history (not system, not current, not language directive)
    history = [m for m in payload if m["role"] in ["user", "assistant"] and m["content"] != "Current message"]
    
    # Should not exceed max context config
    from app.config import settings
    assert len(history) <= settings.MAX_CONTEXT_MESSAGES
    
    # Verify chronological ordering - last in history should be Msg 14
    assert history[-1]["content"] == "Msg 14"
