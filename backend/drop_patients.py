import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("DROP TABLE IF EXISTS patients CASCADE;"))
    conn.commit()
    print("Dropped patients table")
