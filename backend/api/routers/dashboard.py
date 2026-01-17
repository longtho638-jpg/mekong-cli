"""
📊 Dashboard API Router - Serves live data for Admin Dashboard
==============================================================

Endpoints:
- GET /api/dashboard/revenue - Revenue metrics from ~/.mekong/
- GET /api/dashboard/leads - Lead pipeline data
- GET /api/dashboard/queue - Content queue status
- GET /api/dashboard/sales - Recent sales
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# Config
MEKONG_DIR = Path.home() / ".mekong"


class RevenueMetrics(BaseModel):
    mrr: float = 0.0
    arr: float = 0.0
    pending_invoices: float = 0.0
    paid_invoices: float = 0.0
    goal: float = 200000.0
    progress_percent: float = 0.0


class Lead(BaseModel):
    name: str
    email: str
    company: str
    stage: str
    added: Optional[str] = None


class Sale(BaseModel):
    date: str
    product: str
    price: float
    email: str


class QueueItem(BaseModel):
    id: str
    date: str
    theme: str
    product: str
    status: str


def load_json_file(filename: str) -> List[Dict]:
    """Load a JSON file from ~/.mekong/"""
    filepath = MEKONG_DIR / filename
    if filepath.exists():
        try:
            with open(filepath) as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []
    return []


def load_log_file(filename: str) -> List[str]:
    """Load a log file from ~/.mekong/"""
    filepath = MEKONG_DIR / filename
    if filepath.exists():
        try:
            with open(filepath) as f:
                return [line.strip() for line in f.readlines() if line.strip()]
        except (IOError, OSError):
            return []
    return []


@router.get("/revenue", response_model=RevenueMetrics)
async def get_revenue():
    """Get revenue metrics from invoices and sales."""
    invoices = load_json_file("invoices.json")

    pending = sum(i.get("amount", 0) for i in invoices if i.get("status") == "pending")
    paid = sum(i.get("amount", 0) for i in invoices if i.get("status") == "paid")

    goal = 200000.0
    progress = (paid / goal * 100) if goal > 0 else 0

    return RevenueMetrics(
        mrr=paid / 12 if paid > 0 else 0,
        arr=paid,
        pending_invoices=pending,
        paid_invoices=paid,
        goal=goal,
        progress_percent=round(progress, 1),
    )


@router.get("/leads", response_model=List[Lead])
async def get_leads():
    """Get lead pipeline."""
    leads = load_json_file("leads.json")
    return [
        Lead(
            name=l.get("name", ""),
            email=l.get("email", ""),
            company=l.get("company", ""),
            stage=l.get("stage", "new"),
            added=l.get("added", "")[:10] if l.get("added") else None,
        )
        for l in leads
    ]


@router.get("/leads/stats")
async def get_leads_stats():
    """Get lead statistics by stage."""
    leads = load_json_file("leads.json")

    stages = {"new": 0, "contacted": 0, "replied": 0, "meeting": 0, "closed": 0}

    for lead in leads:
        stage = lead.get("stage", "new")
        if stage in stages:
            stages[stage] += 1

    total = len(leads)
    closed = stages.get("closed", 0)
    conversion = (closed / total * 100) if total > 0 else 0

    return {"total": total, "stages": stages, "conversion_rate": round(conversion, 1)}


@router.get("/sales", response_model=List[Sale])
async def get_sales():
    """Get recent sales from sales.log."""
    lines = load_log_file("sales.log")
    sales = []

    for line in lines[-20:]:  # Last 20 sales
        parts = line.split("|")
        if len(parts) >= 4:
            sales.append(
                Sale(
                    date=parts[0],
                    product=parts[1],
                    price=float(parts[2]) if parts[2].replace(".", "").isdigit() else 0,
                    email=parts[3],
                )
            )

    return sales


@router.get("/queue", response_model=List[QueueItem])
async def get_queue():
    """Get content queue."""
    queue = load_json_file("social_queue.json")
    return [
        QueueItem(
            id=q.get("id", ""),
            date=q.get("date", ""),
            theme=q.get("theme", ""),
            product=q.get("product", ""),
            status=q.get("status", "queued"),
        )
        for q in queue[:20]  # First 20 items
    ]


@router.get("/summary")
async def get_dashboard_summary():
    """Get complete dashboard summary."""
    revenue = await get_revenue()
    leads_stats = await get_leads_stats()
    sales = await get_sales()
    queue = await get_queue()

    return {
        "timestamp": datetime.now().isoformat(),
        "revenue": revenue.model_dump(),
        "leads": leads_stats,
        "recent_sales": len(sales),
        "queued_content": len(queue),
    }
