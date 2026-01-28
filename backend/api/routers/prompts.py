from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.api.deps import get_db
from backend.api.auth.dependencies import get_current_active_superuser
from backend.services.llm.prompt_service import prompt_service
from backend.api.schemas.prompt import PromptCreate, PromptUpdate, PromptResponse

router = APIRouter(prefix="/prompts", tags=["AI/Prompts"])

@router.get("/", response_model=List[PromptResponse], dependencies=[Depends(get_current_active_superuser)])
def list_prompts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    List all system prompts.
    """
    return prompt_service.list_prompts(db, skip=skip, limit=limit)

@router.get("/{slug}", response_model=PromptResponse, dependencies=[Depends(get_current_active_superuser)])
def get_prompt(
    slug: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific prompt by slug.
    """
    prompt = prompt_service.get_prompt_by_slug(db, slug)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return prompt

@router.post("/", response_model=PromptResponse, dependencies=[Depends(get_current_active_superuser)])
def create_prompt(
    prompt_in: PromptCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new system prompt.
    """
    return prompt_service.create_prompt(db, prompt_in)

@router.put("/{prompt_id}", response_model=PromptResponse, dependencies=[Depends(get_current_active_superuser)])
def update_prompt(
    prompt_id: int,
    prompt_in: PromptUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing prompt.
    """
    return prompt_service.update_prompt(db, prompt_id, prompt_in)

@router.delete("/{prompt_id}", response_model=bool, dependencies=[Depends(get_current_active_superuser)])
def delete_prompt(
    prompt_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a prompt.
    """
    return prompt_service.delete_prompt(db, prompt_id)
