from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class SessionEvent(Base):
    __tablename__ = "session_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"))

    # Store events as a JSON string or compressed blob.
    # For SQLite/Postgres simple usage, Text is fine.
    # In a real high-scale system, this might be blob storage (S3).
    events_blob = Column(Text)

    sequence_index = Column(Integer) # To order chunks if sent in parts

    session = relationship("Session", back_populates="events")
