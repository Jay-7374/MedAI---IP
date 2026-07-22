import asyncio
import os
from app.services.llm import stream_chat_response
from app.config import settings

async def test():
    messages = [{'role': 'user', 'content': 'Now summarize that explanation in 5 points.'}]
    async for chunk in stream_chat_response(messages):
        print(chunk.strip())

if __name__ == '__main__':
    asyncio.run(test())
