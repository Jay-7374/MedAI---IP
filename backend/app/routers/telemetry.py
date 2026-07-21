from fastapi import APIRouter
import random

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])

@router.get("", summary="Get live patient vitals")
def get_telemetry():
    heartrate = random.randint(70, 78)
    spo2 = random.randint(97, 99)
    return {
        "heartrate": heartrate,
        "spo2": spo2,
        "blood_pressure": "120/80",
        "temperature": "36.7",
    }
