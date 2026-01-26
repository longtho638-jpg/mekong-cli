from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.issue import Issue
from app.models.event import Event
from app.schemas.issue import IssueResponse, EventResponse
from typing import List

router = APIRouter()

@router.get("/{issue_id}", response_model=IssueResponse)
async def get_issue(issue_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalars().first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@router.get("/{issue_id}/events", response_model=List[EventResponse])
async def list_issue_events(issue_id: int, db: AsyncSession = Depends(get_db)):
    # Verify issue exists
    await get_issue(issue_id, db)

    result = await db.execute(
        select(Event)
        .where(Event.issue_id == issue_id)
        .order_by(Event.timestamp.desc())
        .limit(50) # Limit to last 50 events for now
    )
    return result.scalars().all()
