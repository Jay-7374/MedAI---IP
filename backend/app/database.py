from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

# Format Supabase/PostgreSQL connection strings for psycopg3.
db_url = settings.DATABASE_URL
if not db_url:
    raise RuntimeError(
        "DATABASE_URL is required. Set it to your Supabase PostgreSQL connection string."
    )

normalized_db_url = db_url.lower()
if normalized_db_url.startswith("sqlite"):
    raise RuntimeError("SQLite is disabled. Use the Supabase DATABASE_URL for all environments.")
if not normalized_db_url.startswith(("postgresql://", "postgresql+psycopg://")):
    raise RuntimeError("DATABASE_URL must be a Supabase/PostgreSQL connection string.")

if "supabase.co" in normalized_db_url and "sslmode=" not in normalized_db_url:
    db_url = f"{db_url}{'&' if '?' in db_url else '?'}sslmode=require"

if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

try:
    engine = create_engine(db_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    print(f"Database engine creation failed: {e}")
    engine = None
    SessionLocal = None

Base = declarative_base()


def get_db():
    if SessionLocal is None:
        raise Exception("Database session maker is not initialized.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
