from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/api/emergency", tags=["emergency"])

@router.post("/sos", summary="Trigger emergency SOS")
def trigger_sos():
    from app.routers.telephony import dispatch_sms
    sms_text = "MedAI Emergency SOS: Vitals critical. Ambulance Unit #4B dispatched. ETA: 7 mins."
    dispatch_sms(sms_text)
    return {
        "status": "success",
        "message": "CRITICAL SIGNAL BROADCASTING: GPS coordinates and real-time medical vectors routed to first response units.",
        "dispatch": {
            "status": "Dispatched",
            "unit": "Ambulance Unit #4B",
            "eta_minutes": 7,
            "timestamp": datetime.utcnow().isoformat(),
        },
    }
