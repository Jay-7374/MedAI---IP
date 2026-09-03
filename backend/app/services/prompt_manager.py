import json
from sqlalchemy.orm import Session
from ..models import PromptTemplate
from ..config import settings
from ..prompts.modes import MODES, BASE_MEDICAL_SAFETY_PROMPT

class PromptManager:
    """
    Manages system prompts for the AI Chatbot.
    Loads from the database or uses fallback defaults from MODES.
    """
    
    DEFAULT_PROMPTS = {
        mode_name: mode_data["system_prompt"]
        for mode_name, mode_data in MODES.items()
    }

    @classmethod
    def get_prompt(cls, db: Session, mode: str) -> str:
        """
        Retrieves the system prompt for a specific mode.
        First checks the PromptTemplate table, then falls back to defaults in MODES.
        Ensures BASE_MEDICAL_SAFETY_PROMPT conciseness rules are included.
        """
        template = db.query(PromptTemplate).filter(PromptTemplate.bot_name == mode).first()
        if template and template.system_prompt:
            prompt = template.system_prompt
        else:
            prompt = cls.DEFAULT_PROMPTS.get(
                mode, 
                MODES["General Assistant"]["system_prompt"]
            )
            
        if "CONCISENESS RULES" not in prompt:
            prompt += BASE_MEDICAL_SAFETY_PROMPT
            
        return prompt

