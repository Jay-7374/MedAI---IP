import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import engine
from sqlalchemy import text

def check_documents():
    with engine.connect() as conn:
        print("--- chatbot_documents ---")
        result = conn.execute(text("SELECT filename, extracted_text, summary, processing_status FROM chatbot_documents ORDER BY uploaded_at DESC LIMIT 2;"))
        for row in result:
            print(f"Filename: {row[0]}")
            print(f"Status: {row[3]}")
            print(f"Summary: {row[2]}")
            print(f"Extracted Text Snippet: {row[1][:100]}...")
            print("-" * 20)

if __name__ == "__main__":
    check_documents()
