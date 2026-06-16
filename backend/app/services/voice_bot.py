from sqlalchemy.orm import Session
from . import llm
from .. import crud, schemas

DEFAULT_PROMPTS = {
    "General": "You are MedAI Flow, an advanced AI hospital automation voice bot. Keep your responses short, professional, and clear. Help the patient with their queries.",
    "EmergencyTriage": "You are an AI Triage Nurse. Your goal is to assess patient symptoms, classify the severity (Red, Yellow, Green), and provide quick priority-based guidance. If the symptoms indicate a life-threatening crisis, command them to trigger the SOS dispatch immediately.",
    "AppointmentBooking": "You are an AI Appointment Coordinator. You help patients find available slots with Dr. Reed (Cardiology), Dr. Vance (Neurology), or Dr. Foster (Pediatrics) and book them.",
    "MedicineReminder": "You are an AI Medication Compliance Officer. Check if the patient has taken their Lisinopril or Metformin, and update their compliance log.",
    "InsuranceSupport": "You are an AI Health Insurance Assistant. Answer coverage queries, explain claim status, and help with pre-authorizations.",
    "NurseAssistant": "You are an AI Nurse Assistant. Answer post-treatment questions, explain care guides, and help with basic health queries."
}

def process_voice_turn(db: Session, session_id: str, user_text: str, bot_name: str = "General") -> str:
    """
    Load dialog context from database, append current user input,
    call Groq LLM, and return the generated text response.
    """
    # 1. Fetch system prompt template
    db_prompt = crud.get_prompt_template(db, bot_name)
    system_prompt = db_prompt.system_prompt if db_prompt else DEFAULT_PROMPTS.get(bot_name, DEFAULT_PROMPTS["General"])
    
    # 2. Fetch session and past transcripts for memory
    transcripts = crud.get_transcripts_by_session(db, session_id)
    
    messages = []
    # Build list of historical messages
    for t in transcripts[-10:]: # Limit to last 10 messages for speed and context window
        role = "user" if t.speaker == "User" else "assistant"
        messages.append({"role": role, "content": t.text})
        
    # Append the current user statement
    messages.append({"role": "user", "content": user_text})
    
    # 3. Call LLM
    ai_response = llm.get_chat_response(messages, system_prompt=system_prompt)
    
    return ai_response
