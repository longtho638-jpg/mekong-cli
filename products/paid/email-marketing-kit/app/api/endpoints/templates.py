from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.template import EmailTemplate
from app.schemas.template import Template, TemplateCreate, TemplateUpdate, TemplatePreview
from app.services.template import template_service

router = APIRouter()

@router.post("/", response_model=Template)
async def create_template(
    *,
    db: AsyncSession = Depends(get_db),
    template_in: TemplateCreate,
) -> Any:
    """
    Create a new email template.
    """
    # Check if name exists
    stmt = select(EmailTemplate).where(EmailTemplate.name == template_in.name)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template with this name already exists",
        )

    # Process content
    final_html = template_in.body_html
    if template_in.body_mjml:
        try:
            final_html = template_service.compile_mjml(template_in.body_mjml)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"MJML compilation failed: {e}")

    # Auto-generate text if missing and HTML exists
    final_text = template_in.body_text
    if not final_text and final_html:
        final_text = template_service.html_to_text(final_html)

    db_obj = EmailTemplate(
        name=template_in.name,
        subject=template_in.subject,
        body_html=final_html,
        body_text=final_text,
        body_mjml=template_in.body_mjml,
        variables_schema=template_in.variables_schema,
    )

    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.get("/", response_model=List[Template])
async def read_templates(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve templates.
    """
    stmt = select(EmailTemplate).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{template_id}", response_model=Template)
async def read_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get template by ID.
    """
    db_obj = await db.get(EmailTemplate, template_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Template not found")
    return db_obj

@router.put("/{template_id}", response_model=Template)
async def update_template(
    *,
    db: AsyncSession = Depends(get_db),
    template_id: int,
    template_in: TemplateUpdate,
) -> Any:
    """
    Update a template.
    """
    db_obj = await db.get(EmailTemplate, template_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Template not found")

    update_data = template_in.model_dump(exclude_unset=True)

    # Re-compile MJML if changed
    if "body_mjml" in update_data and update_data["body_mjml"]:
        update_data["body_html"] = template_service.compile_mjml(update_data["body_mjml"])

    # Re-gen text if HTML changed and text not explicitly provided in this update
    if "body_html" in update_data and "body_text" not in update_data:
        update_data["body_text"] = template_service.html_to_text(update_data["body_html"])

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.post("/{template_id}/preview", response_model=TemplatePreview)
async def preview_template(
    *,
    db: AsyncSession = Depends(get_db),
    template_id: int,
    context: Dict[str, Any],
) -> Any:
    """
    Preview a template with provided context variables.
    """
    db_obj = await db.get(EmailTemplate, template_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Template not found")

    try:
        subject = template_service.render(db_obj.subject or "", context)
        html = template_service.render(db_obj.body_html or "", context)
        text = template_service.render(db_obj.body_text or "", context)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return TemplatePreview(
        subject=subject,
        html=html,
        text=text
    )
