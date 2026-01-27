from sqlalchemy import Column, Integer, String, Boolean
from .database import Base

class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, nullable=False)
    theme = Column(String, default="system")
    language = Column(String, default="en")
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    profile_visibility = Column(String, default="public")
