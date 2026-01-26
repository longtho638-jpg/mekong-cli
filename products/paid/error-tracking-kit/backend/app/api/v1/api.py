from fastapi import APIRouter
from app.api.v1.endpoints import projects, envelope, issues

api_router = APIRouter()
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(issues.router, prefix="/issues", tags=["issues"])
api_router.include_router(envelope.router, prefix="/envelope", tags=["envelope"])
