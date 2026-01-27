from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from app.services.queue import get_queue_service, JobStatus
from app.services.scheduler_factory import get_scheduler

router = APIRouter()
queue_service = get_queue_service()
scheduler = get_scheduler()

class JobRequest(BaseModel):
    task_name: str
    payload: Dict[str, Any] = {}
    max_retries: int = 3

class JobResponse(BaseModel):
    job_id: str
    status: str

class ScheduleRequest(BaseModel):
    task_name: str
    cron: str
    payload: Dict[str, Any] = {}

class ScheduleResponse(BaseModel):
    job_id: str
    status: str

@router.post("/jobs", response_model=JobResponse)
async def enqueue_job(job_req: JobRequest):
    job_id = await queue_service.enqueue(
        task_name=job_req.task_name,
        payload=job_req.payload,
        max_retries=job_req.max_retries
    )
    return {"job_id": job_id, "status": JobStatus.PENDING}

@router.get("/jobs")
async def list_jobs(
    limit: int = 10,
    offset: int = 0,
    status: Optional[str] = None
):
    job_status = None
    if status:
        try:
            job_status = JobStatus(status)
        except ValueError:
            pass

    return await queue_service.list_jobs(limit=limit, offset=offset, status=job_status)

@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = await queue_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/stats")
async def get_stats():
    return await queue_service.get_stats()

@router.post("/jobs/{job_id}/retry")
async def retry_job(job_id: str):
    success = await queue_service.retry_job(job_id)
    if not success:
        raise HTTPException(status_code=400, detail="Job cannot be retried (must be FAILED status)")
    return {"message": "Job retried successfully"}

@router.delete("/jobs/failed")
async def clear_failed_jobs():
    count = await queue_service.clear_failed()
    return {"message": f"Cleared {count} failed jobs"}

# Scheduler Endpoints

@router.post("/schedule", response_model=ScheduleResponse)
async def schedule_job(req: ScheduleRequest):
    job_id = await scheduler.schedule_job(req.task_name, req.cron, req.payload)
    return {"job_id": job_id, "status": "scheduled"}

@router.get("/schedule")
async def list_scheduled_jobs():
    return await scheduler.get_jobs()

@router.delete("/schedule/{job_id}")
async def unschedule_job(job_id: str):
    success = await scheduler.unschedule_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Scheduled job not found")
    return {"message": "Job unscheduled"}
