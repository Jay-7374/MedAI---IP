from app.config import settings

try:
    from twilio.rest import Client as TwilioClient
    _TWILIO_IMPORT_OK = True
except ImportError:
    _TWILIO_IMPORT_OK = False

_client = None


def _get_client():
    global _client
    if not _TWILIO_IMPORT_OK:
        return None
    if _client is not None:
        return _client
    sid = settings.TWILIO_ACCOUNT_SID
    token = settings.TWILIO_AUTH_TOKEN
    if not sid or not token:
        return None
    _client = TwilioClient(sid, token)
    return _client


def is_configured() -> bool:
    return bool(
        getattr(settings, "TWILIO_ACCOUNT_SID", None)
        and getattr(settings, "TWILIO_AUTH_TOKEN", None)
        and getattr(settings, "TWILIO_PHONE_NUMBER", None)
    )


def send_sms(to_number: str, body: str) -> dict:
    client = _get_client()
    if not client:
        return {"sent": False, "reason": "Twilio not configured."}

    from_number = getattr(settings, "TWILIO_PHONE_NUMBER", None)
    if not from_number:
        return {"sent": False, "reason": "TWILIO_PHONE_NUMBER not set."}

    try:
        message = client.messages.create(
            body=body,
            from_=from_number,
            to=to_number,
        )
        return {"sent": True, "sid": message.sid, "status": message.status}
    except Exception as e:
        return {"sent": False, "reason": str(e)}


def make_outbound_call(to_number: str, twiml_url: str) -> dict:
    client = _get_client()
    if not client:
        return {"called": False, "reason": "Twilio not configured."}

    from_number = getattr(settings, "TWILIO_PHONE_NUMBER", None)
    if not from_number:
        return {"called": False, "reason": "TWILIO_PHONE_NUMBER not set."}

    try:
        call = client.calls.create(
            url=twiml_url,
            to=to_number,
            from_=from_number,
            method="POST",
        )
        return {"called": True, "sid": call.sid, "status": call.status}
    except Exception as e:
        return {"called": False, "reason": str(e)}
