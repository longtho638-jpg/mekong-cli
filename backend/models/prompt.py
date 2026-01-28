from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from backend.db.base import Base


class Prompt(Base):
    """
    Model for storing AI System Prompts and Templates.
    Allows dynamic management of prompts without code changes.
    """
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    input_variables = Column(String, nullable=True) # JSON list of strings e.g. ["topic", "tone"]
    is_active = Column(Boolean, default=True)
    version = Column(Integer, default=1)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Prompt(name={self.name}, slug={self.slug})>"
