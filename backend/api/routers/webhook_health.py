"""
Webhook Health Router.
API endpoints for webhook health monitoring.
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from backend.services.webhooks.advanced_service import AdvancedWebhookService
from core.infrastructure.redis import get_redis_client

router = APIRouter(prefix="/health", tags=["webhooks-health"])

def get_webhook_service():
    redis = get_redis_client()
    return AdvancedWebhookService(redis)

@router.get("/stats")
async def get_health_stats(
    webhook_config_id: Optional[UUID] = None,
    service: AdvancedWebhookService = Depends(get_webhook_service)
):
    """
    Get aggregated health statistics.
    """
    stats = service.get_health_stats(str(webhook_config_id) if webhook_config_id else None)
    return stats
