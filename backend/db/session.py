from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.api.config import settings

# Determine if we are using SQLite (default) or Postgres
is_sqlite = settings.database_url.startswith("sqlite")

connect_args = {}
if is_sqlite:
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
