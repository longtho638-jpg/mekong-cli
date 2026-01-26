from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
import shutil
import os
import uuid
import json
import bleach
from app.database import get_db
from app import models, schemas
from app.security import get_api_key, generate_api_key
from app.core.config import settings

router = APIRouter()

# --- API Key Management (For Admin/Setup) ---

@router.post("/api-keys", response_model=schemas.ApiKeyResponse)
async def create_api_key(key_data: schemas.ApiKeyCreate, db: AsyncSession = Depends(get_db)):
    """Generate a new API key."""
    raw_key, key_hash = generate_api_key()

    # Convert comma separated string to list if present
    allowed_domains_list = []
    if key_data.allowed_domains:
        allowed_domains_list = [d.strip() for d in key_data.allowed_domains.split(",") if d.strip()]

    db_key = models.ApiKey(
        name=key_data.name,
        key_hash=key_hash,
        allowed_domains=allowed_domains_list
    )
    db.add(db_key)
    await db.commit()
    await db.refresh(db_key)

    return schemas.ApiKeyResponse(
        key=raw_key,
        name=db_key.name
    )

# --- Feedback Endpoints ---

@router.post("/feedback", response_model=schemas.FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    type: str = Form(...),
    content: str = Form(...),
    rating: int = Form(0),
    metadata: str = Form("{}"),
    screenshot: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    api_key: models.ApiKey = Depends(get_api_key)
):
    """
    Submit feedback with optional screenshots.
    Requires a valid API key.
    """
    # 1. Sanitize Inputs (XSS Protection)
    cleaned_content = bleach.clean(content, strip=True)
    cleaned_type = bleach.clean(type, strip=True)

    # 2. Process Metadata
    try:
        metadata_dict = json.loads(metadata)
    except json.JSONDecodeError:
        metadata_dict = {}

    # 3. Create Feedback Record
    db_feedback = models.Feedback(
        type=cleaned_type,
        content=cleaned_content,
        rating=rating,
        metadata_info=metadata_dict,
        status=models.FeedbackStatus.OPEN
    )
    db.add(db_feedback)
    await db.commit()
    await db.refresh(db_feedback)

    # 4. Process Screenshot
    if screenshot:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

        allowed_types = ["image/jpeg", "image/png", "image/webp"]

        if screenshot.content_type in allowed_types:
            # Secure Filename
            file_ext = os.path.splitext(screenshot.filename)[1].lower()
            if file_ext in [".jpg", ".jpeg", ".png", ".webp"]:
                filename = f"{uuid.uuid4()}{file_ext}"
                file_path = os.path.join(settings.UPLOAD_DIR, filename)

                # Save file
                try:
                    with open(file_path, "wb") as buffer:
                        shutil.copyfileobj(screenshot.file, buffer)

                    # Update record with screenshot URL
                    db_feedback.screenshot_url = f"/static/{filename}"
                    db.add(db_feedback)
                    await db.commit()
                    await db.refresh(db_feedback)
                except Exception as e:
                    # Log error but don't fail feedback creation
                    print(f"Error saving screenshot: {e}")

    return db_feedback

@router.get("/feedback", response_model=List[schemas.FeedbackResponse])
async def list_feedback(
    skip: int = 0,
    limit: int = 50,
    type: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    api_key: models.ApiKey = Depends(get_api_key)
):
    stmt = select(models.Feedback)

    if type:
        stmt = stmt.where(models.Feedback.type == type)
    if status:
        stmt = stmt.where(models.Feedback.status == status)

    stmt = stmt.order_by(desc(models.Feedback.created_at)).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/feedback/{feedback_id}", response_model=schemas.FeedbackResponse)
async def read_feedback(
    feedback_id: int,
    db: AsyncSession = Depends(get_db),
    api_key: models.ApiKey = Depends(get_api_key)
):
    result = await db.execute(
        select(models.Feedback).where(models.Feedback.id == feedback_id)
    )
    db_feedback = result.scalar_one_or_none()

    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return db_feedback

@router.patch("/feedback/{feedback_id}", response_model=schemas.FeedbackResponse)
async def update_feedback_status(
    feedback_id: int,
    update: schemas.FeedbackUpdate,
    db: AsyncSession = Depends(get_db),
    api_key: models.ApiKey = Depends(get_api_key)
):
    result = await db.execute(
        select(models.Feedback).where(models.Feedback.id == feedback_id)
    )
    db_feedback = result.scalar_one_or_none()

    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")

    db_feedback.status = update.status
    await db.commit()
    await db.refresh(db_feedback)
    return db_feedback

@router.delete("/feedback/{feedback_id}")
async def delete_feedback(
    feedback_id: int,
    db: AsyncSession = Depends(get_db),
    api_key: models.ApiKey = Depends(get_api_key)
):
    result = await db.execute(
        select(models.Feedback).where(models.Feedback.id == feedback_id)
    )
    db_feedback = result.scalar_one_or_none()

    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")

    # Optional: Delete screenshot file
    if db_feedback.screenshot_url:
        filename = db_feedback.screenshot_url.split("/")[-1]
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass

    await db.delete(db_feedback)
    await db.commit()
    return {"ok": True}
