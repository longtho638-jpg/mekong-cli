from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum

class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True) # Global kill switch

    # Rules can be stored as JSON for simplicity in this kit
    # Structure: [{"environment": "prod", "enabled": true, "rules": [...]}]
    targeting_rules = Column(JSON, default=list)

    def __repr__(self):
        return f"<FeatureFlag(key={self.key})>"
