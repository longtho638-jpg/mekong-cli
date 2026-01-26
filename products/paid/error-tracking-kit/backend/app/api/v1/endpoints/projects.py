from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectResponse
from typing import List

from app.models.issue import Issue
from app.schemas.issue import IssueResponse

router = APIRouter()

@router.post("/", response_model=ProjectResponse)
async def create_project(project_in: ProjectCreate, db: AsyncSession = Depends(get_db)):
    db_project = Project(name=project_in.name)
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)
    return db_project

@router.get("/", response_model=List[ProjectResponse])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project))
    return result.scalars().all()

@router.get("/{project_id}/issues", response_model=List[IssueResponse])
async def list_project_issues(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Issue).where(Issue.project_id == project_id).order_by(Issue.last_seen.desc()))
    return result.scalars().all()
