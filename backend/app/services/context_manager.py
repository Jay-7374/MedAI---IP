from sqlalchemy.orm import Session
from app.models import ChatbotSession, ChatbotMessage, ChatbotDocument
from app.prompts.manager import prompt_manager
from app.config import settings

class ContextManagerService:
    @staticmethod
    def build_messages_payload(db: Session, session_id: str, new_user_message: str) -> list[dict]:
        """
        Aggregates session, language, document summaries, conversation summary,
        and recent messages into a list of messages for the LLM.
        """
        # 1. Load Session
        chat_session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id).first()
        if not chat_session:
            raise ValueError(f"Session {session_id} not found")

        messages_payload = []

        # 2. Load Healthcare Mode Prompt
        system_prompt = prompt_manager.get_prompt(chat_session.mode)
        
        # 3. Load Language Enforcer
        language_instruction = f"CRITICAL: Ensure your entire response is translated and formulated strictly in {chat_session.language}."
        
        full_system_prompt = f"{system_prompt}\n\n{language_instruction}"
        messages_payload.append({"role": "system", "content": full_system_prompt})

        # 4. Load Conversation Summary
        if chat_session.conversation_summary:
            summary_msg = f"Previously discussed context:\n{chat_session.conversation_summary}"
            messages_payload.append({"role": "system", "content": summary_msg})

        # 5. Load Document Summaries
        documents = db.query(ChatbotDocument).filter(ChatbotDocument.session_id == session_id).all()
        for doc in documents:
            if doc.summary:
                doc_msg = f"Extracted summary from uploaded file '{doc.filename}':\n{doc.summary}"
                messages_payload.append({"role": "system", "content": doc_msg})
        
        # 6. Load Recent Messages (sliding window)
        # Fetch the most recent N messages, then reverse them so they are chronological
        recent_messages = (
            db.query(ChatbotMessage)
            .filter(ChatbotMessage.session_id == session_id, ChatbotMessage.role.in_(["user", "assistant"]))
            .order_by(ChatbotMessage.timestamp.desc())
            .limit(settings.MAX_CONTEXT_MESSAGES)
            .all()
        )
        recent_messages.reverse()

        for msg in recent_messages:
            messages_payload.append({"role": msg.role, "content": msg.content})

        # 7. Append the current user message
        messages_payload.append({"role": "user", "content": new_user_message})

        return messages_payload
