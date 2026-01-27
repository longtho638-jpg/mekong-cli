from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class EmailMessage(BaseModel):
    to_email: str
    subject: str
    html_content: str
    text_content: Optional[str] = None
    from_email: Optional[str] = None
    from_name: Optional[str] = None
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None
    reply_to: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None

class EmailProvider(ABC):
    """Abstract base class for email providers"""

    @abstractmethod
    async def send_email(self, message: EmailMessage) -> Dict[str, Any]:
        """Send an email and return the provider's response"""
        pass

    @abstractmethod
    async def validate_config(self) -> bool:
        """Validate provider configuration"""
        pass
