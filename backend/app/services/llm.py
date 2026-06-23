from groq import Groq
from ..config import settings

client = None
if settings.GROQ_API_KEY:
    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
    except Exception as e:
        print(f"Failed to initialize Groq client: {e}")


def get_chat_response(messages: list, system_prompt: str = None) -> str:
    """
    Query the Groq LLaMA model for a response based on the conversation log history.
    """
    if not client:
        return "I apologize, but my conversational engine is currently offline. Please verify that your GROQ_API_KEY is correct in your configuration."

    formatted_messages = []
    if system_prompt:
        formatted_messages.append({"role": "system", "content": system_prompt})

    # Append conversation log history
    formatted_messages.extend(messages)

    try:
        # llama-3.3-70b: much better clinical reasoning, still low latency on Groq
        chat_completion = client.chat.completions.create(
            messages=formatted_messages,
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_tokens=300,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Groq API Completion failed: {e}")
        return "I encountered a temporary processing interruption in my AI core. Please re-send your query."
