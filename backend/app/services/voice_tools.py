import json
from datetime import date, datetime, time
from sqlalchemy.orm import Session
from app import models

# 1. Tool Schemas (for Groq)
VOICE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_profile",
            "description": "Get the logged-in patient's profile details including age, blood group, allergies, etc.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_profile",
            "description": "Update specific fields in the patient's profile.",
            "parameters": {
                "type": "object",
                "properties": {
                    "field": {
                        "type": "string",
                        "description": "The field to update (e.g., 'weight', 'height', 'emergency_contact_name', 'emergency_phone', 'allergies')"
                    },
                    "value": {
                        "type": "string",
                        "description": "The new value for the field"
                    }
                },
                "required": ["field", "value"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_medicines",
            "description": "Get the list of all medicines the patient is currently taking.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_medicine",
            "description": "Add a new medicine to the patient's list.",
            "parameters": {
                "type": "object",
                "properties": {
                    "medicine_name": {"type": "string"},
                    "dosage": {"type": "string", "description": "e.g., 500mg"},
                    "frequency": {"type": "string", "description": "e.g., Once daily, Twice daily"},
                    "time": {"type": "string", "description": "e.g., 09:00, 21:00"},
                    "before_after_food": {"type": "string", "description": "e.g., After food, Before food"}
                },
                "required": ["medicine_name", "dosage", "frequency"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_medicine",
            "description": "Delete a medicine from the patient's list by its name.",
            "parameters": {
                "type": "object",
                "properties": {
                    "medicine_name": {"type": "string", "description": "The name of the medicine to delete"}
                },
                "required": ["medicine_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_appointments",
            "description": "Get the patient's scheduled appointments.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "book_appointment",
            "description": "Book a new appointment.",
            "parameters": {
                "type": "object",
                "properties": {
                    "doctor_name": {"type": "string", "description": "Name or specialty of the doctor"},
                    "date": {"type": "string", "description": "YYYY-MM-DD"},
                    "time": {"type": "string", "description": "HH:MM"},
                    "symptoms": {"type": "string", "description": "Brief description of the symptoms or reason"}
                },
                "required": ["doctor_name", "date", "time"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_appointment",
            "description": "Cancel an appointment by ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "appointment_id": {"type": "integer"}
                },
                "required": ["appointment_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "trigger_emergency",
            "description": "Triggers the emergency SOS workflow in the user's UI.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "navigate",
            "description": "Navigate the user's UI to a specific page.",
            "parameters": {
                "type": "object",
                "properties": {
                    "page": {
                        "type": "string",
                        "enum": ["dashboard", "medicines", "appointments", "settings", "emergency", "ai-assistant"]
                    }
                },
                "required": ["page"]
            }
        }
    }
]


# 2. Tool Implementations
def execute_tool(db: Session, user_id: int, function_name: str, args: dict, ws_actions: list) -> str:
    """Executes the mapped function and returns the JSON string result to pass back to the LLM."""
    try:
        patient = db.query(models.Patient).filter(models.Patient.user_id == user_id).first()
        if not patient:
            return json.dumps({"error": "Patient profile not found."})

        if function_name == "get_profile":
            return json.dumps({
                "full_name": patient.full_name,
                "age": patient.age,
                "gender": patient.gender,
                "blood_group": patient.blood_group,
                "weight": patient.weight,
                "height": patient.height,
                "allergies": patient.allergies,
                "medical_conditions": patient.medical_conditions,
                "emergency_contact": patient.emergency_contact_name,
                "emergency_phone": patient.emergency_phone
            })

        elif function_name == "update_profile":
            field = args.get("field")
            val = args.get("value")
            if hasattr(patient, field):
                setattr(patient, field, val)
                db.commit()
                ws_actions.append({"type": "action", "action": "refresh_data"})
                return json.dumps({"success": True, "message": f"{field} updated to {val}."})
            return json.dumps({"error": f"Invalid field: {field}"})

        elif function_name == "get_medicines":
            medicines = db.query(models.Medicine).filter(models.Medicine.user_id == user_id).all()
            return json.dumps([{"id": m.id, "name": m.medicine_name, "dosage": m.dosage, "freq": m.frequency, "time": str(m.time) if m.time else None} for m in medicines])

        elif function_name == "add_medicine":
            time_str = args.get("time")
            parsed_time = None
            if time_str:
                try:
                    h, m = map(int, time_str.split(':')[:2])
                    parsed_time = time(h, m)
                except:
                    pass
            
            med = models.Medicine(
                user_id=user_id,
                medicine_name=args.get("medicine_name"),
                dosage=args.get("dosage"),
                frequency=args.get("frequency"),
                time=parsed_time,
                before_after_food=args.get("before_after_food")
            )
            db.add(med)
            db.commit()
            ws_actions.append({"type": "action", "action": "refresh_data"})
            return json.dumps({"success": True, "message": "Medicine added successfully."})

        elif function_name == "delete_medicine":
            med_name = args.get("medicine_name", "").lower()
            medicines = db.query(models.Medicine).filter(models.Medicine.user_id == user_id).all()
            for m in medicines:
                if med_name in m.medicine_name.lower():
                    db.delete(m)
                    db.commit()
                    ws_actions.append({"type": "action", "action": "refresh_data"})
                    return json.dumps({"success": True, "message": f"Deleted {m.medicine_name}."})
            return json.dumps({"error": "Medicine not found."})

        elif function_name == "get_appointments":
            appts = db.query(models.Appointment).filter(models.Appointment.patient_id == patient.id).all()
            return json.dumps([{"id": a.id, "doctor": a.doctor_name, "date": str(a.date), "time": str(a.time), "status": a.status} for a in appts])

        elif function_name == "book_appointment":
            dt_str = args.get("date")
            tm_str = args.get("time")
            try:
                dt = date.fromisoformat(dt_str)
                h, m = map(int, tm_str.split(':')[:2])
                tm = time(h, m)
            except:
                return json.dumps({"error": "Invalid date or time format. Use YYYY-MM-DD and HH:MM."})
                
            appt = models.Appointment(
                patient_id=patient.id,
                doctor_name=args.get("doctor_name"),
                date=dt,
                time=tm,
                symptoms=args.get("symptoms", ""),
                status="Scheduled"
            )
            db.add(appt)
            db.commit()
            ws_actions.append({"type": "action", "action": "refresh_data"})
            return json.dumps({"success": True, "message": "Appointment booked successfully."})

        elif function_name == "cancel_appointment":
            appt_id = args.get("appointment_id")
            appt = db.query(models.Appointment).filter(models.Appointment.id == appt_id, models.Appointment.patient_id == patient.id).first()
            if appt:
                appt.status = "Cancelled"
                db.commit()
                ws_actions.append({"type": "action", "action": "refresh_data"})
                return json.dumps({"success": True, "message": "Appointment cancelled."})
            return json.dumps({"error": "Appointment not found."})

        elif function_name == "trigger_emergency":
            ws_actions.append({"type": "action", "action": "navigate", "target": "emergency"})
            return json.dumps({"success": True, "message": "Emergency workflow triggered in UI."})

        elif function_name == "navigate":
            ws_actions.append({"type": "action", "action": "navigate", "target": args.get("page")})
            return json.dumps({"success": True, "message": f"Navigating to {args.get('page')}"})

        else:
            return json.dumps({"error": f"Unknown function: {function_name}"})

    except Exception as e:
        return json.dumps({"error": str(e)})
