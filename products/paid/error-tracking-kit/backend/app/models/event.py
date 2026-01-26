from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"))

    # Raw details
    message = Column(String)
    stack_trace = Column(JSON) # List of frames
    context = Column(JSON) # User, tags, breadcrumbs

    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    issue = relationship("Issue", back_populates="events")
