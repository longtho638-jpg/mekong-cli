from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.queue import QueueService, JobStatus

router = APIRouter()
queue_service = QueueService()

class JobRequest(BaseModel):
    task_name: str
    payload: Dict[str, Any] = {}
    max_retries: int = 3

class JobResponse(BaseModel):
    job_id: str
    status: str

@router.post("/jobs", response_model=JobResponse)
async def enqueue_job(job_req: JobRequest):
    job_id = queue_service.enqueue(
        task_name=job_req.task_name,
        payload=job_req.payload,
        max_retries=job_req.max_retries
    )
    return {"job_id": job_id, "status": JobStatus.PENDING}

@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = queue_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/stats")
async def get_stats():
    return queue_service.get_stats()

@router.post("/jobs/{job_id}/retry")
async def retry_job(job_id: str):
    success = queue_service.retry_job(job_id)
    if not success:
        raise HTTPException(status_code=400, detail="Job cannot be retried (must be FAILED status)")
    return {"message": "Job retried successfully"}

@router.delete("/jobs/failed")
async def clear_failed_jobs():
    count = queue_service.clear_failed()
    return {"message": f"Cleared {count} failed jobs"}
