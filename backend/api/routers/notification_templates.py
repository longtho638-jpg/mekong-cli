from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.api.deps import get_current_user, get_db
from backend.models.notification import NotificationTemplate
from backend.models.user import User

router = APIRouter(prefix="/notifications/templates", tags=["Notifications"])

class TemplateCreate(BaseModel):
    name: str
    type: str
    subject: Optional[str] = None
    content: str
    description: Optional[str] = None
    active: bool = True

class TemplateUpdate(BaseModel):
    subject: Optional[str] = None
    content: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None

class TemplateResponse(BaseModel):
    id: str
    name: str
    type: str
    subject: Optional[str]
    content: str
    description: Optional[str]
    active: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[TemplateResponse])
async def list_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all notification templates (Admin only)."""
    # TODO: Check admin permissions
    # if not current_user.is_superuser: ...
    result = db.execute(select(NotificationTemplate).order_by(NotificationTemplate.name))
    templates = result.scalars().all()
    return [t.to_dict() for t in templates]

@router.post("/", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new notification template."""
    # Check if exists
    existing = db.execute(select(NotificationTemplate).where(NotificationTemplate.name == template.name)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Template with this name already exists")

    new_template = NotificationTemplate(
        name=template.name,
        type=template.type,
        subject=template.subject,
        content=template.content,
        description=template.description,
        active=template.active
    )
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    return new_template.to_dict()

@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a template by ID."""
    try:
        uuid_id = UUID(template_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID")

    template = db.execute(select(NotificationTemplate).where(NotificationTemplate.id == uuid_id)).scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return template.to_dict()

@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: str,
    update: TemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a template."""
    try:
        uuid_id = UUID(template_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID")

    template = db.execute(select(NotificationTemplate).where(NotificationTemplate.id == uuid_id)).scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if update.subject is not None:
        template.subject = update.subject
    if update.content is not None:
        template.content = update.content
    if update.description is not None:
        template.description = update.description
    if update.active is not None:
        template.active = update.active

    db.commit()
    db.refresh(template)
    return template.to_dict()

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a template."""
    try:
        uuid_id = UUID(template_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID")

    template = db.execute(select(NotificationTemplate).where(NotificationTemplate.id == uuid_id)).scalar_one_or_none()
    if template:
        db.delete(template)
        db.commit()

    return None
