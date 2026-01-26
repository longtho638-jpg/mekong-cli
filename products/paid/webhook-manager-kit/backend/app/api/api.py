from fastapi import APIRouter
from app.api.endpoints import webhooks, events

api_router = APIRouter()

api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
