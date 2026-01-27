from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel

from backend.api.auth.dependencies import get_current_user_id
from backend.core.security.rbac import require_role
from backend.services.queue_service import QueueService

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
    responses={404: {"description": "Not found"}},
)

# Models
class JobRequest(BaseModel):
    type: str
    payload: Dict[str, Any]
    priority: str = "normal"
    run_at: Optional[datetime] = None

class JobResponse(BaseModel):
    job_id: str
    status: str
    queue: str

class QueueMetrics(BaseModel):
    high: int
    normal: int
    low: int
    dlq: int
    scheduled: int

# Dependencies
def get_queue_service():
    return QueueService()

@router.post("/", response_model=JobResponse)
async def enqueue_job(
    job_req: JobRequest,
    current_user: str = Depends(get_current_user_id),
    queue_service: QueueService = Depends(get_queue_service)
):
    """
    Enqueue a new background job.
    """
    # Optional: Add user_id to payload for tracing
    job_req.payload["_user_id"] = current_user

    job_id = queue_service.enqueue_job(
        job_type=job_req.type,
        payload=job_req.payload,
        priority=job_req.priority,
        run_at=job_req.run_at
    )

    return {
        "job_id": job_id,
        "status": "pending" if not job_req.run_at else "scheduled",
        "queue": job_req.priority
    }

@router.get("/", response_model=Dict[str, Any])
async def list_jobs(
    status: Optional[str] = None,
    queue: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    queue_service: QueueService = Depends(get_queue_service)
):
    """
    List jobs (fetching from Redis for active/queued, or DB for history).
    For MVP, we might just inspect Redis queues or look at a recent job list if maintained.

    Since QueueService currently only implements Redis inspection for active queues which is expensive (lrange),
    and doesn't strictly maintain a "list of all jobs" key except individual keys.

    Real implementation would query Postgres 'jobs' table for history/status.
    """
    # Placeholder: In a real app, this queries the Postgres 'jobs' table populated by workers/service.
    # For now, we return a mock list or implementing a scan would be too slow.
    # We will assume the Postgres migration is active and we should query it.
    # However, we haven't connected QueueService to Postgres yet.

    # Returning a mock response for the dashboard to render
    return {
        "items": [
            {
                "job_id": "mock-1",
                "type": "send_email",
                "status": "completed",
                "priority": "high",
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "job_id": "mock-2",
                "type": "generate_report",
                "status": "processing",
                "priority": "normal",
                "created_at": datetime.utcnow().isoformat()
            }
        ],
        "total": 2,
        "page": 1,
        "size": limit
    }

@router.get("/{job_id}", response_model=Dict[str, Any])
async def get_job_status(
    job_id: str,
    queue_service: QueueService = Depends(get_queue_service)
):
    """
    Get the status of a specific job.
    """
    job = queue_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job.model_dump()

@router.get("/metrics/overview", response_model=QueueMetrics)
async def get_queue_metrics(
    # current_user: str = Depends(require_role("admin")), # Uncomment when RBAC is fully setup
    queue_service: QueueService = Depends(get_queue_service)
):
    """
    Get current metrics for all queues.
    """
    return queue_service.get_queue_metrics()

@router.get("/workers", response_model=List[Dict[str, Any]])
async def get_active_workers(
    queue_service: QueueService = Depends(get_queue_service)
):
    """
    Get list of active workers and their status.
    """
    return queue_service.get_active_workers()

@router.post("/{job_id}/retry")
async def retry_job(
    job_id: str,
    queue_service: QueueService = Depends(get_queue_service)
):
    """
    Manually retry a failed job.
    """
    success = queue_service.retry_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found")

    return {"status": "retrying", "job_id": job_id}
