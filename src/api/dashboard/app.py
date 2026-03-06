"""
Dashboard FastAPI App — ROIaaS Phase 5

REST API for analytics dashboard.
"""

from datetime import datetime, timedelta
from pathlib import Path
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

from src.analytics.dashboard_service import DashboardService
from src.config.logging_config import get_logger

logger = get_logger(__name__)

app = FastAPI(
    title="Mekong Dashboard API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS middleware (local dev only)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service instance
dashboard_service = DashboardService()

# Template configuration
BASE_DIR = Path(__file__).parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Static files
STATIC_DIR = BASE_DIR / "static"
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/", response_class=HTMLResponse)
async def root(request: Request) -> HTMLResponse:
    """Serve dashboard HTML."""
    html_path = BASE_DIR / "templates" / "dashboard.html"
    if not html_path.exists():
        raise HTTPException(status_code=404, detail="Dashboard template not found")
    return templates.TemplateResponse("dashboard.html", {"request": request})


@app.get("/api/metrics")
async def get_metrics(
    range_days: int = Query(default=30, ge=1, le=365),
    granularity: Literal["day", "week", "month"] = "day",
):
    """Get all dashboard metrics."""
    try:
        metrics = await dashboard_service.get_metrics(range_days)
        return {
            "success": True,
            "data": {
                "api_calls": metrics.api_calls,
                "active_licenses": metrics.active_licenses,
                "top_endpoints": metrics.top_endpoints,
                "revenue": metrics.revenue,
                "tier_distribution": metrics.tier_distribution,
                "last_updated": metrics.last_updated,
            },
        }
    except Exception as e:
        logger.error(f"Metrics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/api-calls")
async def get_api_calls(
    start_date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end_date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    granularity: Literal["day", "week", "month"] = "day",
):
    """Get API call volume for date range."""
    try:
        daily_usage = await dashboard_service._queries.get_daily_usage(
            start_date, end_date
        )
        chart_data = dashboard_service._format_chart_data(daily_usage, granularity)
        return {"success": True, "data": chart_data}
    except Exception as e:
        logger.error(f"API calls error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/licenses")
async def get_licenses(
    date: str = Query(
        default_factory=lambda: datetime.now().strftime("%Y-%m-%d"),
        pattern=r"^\d{4}-\d{2}-\d{2}$",
    ),
):
    """Get active licenses."""
    try:
        active_licenses = await dashboard_service._queries.get_active_licenses()
        return {"success": True, "data": active_licenses}
    except Exception as e:
        logger.error(f"Licenses error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/endpoints")
async def get_endpoints(limit: int = Query(default=10, ge=1, le=50)):
    """Get top endpoints by call volume."""
    try:
        endpoints = await dashboard_service._queries.get_top_endpoints(limit=limit)
        return {"success": True, "data": endpoints}
    except Exception as e:
        logger.error(f"Endpoints error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/export")
async def export_data(
    format: Literal["csv", "json"] = "json",
    start: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    license_key: Optional[str] = None,
):
    """Export data to CSV or JSON."""
    try:
        # Default to last 30 days if not specified
        if not start or not end:
            end_date = datetime.now().strftime("%Y-%m-%d")
            start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        else:
            start_date, end_date = start, end

        date_range = (start_date, end_date)

        if format == "csv":
            data = await dashboard_service.export_to_csv(date_range, license_key)
            media_type = "text/csv"
        else:
            data = await dashboard_service.export_to_json(date_range, license_key)
            media_type = "application/json"

        return PlainTextResponse(data, media_type=media_type)
    except Exception as e:
        logger.error(f"Export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


def run_dashboard(port: int = 8080, open_browser: bool = True):
    """
    Run dashboard server.

    Args:
        port: Server port (default: 8080)
        open_browser: Open browser on start
    """
    import threading
    import webbrowser

    if open_browser:
        threading.Timer(1.5, lambda: webbrowser.open(f"http://localhost:{port}")).start()

    import uvicorn

    uvicorn.run(
        "src.api.dashboard.app:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )
