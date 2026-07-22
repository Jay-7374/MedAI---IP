import asyncio
from app.services.llm import stream_chat_response
import app.services.llm as llm

async def mock_stream_chunks(messages, model):
    if model == 'llama-3.3-70b-versatile':
        from groq import RateLimitError
        import httpx
        raise RateLimitError('Rate limited', response=httpx.Response(429, request=httpx.Request('GET', 'http://127.0.0.1')), body=None)
    else:
        yield (True, 'data: {"content": "Mock GPT-OSS response"}\n\n')
        yield (False, 'data: [DONE]\n\n')

llm._stream_model_chunks = mock_stream_chunks

async def test():
    messages = [{'role': 'user', 'content': 'Hello'}]
    async for chunk in llm.stream_chat_response(messages):
        print(chunk.strip())

if __name__ == '__main__':
    asyncio.run(test())
