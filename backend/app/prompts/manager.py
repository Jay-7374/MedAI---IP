from .modes import MODES

class PromptManager:
    @staticmethod
    def get_prompt(mode: str) -> str:
        """
        Retrieves the system prompt for a specific healthcare mode.
        Falls back to 'General Assistant' if the mode is not found.
        """
        mode_data = MODES.get(mode, MODES.get("General Assistant"))
        return mode_data.get("system_prompt", "")
    
    @staticmethod
    def get_available_modes() -> list[str]:
        """Returns a list of all available healthcare modes."""
        return list(MODES.keys())

prompt_manager = PromptManager()
