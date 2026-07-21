import httpx
import asyncio

async def test_chatbot():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000", timeout=30.0) as client:
        # Create session
        res = await client.post("/chatbot/sessions", json={"title": "Test Chat", "language": "English", "mode": "General Assistant"})
        print("Create Session:", res.status_code)
        session_id = res.json()["id"]

        # Chat stream
        print(f"Streaming chat to session {session_id}...")
        async with client.stream("POST", f"/chatbot/sessions/{session_id}/chat", json={"role": "user", "content": "Hi, who are you?"}) as response:
            async for chunk in response.aiter_text():
                print(chunk, end="")
        print("\n\nStream finished. Checking messages...")

        # Get messages
        res = await client.get(f"/chatbot/sessions/{session_id}/messages")
        messages = res.json()
        print("Messages count:", len(messages))
        for m in messages:
            print(f"[{m['role']}] {repr(m['content'])}")

if __name__ == "__main__":
    asyncio.run(test_chatbot())
