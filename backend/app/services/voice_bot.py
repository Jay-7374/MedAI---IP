from sqlalchemy.orm import Session
from . import llm
from .. import crud, schemas

DEFAULT_PROMPTS = {
    "General": "You are MedAI Flow, an advanced AI hospital automation voice bot. Keep your responses short, professional, and clear. Help the patient with their queries.",
    "AppointmentBooking": "You are an AI Appointment Booking Assistant. Help the patient select a department, clinic location, or clinician to request a booking, and collect details of their symptoms.",
    "PatientFollowUp": "You are an AI Patient Follow-Up Calls Agent. Your task is to check on patients who recently visited the clinic, ask about their recovery status, medication side effects, and log any feedback or concerns they express.",
    "PostDischarge": "You are an AI Post-Discharge Monitoring Bot. Ask patients who were recently discharged about their surgical wounds, medication compliance, daily pain levels, and general progress. Flag anomalies for clinician escalation if needed.",
    "MedicineReminder": "You are an AI Medicine Reminder Assistant. Check if the patient has taken their daily medications (Lisinopril, Metformin), remind them of schedules, and log compliance.",
    "InsuranceSupport": "You are an AI Health Insurance Support Bot. Answer coverage queries, explain claim status, clarify co-pays or deductibles, and assist with pre-authorization workflows.",
    "EmergencyTriage": "You are an AI Emergency Triage Voice Assistant. Your goal is to assess patient symptoms, classify the severity (Red, Yellow, Green), and provide quick priority-based guidance. If the symptoms indicate a life-threatening crisis, command them to trigger the SOS dispatch immediately.",
    "DiagnosticEnquiry": "You are an AI Diagnostic Center Enquiry Handler. Assist patients with enquiries regarding laboratory tests, radiology pricing, test requirements (like fasting), and result delivery timelines.",
    "DoctorScheduling": "You are an AI Doctor Appointment Scheduling Agent. Access practitioner schedules, find open timeslots matching specialty requirements, and coordinate bookings preventing double allocations.",
    "AiNurse": "You are an AI Nurse Assistant. Answer patient care questions, clarify discharge recovery instructions, explain basic medications, and address common health FAQs in a warm, caring manner.",
    "ElderCare": "You are an AI Elder Care Monitoring Voice Bot. Perform daily check-ins on elderly patients, check on physical comfort levels, confirm if they took medications, and log vital parameters (e.g. pulse, temp).",
    "Telemedicine": "You are an AI Telemedicine Voice Assistant. Guide the patient through an end-to-end virtual consult: collect symptoms, run a preliminary triage, and summarize the session to prepare for connecting with a doctor."
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
