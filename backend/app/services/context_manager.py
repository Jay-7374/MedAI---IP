from sqlalchemy.orm import Session
from app.models import ChatbotSession, ChatbotMessage, ChatbotDocument
from app.services.prompt_manager import PromptManager
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
        system_prompt = PromptManager.get_prompt(db, chat_session.mode)
        messages_payload.append({"role": "system", "content": system_prompt})

        # 3. Load Conversation Summary
        if chat_session.conversation_summary:
            summary_msg = f"Previously discussed context:\n{chat_session.conversation_summary}"
            messages_payload.append({"role": "system", "content": summary_msg})

        # 4. Load Document Summaries
        documents = db.query(ChatbotDocument).filter(ChatbotDocument.session_id == session_id).all()
        for doc in documents:
            if doc.summary:
                doc_msg = f"Extracted summary from uploaded file '{doc.filename}':\n{doc.summary}"
                messages_payload.append({"role": "system", "content": doc_msg})
        
        # 5. Load Recent Messages (sliding window)
        # Fetch the most recent N messages, then reverse them so they are chronological
        recent_messages = (
            db.query(ChatbotMessage)
            .filter(ChatbotMessage.session_id == session_id, ChatbotMessage.role.in_(["user", "assistant"]))
            .order_by(ChatbotMessage.timestamp.desc())
            .limit(settings.MAX_CONTEXT_MESSAGES)
            .all()
        )
        recent_messages.reverse()

        # Split history from the latest user message
        history_messages = recent_messages[:-1] if recent_messages else []
        latest_user_msg = recent_messages[-1] if recent_messages else None

        for msg in history_messages:
            messages_payload.append({"role": msg.role, "content": msg.content})

        # 6. Current Turn Language Directive (High Priority)
        # Placed after history and before the final user message to ensure the LLM
        # does not conflate historical semantic memory with current language selection.
        current_language_instruction = (
            f"CURRENT RESPONSE LANGUAGE: {chat_session.language}\n\n"
            "This language was explicitly selected by the user in the application UI for the current turn.\n\n"
            f"Respond naturally in {chat_session.language}.\n\n"
            "Conversation history may contain messages written in other languages because the user can change the UI language between turns. "
            "Those historical language choices were intentional and correct at the time.\n\n"
            "Use historical messages for their semantic content and conversational memory, not to infer the user's current language preference.\n\n"
            "Do not mention, explain, acknowledge, apologize for, or comment on any difference between the current response language and languages used earlier in the conversation.\n\n"
            "Do not say there was a language mix-up.\n\n"
            f"Do not say you will use {chat_session.language} from now on.\n\n"
            "Never discuss or acknowledge UI language changes unless the user explicitly asks about the language setting itself.\n\n"
            f"Simply answer the user's current message naturally in {chat_session.language}."
        )
        messages_payload.append({"role": "system", "content": current_language_instruction})

        # Append the latest user message last
        if latest_user_msg:
            messages_payload.append({"role": latest_user_msg.role, "content": latest_user_msg.content})

        return messages_payload
