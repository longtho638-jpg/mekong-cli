---
title: "Phase 3: FastAPI Dashboard App"
description: "FastAPI server với REST endpoints và CORS cho dashboard"
status: completed
priority: P2
effort: 2h
---

# Phase 3: FastAPI Dashboard App

## Overview

FastAPI server cung cấp REST endpoints cho dashboard frontend.

## Requirements

1. GET /api/metrics — All dashboard metrics
2. GET /api/metrics/api-calls — API call volume only
3. GET /api/metrics/licenses — Active licenses
4. GET /api/export — Export data (CSV/JSON)
5. CORS enabled cho browser access
6. Static files serving (CSS/JS)

## Files to Create

- `src/api/dashboard/app.py` (new)
- `src/api/dashboard/__init__.py` (new)
- `src/api/dashboard/models.py` (new)

## Files to Modify

- `src/main.py` — Add dashboard command

## Implementation Steps

### 3.1 Create FastAPI App

```python
# src/api/dashboard/app.py
"""
Dashboard FastAPI App — ROIaaS Phase 5

REST API for analytics dashboard.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, HTMLResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from typing import Optional, Literal

from src.analytics.dashboard_service import DashboardService
from src.config.logging_config import get_logger

logger = get_logger(__name__)

app = FastAPI(
    title="Mekong Dashboard API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Local dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service instance
dashboard_service = DashboardService()

# Static files
STATIC_DIR = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
async def root() -> HTMLResponse:
    """Serve dashboard HTML."""
    html_path = Path(__file__).parent / "templates" / "dashboard.html"
    if not html_path.exists():
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return HTMLResponse(html_path.read_text())


@app.get("/api/metrics")
async def get_metrics(
    range_days: int = Query(default=30, ge=1, le=365),
    granularity: Literal['day', 'week', 'month'] = 'day'
):
    """Get all dashboard metrics."""
    try:
        metrics = dashboard_service.get_dashboard_metrics(range_days, granularity)
        return {
            "success": True,
            "data": {
                "api_calls": metrics.api_calls,
                "active_licenses": metrics.active_licenses,
                "top_endpoints": metrics.top_endpoints,
                "estimated_revenue": metrics.estimated_revenue,
                "last_updated": metrics.last_updated
            }
        }
    except Exception as e:
        logger.error(f"Metrics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/api-calls")
async def get_api_calls(
    start_date: str = Query(..., pattern=r'^\d{4}-\d{2}-\d{2}$'),
    end_date: str = Query(..., pattern=r'^\d{4}-\d{2}-\d{2}$'),
    granularity: Literal['day', 'week', 'month'] = 'day'
):
    """Get API call volume for date range."""
    # Implementation


@app.get("/api/metrics/licenses")
async def get_licenses(
    date: str = Query(default_factory=lambda: datetime.now().strftime('%Y-%m-%d'))
):
    """Get active licenses."""
    # Implementation


@app.get("/api/export")
async def export_data(
    format: Literal['csv', 'json'] = 'json',
    start_date: Optional[str] = Query(None, pattern=r'^\d{4}-\d{2}-\d{2}$'),
    end_date: Optional[str] = Query(None, pattern=r'^\d{4}-\d{2}-\d{2}$'),
    license_key: Optional[str] = None
):
    """Export data to CSV or JSON."""
    try:
        data = dashboard_service.export_data(
            format=format,
            date_range=(start_date, end_date) if start_date else None,
            license_key=license_key
        )
        media_type = 'text/csv' if format == 'csv' else 'application/json'
        return PlainTextResponse(data, media_type=media_type)
    except Exception as e:
        logger.error(f"Export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
```

### 3.2 Add Server Runner

```python
# src/api/dashboard/runner.py
"""Dashboard server runner."""

import uvicorn
import webbrowser
import threading
from pathlib import Path


def run_dashboard(port: int = 8080, open_browser: bool = True):
    """
    Run dashboard server.

    Args:
        port: Server port (default: 8080)
        open_browser: Open browser on start
    """
    if open_browser:
        # Open browser after server starts
        threading.Timer(1.5, lambda: webbrowser.open(f"http://localhost:{port}")).start()

    uvicorn.run(
        "src.api.dashboard.app:app",
        host="0.0.0.0",
        port=port,
        reload=True  # Dev mode
    )
```

## Success Criteria

- [ ] FastAPI app chạy tại http://localhost:8080
- [ ] All endpoints response đúng
- [ ] CORS enabled
- [ ] API docs tại /api/docs

## Dependencies

- Phase 2: DashboardService
- FastAPI, uvicorn (dependencies)

## Risk Assessment

- **Risk:** Port 8080 already in use
- **Mitigation:** Auto-find available port
