from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.sql import func
from app.db.session import get_db
from app.models.project import Project
from app.models.issue import Issue, IssueStatus
from app.models.event import Event
from app.schemas.envelope import EventPayload
import hashlib
import json

router = APIRouter()

async def get_project_by_key(
    api_key: str = Query(..., alias="dsn", description="Project API Key (DSN)"),
    db: AsyncSession = Depends(get_db)
) -> Project:
    result = await db.execute(select(Project).where(Project.api_key == api_key))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=403, detail="Invalid DSN")
    return project

def compute_fingerprint(payload: EventPayload) -> str:
    # 1. Custom fingerprint overrides everything
    # (Note: In a full implementation, we'd check if payload has a 'fingerprint' field,
    # but our simple schema currently puts everything in 'exception')

    # 2. Default: Type + Value + Top Stack Frame
    components = [payload.exception.type, payload.exception.value]

    if payload.exception.stacktrace and len(payload.exception.stacktrace) > 0:
        top_frame = payload.exception.stacktrace[0]
        components.append(f"{top_frame.filename}:{top_frame.function}")

    fingerprint_str = "|".join(components)
    return hashlib.md5(fingerprint_str.encode("utf-8")).hexdigest()

@router.post("/")
async def ingest_envelope(
    payload: EventPayload,
    project: Project = Depends(get_project_by_key),
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest an error event.
    """
    fingerprint = compute_fingerprint(payload)

    # 1. Find or Create Issue
    result = await db.execute(
        select(Issue).where(
            Issue.project_id == project.id,
            Issue.fingerprint == fingerprint
        )
    )
    issue = result.scalars().first()

    if not issue:
        # Create new issue
        issue = Issue(
            project_id=project.id,
            title=f"{payload.exception.type}: {payload.exception.value}",
            fingerprint=fingerprint,
            status=IssueStatus.ACTIVE.value
        )
        db.add(issue)
        await db.commit()
        await db.refresh(issue)
    else:
        # Update existing issue
        issue.count += 1
        issue.last_seen = func.now() # handled by DB trigger/default usually, but explicit here good
        # If resolved, maybe reopen? For now, let's leave as is or simple reopen logic
        if issue.status == IssueStatus.RESOLVED.value:
             issue.status = IssueStatus.ACTIVE.value

        db.add(issue) # Mark for update

    # 2. Create Event
    event = Event(
        issue_id=issue.id,
        message=payload.exception.value,
        stack_trace=json.loads(json.dumps([frame.model_dump() for frame in (payload.exception.stacktrace or [])])),
        context={
            "request": payload.request.model_dump() if payload.request else None,
            "user": payload.user.model_dump() if payload.user else None,
            "tags": payload.tags,
            "breadcrumbs": [b.model_dump() for b in payload.breadcrumbs]
        }
    )

    db.add(event)
    await db.commit()

    return {"id": event.id}
