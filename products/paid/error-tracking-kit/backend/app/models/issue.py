from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.session import Base

class IssueStatus(str, enum.Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    IGNORED = "ignored"

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    title = Column(String, index=True)
    fingerprint = Column(String, index=True) # Hash of the error to group them
    status = Column(String, default=IssueStatus.ACTIVE.value)

    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    count = Column(Integer, default=1)

    project = relationship("Project", back_populates="issues")
    events = relationship("Event", back_populates="issue")
