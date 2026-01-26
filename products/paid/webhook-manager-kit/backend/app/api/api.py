from fastapi import APIRouter
from app.api.endpoints import webhooks, events, receiver, deliveries

api_router = APIRouter()

api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(receiver.router, prefix="/receiver", tags=["receiver"])
api_router.include_router(deliveries.router, prefix="/deliveries", tags=["deliveries"])
