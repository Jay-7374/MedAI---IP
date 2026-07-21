from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas, crud
from app.config import settings
from app.services import twilio_service
from app.services.voice_bot import process_voice_turn
from datetime import datetime

router = APIRouter(tags=["telephony"])

# SMS Log
sms_db = [
    {
        "id": 1,
        "text": "Salus Auth: Alex Mercer identity verified successfully at 2026-06-20 10:15 AM.",
        "timestamp": datetime.utcnow().isoformat(),
        "recipient": "+919995642737",
    },
]


def dispatch_sms(text: str, recipient: str = None) -> dict:
    to_number = recipient or getattr(settings, "DEFAULT_PATIENT_PHONE", "+919995642737")
    entry = {
        "id": len(sms_db) + 1,
        "text": text,
        "timestamp": datetime.utcnow().isoformat(),
        "recipient": to_number,
    }
    sms_db.append(entry)

    if twilio_service.is_configured():
        result = twilio_service.send_sms(to_number, text)
        entry["twilio_status"] = "sent" if result.get("sent") else "failed"
        entry["twilio_detail"] = result.get("sid") if result.get("sent") else result.get("reason")
    else:
        entry["twilio_status"] = "not_configured"

    return entry


@router.get("/api/sms", summary="List all outbound SMS notifications")
def get_sms():
    return sms_db


@router.post("/api/sms", summary="Send an SMS via Twilio")
def send_sms(req: dict):
    recipient = req.get("recipient") or getattr(settings, "DEFAULT_PATIENT_PHONE", "+919995642737")
    return dispatch_sms(req.get("text"), recipient=recipient)


@router.post("/api/calls/outbound", summary="Initiate a real outbound call via Twilio")
def start_outbound_call(req: dict, db: Session = Depends(get_db)):
    bot_name = req.get("bot_name", "PostDischargeCheckIn")
    to_number = req.get("to") or getattr(settings, "DEFAULT_PATIENT_PHONE", None)

    if not to_number:
        raise HTTPException(status_code=400, detail="No 'to' number given.")
    if not getattr(settings, "PUBLIC_BASE_URL", None):
        raise HTTPException(status_code=400, detail="PUBLIC_BASE_URL is not set.")
    if not twilio_service.is_configured():
        raise HTTPException(status_code=400, detail="Twilio is not configured.")

    twiml_url = f"{settings.PUBLIC_BASE_URL.rstrip('/')}/twilio/voice-start?bot_name={bot_name}"
    result = twilio_service.make_outbound_call(to_number, twiml_url)
    if not result.get("called"):
        raise HTTPException(status_code=502, detail=f"Twilio call failed: {result.get('reason')}")
    return result


def _twiml_response(xml: str) -> Response:
    return Response(content=xml, media_type="application/xml")


import logging
import html

# Set up logging for Twilio webhooks
logger = logging.getLogger(__name__)

@router.api_route("/twilio/voice-start", methods=["GET", "POST"], summary="[Twilio webhook] Bot opening line")
def twilio_voice_start(bot_name: str = "PostDischargeCheckIn"):
    logger.info(f"Twilio /voice-start called for bot: {bot_name}")
    opening_lines = {
        "NaturalSpeechAuth": "Hello, this is ARIA from Salus. I need to verify your identity before we proceed. Could you please tell me your full name?",
        "ConversationalScheduling": "Hello, this is NOVA from Salus Scheduling. What can I help you with today?",
        "PostDischargeCheckIn": "Hello, this is CARE from Salus. I'm calling for your post-discharge recovery check-in. Is now a good time?",
        "MedicationAdherence": "Hello, this is MEDI from Salus. I'm calling with your daily medication reminder. Are you ready?",
        "InsurancePolicyIntake": "Hello, this is FELIX from Salus's billing team. Could you tell me the name of your insurance provider?",
        "EmergencySeverity": "Hello, this is RAPID from Salus Emergency Triage. Please describe your symptoms.",
        "AiNurseAdvice": "Hello, this is NORA, your Salus nurse assistant. What would you like to know?",
        "ElderCareTerminal": "Hello! This is GRACE from Salus. I'm just calling to check in and have a little chat. How are you feeling today?",
        "TelemedicineBridge": "Hello, this is CONNECT from Salus. I'm calling to prepare you for your upcoming virtual doctor consultation. Does that sound okay?",
    }
    opening = opening_lines.get(bot_name, "Hello, this is Salus calling to check in with you. How are you doing today?")
    
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="/twilio/voice-gather?bot_name={bot_name}" method="POST" language="en-US" speechTimeout="auto" bargeIn="true">
        <Say>{html.escape(opening)}</Say>
    </Gather>
    <Say>We didn't hear a response. Goodbye for now.</Say>
    <Hangup/>
</Response>"""
    return _twiml_response(xml)


@router.post("/twilio/voice-gather", summary="[Twilio webhook] Process speech")
async def twilio_voice_gather(request: Request, bot_name: str = "PostDischargeCheckIn", db: Session = Depends(get_db)):
    form = await request.form()
    speech_result = form.get("SpeechResult", "").strip()
    call_sid = form.get("CallSid", "unknown-call")
    call_status = form.get("CallStatus", "unknown")
    
    logger.info(f"Twilio /voice-gather | CallSid: {call_sid} | Status: {call_status} | Speech: '{speech_result}'")

    # Ensure CallSession exists before creating transcripts
    if call_sid != "unknown-call":
        session = crud.get_session(db, call_sid)
        if not session:
            crud.create_session(db, schemas.CallSessionCreate(id=call_sid, channel="Twilio", status="InProgress"))
            
    # Handle empty speech / silence gracefully (Multi-turn retry)
    if not speech_result:
        logger.warning(f"Empty speech received for CallSid: {call_sid}. Asking for repeat.")
        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="/twilio/voice-gather?bot_name={bot_name}" method="POST" language="en-US" speechTimeout="auto" bargeIn="true">
        <Say>I'm sorry, I didn't quite catch that. Could you say that again?</Say>
    </Gather>
    <Say>It seems we're having connection issues. Goodbye.</Say>
    <Hangup/>
</Response>"""
        return _twiml_response(xml)

    # Process conversational turn
    try:
        ai_response = process_voice_turn(db, call_sid, speech_result, bot_name)
    except Exception as e:
        logger.error(f"Error in process_voice_turn for CallSid {call_sid}: {str(e)}")
        ai_response = "I'm sorry, I encountered a system error. We will call you back later."
        xml = f"""<?xml version="1.0" encoding="UTF-8"?><Response><Say>{html.escape(ai_response)}</Say><Hangup/></Response>"""
        return _twiml_response(xml)

    # Log to DB
    crud.create_transcript(db, schemas.TranscriptCreate(session_id=call_sid, speaker="User", text=speech_result))
    crud.create_transcript(db, schemas.TranscriptCreate(session_id=call_sid, speaker="AI", text=ai_response))

    # Detect hang-up phrases
    hangup_words = ["goodbye", "bye", "that's all", "thank you, that's all", "that's all for now", "hang up"]
    should_hangup = any(w in speech_result.lower() for w in hangup_words)

    if should_hangup:
        logger.info(f"Call completed successfully. Hanging up CallSid: {call_sid}")
        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>{html.escape(ai_response)}</Say>
    <Say>Thank you. Goodbye.</Say>
    <Hangup/>
</Response>"""
    else:
        # Continue conversation loop
        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="/twilio/voice-gather?bot_name={bot_name}" method="POST" language="en-US" speechTimeout="auto" bargeIn="true">
        <Say>{html.escape(ai_response)}</Say>
    </Gather>
    <Say>We didn't hear anything else. Goodbye.</Say>
    <Hangup/>
</Response>"""
    
    return _twiml_response(xml)
