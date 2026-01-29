from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/v1/binh-phap",
    tags=["Binh Pháp Strategy"],
    responses={404: {"description": "Not found"}},
)


class ChapterStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    progress_percentage: float


class BinhPhapChapter(BaseModel):
    id: int
    key: str
    name_vi: str
    name_en: str
    principle: str
    application: str
    command: str
    status: str  # "active", "completed", "pending", "at_risk"
    stats: Optional[ChapterStats] = None


class BinhPhapResponse(BaseModel):
    chapters: List[BinhPhapChapter]
    total_progress: float
    updated_at: datetime


# Static definition of the 13 chapters based on Binh Pháp reference
CHAPTERS_DATA = [
    {
        "id": 1,
        "key": "ke-hoach",
        "name_vi": "Kế Hoạch",
        "name_en": "Strategic Assessment",
        "principle": "Planning",
        "application": "Project initiation, feasibility check",
        "command": "/binh-phap:ke-hoach",
        "status": "active",
    },
    {
        "id": 2,
        "key": "tac-chien",
        "name_vi": "Tác Chiến",
        "name_en": "Resource Management",
        "principle": "Resources",
        "application": "Runway, Budget, Cost optimization",
        "command": "/binh-phap:tac-chien",
        "status": "completed",  # IPO-010, IPO-038
    },
    {
        "id": 3,
        "key": "muu-cong",
        "name_vi": "Mưu Công",
        "name_en": "Win Without Fighting",
        "principle": "Automation",
        "application": "CI/CD, Strategic alliances, Leverage",
        "command": "/binh-phap:muu-cong",
        "status": "active",  # IPO-013 Running, IPO-042 Completed
    },
    {
        "id": 4,
        "key": "hinh-the",
        "name_vi": "Hình Thế",
        "name_en": "Positioning",
        "principle": "Structure",
        "application": "Architecture, Code standards, Rules",
        "command": "/binh-phap:hinh-the",
        "status": "completed",  # IPO-012, IPO-037
    },
    {
        "id": 5,
        "key": "the-tran",
        "name_vi": "Thế Trận",
        "name_en": "Momentum",
        "principle": "Force",
        "application": "Growth metrics, KPIs, Viral loops",
        "command": "/binh-phap:the-tran",
        "status": "pending",
    },
    {
        "id": 6,
        "key": "hu-thuc",
        "name_vi": "Hư Thực",
        "name_en": "Strengths & Weaknesses",
        "principle": "Testing",
        "application": "Security, Rate limiting, Chaos engineering",
        "command": "/binh-phap:hu-thuc",
        "status": "completed",  # IPO-003, IPO-018, IPO-033
    },
    {
        "id": 7,
        "key": "quan-tranh",
        "name_vi": "Quân Tranh",
        "name_en": "Speed Execution",
        "principle": "Speed",
        "application": "Caching, CDN, Fast deployments",
        "command": "/binh-phap:quan-tranh",
        "status": "completed",  # IPO-020, IPO-036
    },
    {
        "id": 8,
        "key": "cuu-bien",
        "name_vi": "Cửu Biến",
        "name_en": "Adaptability",
        "principle": "Flexibility",
        "application": "Feature flags, A/B Testing, Pivots",
        "command": "/binh-phap:cuu-bien",
        "status": "completed",  # IPO-034
    },
    {
        "id": 9,
        "key": "hanh-quan",
        "name_vi": "Hành Quân",
        "name_en": "Operations",
        "principle": "Execution",
        "application": "Background jobs, Queues, Monitoring",
        "command": "/binh-phap:hanh-quan",
        "status": "completed",  # IPO-017, IPO-019, IPO-039
    },
    {
        "id": 10,
        "key": "dia-hinh",
        "name_vi": "Địa Hình",
        "name_en": "Market Terrain",
        "principle": "Terrain",
        "application": "Multi-tenancy, Environment handling",
        "command": "/binh-phap:dia-hinh",
        "status": "completed",  # IPO-035, IPO-041
    },
    {
        "id": 11,
        "key": "cuu-dia",
        "name_vi": "Cửu Địa",
        "name_en": "Crisis Management",
        "principle": "Context",
        "application": "DR, Backup, 9 situational responses",
        "command": "/binh-phap:cuu-dia",
        "status": "pending",
    },
    {
        "id": 12,
        "key": "hoa-cong",
        "name_vi": "Hỏa Công",
        "name_en": "Disruption Strategy",
        "principle": "Disruption",
        "application": "Marketing, Notifications, Outreach",
        "command": "/binh-phap:hoa-cong",
        "status": "completed",  # IPO-014, IPO-022, IPO-031
    },
    {
        "id": 13,
        "key": "dung-gian",
        "name_vi": "Dụng Gián",
        "name_en": "Intelligence",
        "principle": "Intel",
        "application": "Logging, Analytics, User tracking",
        "command": "/binh-phap:dung-gian",
        "status": "completed",  # IPO-005, IPO-015, IPO-021, IPO-032, IPO-040
    },
]


@router.get("/status", response_model=BinhPhapResponse)
async def get_binh_phap_status():
    """
    Get the status of the 13 Binh Pháp chapters in the Agency OS.
    This reflects the strategic implementation status of the system.
    """
    # Calculate progress
    completed_count = sum(1 for c in CHAPTERS_DATA if c["status"] == "completed")
    total_count = len(CHAPTERS_DATA)
    total_progress = (completed_count / total_count) * 100 if total_count > 0 else 0

    return BinhPhapResponse(
        chapters=CHAPTERS_DATA, total_progress=round(total_progress, 2), updated_at=datetime.now()
    )


@router.get("/chapter/{key}", response_model=BinhPhapChapter)
async def get_chapter_details(key: str):
    """
    Get details for a specific Binh Pháp chapter by key (e.g., 'ke-hoach').
    """
    chapter = next((c for c in CHAPTERS_DATA if c["key"] == key), None)
    if not chapter:
        raise HTTPException(status_code=404, detail=f"Chapter '{key}' not found")
    return chapter
