import json

chunk = 'data: {"content": "hello"}\n\n'
if chunk.startswith("data: ") and not chunk.startswith("data: [DONE]"):
    try:
        data = json.loads(chunk[6:].strip())
        print(data)
    except json.JSONDecodeError as e:
        print("JSON Error:", e)
