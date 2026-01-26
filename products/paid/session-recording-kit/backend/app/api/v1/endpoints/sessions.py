from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.sql import func
from app.db.session import get_db
from app.models.project import Project
from app.models.session import Session
from app.models.event import SessionEvent
from app.schemas.session import SessionCreate, SessionResponse, SessionEventCreate
import uuid

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

from typing import List
from app.schemas.session import SessionResponse

@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.get("/{session_id}/events")
async def get_session_events(session_id: str, db: AsyncSession = Depends(get_db)):
    # Verify session exists
    await get_session(session_id, db)

    result = await db.execute(
        select(SessionEvent)
        .where(SessionEvent.session_id == session_id)
        .order_by(SessionEvent.sequence_index.asc())
    )
    events = result.scalars().all()
    return events # Returns list of objects with events_blob

@router.post("/", response_model=SessionResponse)
async def start_session(
    session_in: SessionCreate,
    project: Project = Depends(get_project_by_key),
    db: AsyncSession = Depends(get_db)
):
    """
    Start a new recording session.
    """
    db_session = Session(
        project_id=project.id,
        user_id=session_in.user_id,
        user_agent=session_in.user_agent
    )
    db.add(db_session)
    await db.commit()
    await db.refresh(db_session)
    return db_session

@router.post("/{session_id}/events")
async def add_events(
    session_id: str,
    event_in: SessionEventCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Append a chunk of events to the session.
    We verify the session exists first.
    """
    # Verify session exists (in a real app, we might check project ownership via header too)
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Update session duration/last active
    session.ended_at = func.now() # Updates on every chunk
    db.add(session)

    # Store event chunk
    db_event = SessionEvent(
        session_id=session_id,
        events_blob=event_in.events,
        sequence_index=event_in.sequence
    )
    db.add(db_event)
    await db.commit()

    return {"status": "ok", "received": len(event_in.events)}
