from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/scheduler", tags=["Scheduler"])

try:
    from core import Scheduler

    if Scheduler is not None:
        scheduler = Scheduler()
        SCHEDULER_AVAILABLE = True
    else:
        SCHEDULER_AVAILABLE = False
        scheduler = None
except ImportError:
    SCHEDULER_AVAILABLE = False
    scheduler = None


@router.get("/meetings")
def get_meetings():
    """Get upcoming meetings."""
    if not SCHEDULER_AVAILABLE:
        raise HTTPException(500, "Scheduler not available")

    upcoming = scheduler.get_upcoming_meetings()
    return [
        {
            "id": m.id,
            "type": m.meeting_type.value,
            "attendee": m.attendee_name,
            "start": m.start_time.isoformat(),
            "end": m.end_time.isoformat(),
            "link": m.meeting_link,
        }
        for m in upcoming
    ]


@router.get("/stats")
def get_scheduler_stats():
    """Get scheduler statistics."""
    if not SCHEDULER_AVAILABLE:
        raise HTTPException(500, "Scheduler not available")

    return scheduler.get_stats()
