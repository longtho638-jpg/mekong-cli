from fastapi import APIRouter, HTTPException
from app.services.memory import MemoryService
from typing import List
from app.models.chat import Message

router = APIRouter()
memory_service = MemoryService()

@router.get("/{conversation_id}", response_model=List[Message])
async def get_history(conversation_id: str):
    """Get chat history for a specific conversation"""
    return await memory_service.get_history(conversation_id)

@router.delete("/{conversation_id}")
async def clear_history(conversation_id: str):
    """Clear chat history"""
    await memory_service.clear_history(conversation_id)
    return {"message": "History cleared"}
