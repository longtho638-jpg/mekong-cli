"""
DLQ Router.
API endpoints for managing Dead Letter Queue.
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from backend.services.webhooks.advanced_service import AdvancedWebhookService
from core.infrastructure.redis import get_redis_client

router = APIRouter(prefix="/dlq", tags=["webhooks-dlq"])

# Dependency to get service
def get_webhook_service():
    redis = get_redis_client()
    return AdvancedWebhookService(redis)

@router.get("/", response_model=List[dict])
async def list_dlq_entries(
    webhook_config_id: Optional[UUID] = None,
    limit: int = 50,
    offset: int = 0,
    service: AdvancedWebhookService = Depends(get_webhook_service)
):
    """
    List DLQ entries.
    """
    entries = service.get_dlq_entries(str(webhook_config_id) if webhook_config_id else None, limit, offset)
    return entries

@router.post("/{entry_id}/replay")
async def replay_dlq_entry(
    entry_id: UUID,
    service: AdvancedWebhookService = Depends(get_webhook_service)
):
    """
    Replay a specific DLQ entry.
    """
    success = await service.replay_dlq_entry(str(entry_id))
    if not success:
        raise HTTPException(status_code=404, detail="DLQ entry not found")
    return {"status": "replayed"}

@router.delete("/{entry_id}")
async def discard_dlq_entry(
    entry_id: UUID,
    service: AdvancedWebhookService = Depends(get_webhook_service)
):
    """
    Discard (archive) a DLQ entry.
    """
    service.discard_dlq_entry(str(entry_id))
    return {"status": "discarded"}

@router.post("/replay-bulk")
async def replay_bulk(
    entry_ids: List[UUID],
    service: AdvancedWebhookService = Depends(get_webhook_service)
):
    """
    Replay multiple DLQ entries.
    """
    count = 0
    for eid in entry_ids:
        if await service.replay_dlq_entry(str(eid)):
            count += 1
    return {"status": "success", "replayed_count": count}
