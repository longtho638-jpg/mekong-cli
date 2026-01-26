from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr

class EmailMessage(BaseModel):
    to_email: EmailStr
    subject: str
    html_content: str
    text_content: Optional[str] = None
    from_email: Optional[EmailStr] = None
    from_name: Optional[str] = None
    cc: Optional[List[EmailStr]] = None
    bcc: Optional[List[EmailStr]] = None
    reply_to: Optional[EmailStr] = None
    headers: Optional[Dict[str, str]] = None

class EmailProvider(ABC):
    """
    Abstract Base Class for Email Providers.
    All providers must implement the send_email method.
    """

    @abstractmethod
    async def send_email(self, message: EmailMessage) -> Dict[str, Any]:
        """
        Sends an email.
        Returns a dictionary containing provider-specific response details (e.g., message_id).
        Raises exceptions on failure.
        """
        pass

    @abstractmethod
    async def validate_config(self) -> bool:
        """
        Validates the provider configuration (e.g., check credentials).
        """
        pass
