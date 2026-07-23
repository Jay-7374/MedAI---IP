import re

with open('f:/MedAI - IP/backend/app/routers/chatbot.py', 'r') as f:
    content = f.read()

# For get_session, delete_session, get_messages, stream_and_save_response, trigger_summarization, chat_stream, chat_retry, upload_document, get_session_documents, delete_document
# I need to change:
# session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id, ChatbotSession.user_id == current_user.id).first()
# if not session:
#     raise HTTPException(status_code=404, detail="Session not found")
# TO:
# session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id).first()
# if not session:
#     raise HTTPException(status_code=404, detail="Session not found")
# if session.user_id != current_user.id:
#     raise HTTPException(status_code=403, detail="Forbidden")

pattern = r'session\s*=\s*db\.query\(ChatbotSession\)\.filter\(ChatbotSession\.id\s*==\s*session_id,\s*ChatbotSession\.user_id\s*==\s*current_user\.id\)\.first\(\)\s*\n\s*if not session:\s*\n\s*raise HTTPException\(status_code=404,\s*detail="Session not found"\)'

replacement = """session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")"""

content = re.sub(pattern, replacement, content)

with open('f:/MedAI - IP/backend/app/routers/chatbot.py', 'w') as f:
    f.write(content)
