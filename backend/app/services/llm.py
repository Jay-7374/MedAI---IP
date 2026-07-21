import json
import base64
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

async def stream_chat_response(messages: list):
    """
    Query the Groq LLaMA model and stream back the response chunks using Server-Sent Events (SSE) format.
    """
    if not client:
        yield f"data: {json.dumps({'error': 'AI core offline. Check GROQ_API_KEY.'})}\\n\\n"
        return

    try:
        chat_completion = client.chat.completions.create(
            messages=messages,
            model=settings.TEXT_MODEL,
            temperature=0.5,
            max_tokens=2048,
            stream=True
        )
        for chunk in chat_completion:
            if chunk.choices[0].delta.content is not None:
                content = chunk.choices[0].delta.content
                yield f"data: {json.dumps({'content': content})}\\n\\n"
        
        # Signal completion
        yield "data: [DONE]\\n\\n"
    except Exception as e:
        print(f"Groq API Streaming failed: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\\n\\n"

def analyze_image(image_path: str, prompt: str = "Extract all medical text and telemetry from this image.") -> str:
    """
    Sends an image to the Groq Vision model for analysis and returns the summary/extracted text.
    """
    if not client:
        return "Error: AI core offline."
    
    try:
        with open(image_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')
        
        vision_messages = [{"role": "user", "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
        ]}]
        
        response = client.chat.completions.create(
            model=settings.VISION_MODEL,
            messages=vision_messages, 
            max_tokens=1024, 
            temperature=0.5
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Vision API failed: {e}")
        return f"Error analyzing image: {str(e)}"
