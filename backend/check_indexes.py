import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import engine
from sqlalchemy import text

def check_indexes():
    with engine.connect() as conn:
        print("--- chatbot_sessions indexes ---")
        result = conn.execute(text("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'chatbot_sessions';"))
        for row in result:
            print(f"{row[0]}: {row[1]}")
            
        print("\n--- chatbot_messages indexes ---")
        result = conn.execute(text("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'chatbot_messages';"))
        for row in result:
            print(f"{row[0]}: {row[1]}")

if __name__ == "__main__":
    check_indexes()
