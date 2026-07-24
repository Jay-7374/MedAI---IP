import json
import base64
import logging
import asyncio
from groq import Groq, AsyncGroq, RateLimitError, APIStatusError, APITimeoutError, InternalServerError, AuthenticationError
from ..config import settings

logger = logging.getLogger(__name__)

client = None
async_client = None
if settings.GROQ_API_KEY:
    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        async_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {e}")

def get_chat_response(messages: list, system_prompt: str = None, tools: list = None) -> str:
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

    models_to_try = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
        "gemma2-9b-it"
    ]

    import groq
    
    last_error = None
    for model_name in models_to_try:
        try:
            kwargs = {
                "messages": formatted_messages,
                "model": model_name,
                "temperature": 0.5,
                "max_tokens": 1024,
            }
            if tools:
                kwargs["tools"] = tools
                kwargs["tool_choice"] = "auto"
                
            chat_completion = client.chat.completions.create(**kwargs)
            message = chat_completion.choices[0].message
            if getattr(message, "tool_calls", None):
                return message
            return message.content or ""
        except groq.RateLimitError as e:
            logger.warning(f"Groq RateLimitError on {model_name}: {str(e)}")
            last_error = e
            continue
        except Exception as e:
            logger.error(f"Groq API Completion failed: {type(e).__name__} - {str(e)}")
            return "I encountered a temporary processing interruption in my AI core. Please re-send your query."
            
    # If all models failed due to rate limit
    if last_error:
        return f"[EXTERNAL_PROVIDER_ERROR] Provider: Groq, Service: chat/completions, Error: 429 RateLimitExceeded (Daily Token Limit Reached). Please upgrade tier or wait."
    
    return "I encountered a temporary processing interruption in my AI core. Please re-send your query."

async def _stream_model_chunks(messages: list, model: str, request=None):
    """
    Generator that streams a single Groq model response.
    Yields (is_content, data) tuples to help the caller track emission.
    """
    chat_completion = await async_client.chat.completions.create(
        messages=messages,
        model=model,
        temperature=0.5,
        max_tokens=2048,
        stream=True
    )
    try:
        async for chunk in chat_completion:
            if request and await request.is_disconnected():
                raise asyncio.CancelledError()
            if chunk.choices[0].delta.content is not None:
                content = chunk.choices[0].delta.content
                yield (True, f"data: {json.dumps({'content': content})}\n\n")
    except asyncio.CancelledError:
        raise
    finally:
        await chat_completion.close()
    
    yield (False, "data: [DONE]\n\n")

async def stream_chat_response(messages: list, request=None):
    """
    Query the Groq LLaMA model and stream back the response chunks using Server-Sent Events (SSE) format.
    Includes targeted fallback to openai/gpt-oss-120b if the primary model fails before the first token.
    """
    if not async_client:
        yield f"data: {json.dumps({'error': 'AI core offline. Check GROQ_API_KEY.'})}\n\n"
        return

    PRIMARY_MODEL = "llama-3.3-70b-versatile"
    FALLBACK_MODEL = "openai/gpt-oss-120b"
    
    has_emitted_content = False

    try:
        if request and await request.is_disconnected():
            raise asyncio.CancelledError()
            
        async for is_content, data in _stream_model_chunks(messages, PRIMARY_MODEL, request):
            if is_content:
                has_emitted_content = True
            yield data

    except asyncio.CancelledError:
        raise
    except AuthenticationError as e:
        logger.error(f"Primary model {PRIMARY_MODEL} authentication failed: {e}")
        yield f"data: {json.dumps({'error': 'Authentication failed. Please check your API key.'})}\n\n"
    except (RateLimitError, APIStatusError, APITimeoutError, InternalServerError) as e:
        if has_emitted_content:
            # We already started streaming, so we cannot safely fall back.
            logger.error(f"Primary model {PRIMARY_MODEL} failed mid-stream: {type(e).__name__} - {e}")
            yield f"data: {json.dumps({'error': 'The AI service was temporarily interrupted. Please try again.'})}\n\n"
            return
        
        logger.warning(f"Primary model {PRIMARY_MODEL} unavailable/rate-limited before first token; falling back to {FALLBACK_MODEL}. Error: {type(e).__name__}")
        
        # Fallback attempt
        try:
            if request and await request.is_disconnected():
                raise asyncio.CancelledError()
                
            logger.info(f"Fallback model {FALLBACK_MODEL} started successfully")
            async for is_content, data in _stream_model_chunks(messages, FALLBACK_MODEL, request):
                yield data
        except asyncio.CancelledError:
            raise
        except Exception as fallback_err:
            logger.error(f"Fallback model {FALLBACK_MODEL} also failed: {type(fallback_err).__name__} - {fallback_err}")
            yield f"data: {json.dumps({'error': 'Both primary and fallback AI services are currently busy. Please try again shortly.'})}\n\n"
    except Exception as e:
        logger.error(f"Groq API Streaming failed unexpectedly: {type(e).__name__} - {e}")
        yield f"data: {json.dumps({'error': 'Unable to generate a response right now. Please try again.'})}\n\n"

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
