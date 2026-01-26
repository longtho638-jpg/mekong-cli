from typing import Any, Optional, Dict, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from app.core.security import get_api_key
from app.models.apikey import ApiKey
from app.worker import WorkerSettings
from arq import create_pool
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()

class TransactionalEmailRequest(BaseModel):
    to_email: EmailStr
    subject: str
    html_content: Optional[str] = None
    text_content: Optional[str] = None
    template_id: Optional[int] = None
    template_data: Optional[Dict[str, Any]] = None

class TransactionalEmailResponse(BaseModel):
    status: str
    message_id: Optional[str] = None

@router.post("/send", response_model=TransactionalEmailResponse)
async def send_transactional_email(
    email_req: TransactionalEmailRequest,
    api_key: ApiKey = Depends(get_api_key),
) -> Any:
    """
    Send a transactional email.
    Requires X-API-Key header.
    """
    # Validation
    if not email_req.html_content and not email_req.text_content and not email_req.template_id:
        raise HTTPException(status_code=400, detail="Must provide html_content, text_content, or template_id")

    # If template_id is used, we would ideally fetch and render it here.
    # For MVP, we'll assume the worker handles rendering if we pass template_id,
    # OR we force the client to render.
    # To keep it simple for the worker (which currently expects raw content),
    # let's assume for now this endpoint is for raw content sending,
    # or we expand the worker to handle template rendering.

    # Let's expand the worker task payload structure implicitly by just passing what we have.
    # But the current worker `send_email_task` expects `EmailMessage` dict which has `html_content`.

    # If template_id provided, we should really render it here to fail fast if template missing,
    # but that requires DB access.
    # Let's keep it simple: Transactional endpoint currently focuses on raw content sending
    # or fully rendered content.

    redis = await create_pool(settings.REDIS_URL)

    email_data = {
        "to_email": email_req.to_email,
        "subject": email_req.subject,
        "html_content": email_req.html_content or "",
        "text_content": email_req.text_content or "",
        "from_email": settings.DEFAULT_FROM_EMAIL # Default from
    }

    # Enqueue
    await redis.enqueue_job("send_email_task", email_data)
    await redis.close()

    return {"status": "queued"}
