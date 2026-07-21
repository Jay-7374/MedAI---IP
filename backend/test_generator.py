import asyncio
import json
from uuid import uuid4

async def mock_stream_chat_response(messages: list):
    yield f"data: {json.dumps({'content': 'Hello'})}\n\n"
    yield f"data: {json.dumps({'content': ' World'})}\n\n"
    yield "data: [DONE]\n\n"

async def stream_and_save_response():
    full_response = ""
    async for sse_chunk in mock_stream_chat_response([]):
        # yield sse_chunk
        if sse_chunk.startswith("data: ") and not sse_chunk.startswith("data: [DONE]"):
            try:
                data = json.loads(sse_chunk[6:].strip())
                if "content" in data:
                    full_response += data["content"]
            except json.JSONDecodeError as e:
                print("Decode error:", e, "on chunk:", repr(sse_chunk))
                
    print("Full response saved:", repr(full_response))

if __name__ == "__main__":
    asyncio.run(stream_and_save_response())
