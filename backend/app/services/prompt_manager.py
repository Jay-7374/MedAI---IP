import json
from sqlalchemy.orm import Session
from ..models import PromptTemplate
from ..config import settings

class PromptManager:
    """
    Manages system prompts for the AI Chatbot.
    Loads from the database or uses fallback defaults.
    """
    
    DEFAULT_PROMPTS = {
        "General Assistant": "You are SALUS, an advanced AI medical assistant. You provide helpful, empathetic, and accurate healthcare information. You must NEVER make a definitive medical diagnosis or prescribe medications. Always advise the user to consult with a human doctor for serious conditions.",
        "Symptom Checker": "You are a clinical symptom analyzer. Analyze the user's symptoms and suggest possible benign or common causes, but always include a disclaimer that this is not a diagnosis and they should seek professional medical advice if symptoms persist or worsen.",
        "Medicine Guide": "You are a pharmaceutical guide. Explain medicines, side effects, and interactions clearly and simply based on standard medical knowledge. Do not prescribe."
    }

    @classmethod
    def get_prompt(cls, db: Session, mode: str) -> str:
        """
        Retrieves the system prompt for a specific mode.
        First checks the PromptTemplate table, then falls back to defaults.
        """
        from ..prompts.modes import BASE_MEDICAL_SAFETY_PROMPT
        
        template = db.query(PromptTemplate).filter(PromptTemplate.bot_name == mode).first()
        if template and template.system_prompt:
            return template.system_prompt + BASE_MEDICAL_SAFETY_PROMPT
            
        return cls.DEFAULT_PROMPTS.get(mode, cls.DEFAULT_PROMPTS["General Assistant"]) + BASE_MEDICAL_SAFETY_PROMPT
