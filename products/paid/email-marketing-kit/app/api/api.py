from fastapi import APIRouter
from app.api.endpoints import templates, subscribers, tracking, campaigns, transactional, drips

api_router = APIRouter()
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(subscribers.router, prefix="/subscribers", tags=["subscribers"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(drips.router, prefix="/drips", tags=["drips"])
api_router.include_router(transactional.router, prefix="/transactional", tags=["transactional"])
api_router.include_router(tracking.router, prefix="/t", tags=["tracking"])
