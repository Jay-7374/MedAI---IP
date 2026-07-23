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
            conn.rollback()
            if "already exists" in str(e):
                print("Column summarized_until already exists.")
            else:
                print(f"Error adding column: {e}")
                
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_chatbot_sessions_user_id_updated_at ON chatbot_sessions (user_id, updated_at DESC);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_chatbot_messages_session_id_timestamp ON chatbot_messages (session_id, timestamp ASC);"))
            conn.commit()
            print("Successfully created indexes on chatbot_sessions and chatbot_messages")
        except Exception as e:
            print(f"Error creating indexes: {e}")

if __name__ == "__main__":
    run_migration()
