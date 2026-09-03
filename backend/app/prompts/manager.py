from .modes import MODES, BASE_MEDICAL_SAFETY_PROMPT

class PromptManager:
    @staticmethod
    def get_prompt(mode: str) -> str:
        """
        Retrieves the system prompt for a specific healthcare mode.
        Falls back to 'General Assistant' if the mode is not found.
        """
        mode_data = MODES.get(mode, MODES.get("General Assistant"))
        prompt = mode_data.get("system_prompt", "")
        if "CONCISENESS RULES" not in prompt:
            prompt += BASE_MEDICAL_SAFETY_PROMPT
        return prompt
    
    @staticmethod
    def get_available_modes() -> list[str]:
        """Returns a list of all available healthcare modes."""
        return list(MODES.keys())

prompt_manager = PromptManager()

