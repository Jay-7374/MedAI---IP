"""
Real Twilio integration for MedAI.

Replaces the previous in-memory "fake SMS log" with actual outbound SMS,
and adds real outbound voice calls so bots like PostDischargeCheckIn,
MedicationAdherence, and ElderCareTerminal can call the patient instead
of only handling inbound/browser sessions.

All functions fail "soft" (log + return None/False) instead of crashing
the request, since SMS/calls are a side-effect, not the primary response.
"""

from app.config import settings

try:
    from twilio.rest import Client
    from twilio.base.exceptions import TwilioRestException

    _TWILIO_IMPORT_OK = True
except ImportError:
    _TWILIO_IMPORT_OK = False
    TwilioRestException = Exception

_client = None


def _get_client():
    """Lazily build the Twilio REST client from env-configured credentials."""
    global _client
    if not _TWILIO_IMPORT_OK:
        return None
    if _client is not None:
        return _client
    sid = settings.TWILIO_ACCOUNT_SID
    token = settings.TWILIO_AUTH_TOKEN
    if not sid or not token:
        return None
    _client = Client(sid, token)
    return _client


def is_configured() -> bool:
    return bool(
        settings.TWILIO_ACCOUNT_SID
        and settings.TWILIO_AUTH_TOKEN
        and settings.TWILIO_PHONE_NUMBER
    )


def send_sms(to_number: str, body: str) -> dict:
    """
    Send a real SMS via Twilio. Returns a dict describing the outcome.
    On a Twilio trial account, `to_number` MUST be a Verified Caller ID,
    otherwise Twilio will reject the send with error 21608/21211.
    """
    client = _get_client()
    if not client:
        return {
            "sent": False,
            "reason": "Twilio not configured (missing SID/Auth Token).",
        }

    from_number = settings.TWILIO_PHONE_NUMBER
    if not from_number:
        return {"sent": False, "reason": "TWILIO_PHONE_NUMBER not set in .env"}

    try:
        message = client.messages.create(
            body=body,
            from_=from_number,
            to=to_number,
        )
        return {"sent": True, "sid": message.sid, "status": message.status}
    except TwilioRestException as e:
        return {
            "sent": False,
            "reason": str(e),
            "code": getattr(e, "code", None),
        }
    except Exception as e:
        return {"sent": False, "reason": str(e)}


def make_outbound_call(to_number: str, twiml_url: str) -> dict:
    """
    Place a real outbound call. `twiml_url` is the publicly reachable URL
    Twilio will fetch to get instructions for the call (what to say, and
    where to POST the patient's speech via <Gather>).

    NOTE: This requires the FastAPI server to be reachable from the public
    internet (e.g. via a tunnel like ngrok during dev, or your real deployed
    domain in production) since Twilio's servers must be able to reach
    `twiml_url` and the action callback URL.
    """
    client = _get_client()
    if not client:
        return {
            "called": False,
            "reason": "Twilio not configured (missing SID/Auth Token).",
        }

    from_number = settings.TWILIO_PHONE_NUMBER
    if not from_number:
        return {
            "called": False,
            "reason": "TWILIO_PHONE_NUMBER not set in .env",
        }

    try:
        call = client.calls.create(
            url=twiml_url,
            to=to_number,
            from_=from_number,
        )
        return {"called": True, "sid": call.sid, "status": call.status}
    except TwilioRestException as e:
        return {
            "called": False,
            "reason": str(e),
            "code": getattr(e, "code", None),
        }
    except Exception as e:
        return {"called": False, "reason": str(e)}
