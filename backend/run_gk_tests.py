import os
import sys
from unittest.mock import patch, MagicMock
import uuid
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal
from app.models import ChatbotSession, ChatbotMessage, User
from app.services.context_manager import ContextManagerService

def setup_db():
    db = SessionLocal()
    # Create test user
    user = db.query(User).filter(User.email == "test_g_k@example.com").first()
    if not user:
        user = User(email="test_g_k@example.com", name="Test User")
        db.add(user)
        db.commit()
    return db, user

def test_g_summary_failure_atomicity():
    db, user = setup_db()
    
    session_id = uuid.uuid4()
    original_time = datetime.utcnow() - timedelta(days=1)
    
    session = ChatbotSession(
        id=session_id,
        user_id=user.id,
        conversation_summary="EXISTING SUMMARY",
        summarized_until=original_time
    )
    db.add(session)
    db.commit()
    
    # Add enough messages to cross threshold
    # Suppose MAX_CONTEXT=4, THRESHOLD=2. We add 7 messages > original_time
    # so unsummarized_count = 7 > (4+2)=6.
    msgs = []
    for i in range(7):
        msg = ChatbotMessage(
            session_id=session_id,
            role="user" if i % 2 == 0 else "assistant",
            content=f"Test message {i}",
            status="completed",
            timestamp=original_time + timedelta(seconds=i+1)
        )
        msgs.append(msg)
    db.add_all(msgs)
    db.commit()
    
    # Mock Groq to raise Exception
    with patch("app.services.context_manager.Groq") as mock_groq:
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("Mocked Groq API Failure 429")
        mock_groq.return_value = mock_client
        
        # Call background task
        ContextManagerService.check_and_summarize(db, str(session_id))
        
    # Verify rollback
    db.refresh(session)
    assert session.conversation_summary == "EXISTING SUMMARY", f"Expected 'EXISTING SUMMARY', got {session.conversation_summary}"
    assert session.summarized_until == original_time, f"Expected {original_time}, got {session.summarized_until}"
    
    # Verify uncorrupted data
    count = db.query(ChatbotMessage).filter(ChatbotMessage.session_id == session_id).count()
    assert count == 7, f"Expected 7 messages, got {count}"
    
    print("Test G: PASSED. Summary unchanged, summarized_until unchanged, rollback successful.")


def test_k_current_user_message_exactly_once():
    db, user = setup_db()
    
    session_id = uuid.uuid4()
    session = ChatbotSession(
        id=session_id,
        user_id=user.id,
        conversation_summary="Some summary here",
        language="English"
    )
    db.add(session)
    db.commit()
    
    # Add some history
    for i in range(4):
        msg = ChatbotMessage(
            session_id=session_id,
            role="assistant" if i % 2 == 0 else "user",
            content=f"History {i}",
            status="completed"
        )
        db.add(msg)
    
    # The current message just added to DB
    unique_text = "UNIQUE_CURRENT_MESSAGE_K_73921"
    user_msg = ChatbotMessage(
        session_id=session_id,
        role="user",
        content=unique_text,
        status="completed"
    )
    db.add(user_msg)
    db.commit()
    
    payload = ContextManagerService.build_messages_payload(db, str(session_id), unique_text)
    
    # Validate exactly ONE occurrence
    occurrences = [m for m in payload if m.get("content", "") == unique_text]
    assert len(occurrences) == 1, f"Expected exactly 1 occurrence of {unique_text}, found {len(occurrences)}"
    
    # Validate Ordering
    assert payload[0]["role"] == "system", "First message should be system prompt"
    
    roles = [m["role"] for m in payload]
    
    # Verify the last is the user message
    assert payload[-1]["content"] == unique_text, "Last message must be the unique user message"
    assert payload[-1]["role"] == "user", "Last message role must be user"
    
    # Verify the second to last is language directive
    assert "CURRENT RESPONSE LANGUAGE:" in payload[-2]["content"], "Second to last message must be language directive"
    assert payload[-2]["role"] == "system", "Language directive role must be system"
    
    print("Test K: PASSED. Current user message appears exactly once. Context ordering is correct.")

if __name__ == "__main__":
    try:
        test_g_summary_failure_atomicity()
        test_k_current_user_message_exactly_once()
    except Exception as e:
        print(f"FAILED: {e}")
