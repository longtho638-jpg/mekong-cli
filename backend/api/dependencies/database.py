from typing import Generator

from sqlalchemy.orm import Session

from backend.db.session import SessionLocal


def get_sqlalchemy_db() -> Generator[Session, None, None]:
    """
    Dependency to get a SQLAlchemy database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

get_db = get_sqlalchemy_db
