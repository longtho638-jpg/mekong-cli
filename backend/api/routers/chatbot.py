from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.api.auth.dependencies import get_current_user
from backend.services.llm.prompts import PromptTemplates
from backend.services.llm.service import LLMService

router = APIRouter(prefix="/chatbot", tags=["AI/Chatbot"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    provider: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000

class ChatResponse(BaseModel):
    response: str
    provider: str
    model: str

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    current_user = Depends(get_current_user)
):
    """
    Chat endpoint for logged-in users.
    Maintains conversation context via the client.
    """
    try:
        service = LLMService()

        # Convert Pydantic models to dicts
        messages_dicts = [{"role": m.role, "content": m.content} for m in request.messages]

        # Ensure system prompt is present if needed, or let the client handle it.
        # Ideally, we inject a system prompt if it's the start of a conversation,
        # but here we rely on the messages list.

        # If no messages, return error
        if not messages_dicts:
             raise HTTPException(status_code=400, detail="No messages provided")

        # Inject default system prompt if not present?
        # For flexible chatbots, maybe not. But for "Agency OS assistant", we might want to.
        # Let's check if the first message is system.
        if messages_dicts[0]["role"] != "system":
            # Prepend default system prompt
            messages_dicts.insert(0, {"role": "system", "content": PromptTemplates.CHATBOT_SYSTEM.value})

        result = await service.chat(
            messages=messages_dicts,
            provider=request.provider,
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )

        return ChatResponse(
            response=result,
            provider=request.provider or "default",
            model=request.model or "default"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
