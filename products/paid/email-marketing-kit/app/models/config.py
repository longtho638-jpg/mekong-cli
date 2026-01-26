from typing import Optional
from sqlalchemy import String, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class Configuration(Base):
    """
    Dynamic system configuration stored in the database.
    Allows changing settings without redeploying.
    """
    __tablename__ = "configurations"

    key: Mapped[str] = mapped_column(String(255), primary_key=True, index=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_secret: Mapped[bool] = mapped_column(Boolean, default=False)

    def __repr__(self) -> str:
        return f"<Configuration {self.key}=***>" if self.is_secret else f"<Configuration {self.key}={self.value}>"
