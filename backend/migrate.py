import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import engine
from sqlalchemy import text

def run_migration():
    if not engine:
        print("Database engine not initialized")
        return
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE chatbot_sessions ADD COLUMN summarized_until TIMESTAMP NULL;"))
            conn.commit()
            print("Successfully added summarized_until column")
        except Exception as e:
            if "already exists" in str(e):
                print("Column summarized_until already exists.")
            else:
                print(f"Error adding column: {e}")

if __name__ == "__main__":
    run_migration()
