from enum import Enum
from typing import List, Optional, Any
from pydantic import BaseModel, Field
import time

class Role(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class LLMProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"

class Message(BaseModel):
    role: Role
    content: str
    timestamp: float = Field(default_factory=time.time)

class ChatRequest(BaseModel):
    messages: List[Message]
    provider: LLMProvider = LLMProvider.OPENAI
    model: str = "gpt-4-turbo"
    temperature: float = 0.7
    stream: bool = True
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    content: str
    role: Role = Role.ASSISTANT
    usage: Optional[dict] = None
