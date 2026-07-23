import pytest
from app.models import ChatbotSession, ChatbotMessage, ChatbotDocument
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

def test_document_extracted_text_priority(client, test_user, db_session):
    session = ChatbotSession(user_id=test_user.id, title="Doc Test")
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    # Create a document with both extracted_text and summary
    doc = ChatbotDocument(
        session_id=session.id,
        filename="test3.txt",
        mime_type="text/plain",
        file_size=100,
        extracted_text="The code name for the new initiative is Project Alpha.",
        summary="A document about a new initiative."
    )
    db_session.add(doc)
    db_session.commit()

    payload = ContextManagerService.build_messages_payload(db_session, str(session.id), "What is the project code name?")
    
    # Verify that the extracted text is present in the system message for the document
    doc_system_msgs = [m for m in payload if m["role"] == "system" and "[DOCUMENT CONTENT START - test3.txt]" in m["content"]]
    assert len(doc_system_msgs) == 1
    content = doc_system_msgs[0]["content"]
    assert "Project Alpha" in content
    assert "A document about a new initiative." not in content
