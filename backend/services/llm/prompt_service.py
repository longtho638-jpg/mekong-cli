from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.api.schemas.prompt import PromptCreate, PromptUpdate
from backend.models.prompt import Prompt


class PromptService:
    def get_prompt_by_slug(self, db: Session, slug: str) -> Optional[Prompt]:
        return db.query(Prompt).filter(Prompt.slug == slug, Prompt.is_active).first()

    def list_prompts(self, db: Session, skip: int = 0, limit: int = 100) -> List[Prompt]:
        return db.query(Prompt).offset(skip).limit(limit).all()

    def create_prompt(self, db: Session, prompt_in: PromptCreate) -> Prompt:
        db_prompt = Prompt(
            name=prompt_in.name,
            slug=prompt_in.slug,
            description=prompt_in.description,
            content=prompt_in.content,
            input_variables=str(prompt_in.input_variables) if prompt_in.input_variables else "[]",
            is_active=prompt_in.is_active,
        )
        try:
            db.add(db_prompt)
            db.commit()
            db.refresh(db_prompt)
            return db_prompt
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Prompt with this slug already exists")

    def update_prompt(self, db: Session, prompt_id: int, prompt_in: PromptUpdate) -> Prompt:
        db_prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not db_prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")

        update_data = prompt_in.dict(exclude_unset=True)
        if "input_variables" in update_data and update_data["input_variables"] is not None:
            update_data["input_variables"] = str(update_data["input_variables"])

        for field, value in update_data.items():
            setattr(db_prompt, field, value)

        db_prompt.version += 1  # Auto-increment version

        db.add(db_prompt)
        db.commit()
        db.refresh(db_prompt)
        return db_prompt

    def delete_prompt(self, db: Session, prompt_id: int) -> bool:
        db_prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not db_prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")

        db.delete(db_prompt)
        db.commit()
        return True


prompt_service = PromptService()
