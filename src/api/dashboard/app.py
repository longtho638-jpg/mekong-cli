"""
Dashboard FastAPI App — ROIaaS Phase 5

REST API for analytics dashboard with authentication.
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
from src.auth.middleware import SessionMiddleware
from src.auth.config import AuthConfig
from src.auth.rbac import require_permission, Permission, get_current_user
from src.auth.routes import router as auth_router

logger = get_logger(__name__)

app = FastAPI(
    title="Mekong Dashboard API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Session middleware (authentication)
app.add_middleware(SessionMiddleware)

# CORS middleware (local dev only)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include auth routes
app.include_router(auth_router)

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
    # Check authentication status
    authenticated = getattr(request.state, "authenticated", False)
    user = get_current_user(request)

    html_path = BASE_DIR / "templates" / "dashboard.html"
    if not html_path.exists():
        raise HTTPException(status_code=404, detail="Dashboard template not found")

    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "authenticated": authenticated,
            "user": user,
        },
    )


@app.get("/api/metrics")
@require_permission(Permission.VIEW_DASHBOARD)
async def get_metrics(
    request: Request,
    range_days: int = Query(default=30, ge=1, le=365),
    granularity: Literal["day", "week", "month"] = "day",
    license_key: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
):
    """Get all dashboard metrics (requires authentication)."""
    try:
        metrics = await dashboard_service.get_metrics(
            range_days=range_days,
            license_key=license_key,
            start_date=start_date,
            end_date=end_date,
        )
        return {
            "success": True,
            "data": {
                "api_calls": metrics.api_calls,
                "active_licenses": metrics.active_licenses,
                "top_endpoints": metrics.top_endpoints,
                "revenue": metrics.revenue,
                "tier_distribution": metrics.tier_distribution,
                "last_updated": metrics.last_updated,
                # License health metrics (Phase 7)
                "license_health": metrics.license_health,
                "renewal_prompts": metrics.renewal_prompts,
                "rate_limit_events": metrics.rate_limit_events,
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
    request: Request,
    format: Literal["csv", "json"] = "json",
    start: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    license_key: Optional[str] = Query(None),
    days: int = Query(default=30, ge=1, le=365),
):
    """Export data to CSV or JSON (requires export permission)."""
    try:
        # Default to last 30 days if not specified
        if not start or not end:
            end_date = datetime.now().strftime("%Y-%m-%d")
            start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
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
    """Health check endpoint with auth config status."""
    config = AuthConfig()
    config_summary = config.get_config_summary()

    return {
        "status": "healthy",
        "auth": config_summary,
    }


@app.get("/api/license-health")
@require_permission(Permission.VIEW_DASHBOARD)
async def get_license_health(request: Request):
    """Get license health overview with status counts."""
    try:
        metrics = await dashboard_service.get_metrics(range_days=30)
        return {
            "success": True,
            "data": metrics.license_health,
        }
    except Exception as e:
        logger.error(f"License health error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/renewal-prompts")
@require_permission(Permission.VIEW_DASHBOARD)
async def get_renewal_prompts(
    request: Request,
    days: int = Query(default=7, ge=1, le=30),
):
    """Get expired/expiring licenses needing renewal attention."""
    try:
        metrics = await dashboard_service.get_metrics(range_days=30)
        # Filter to only show prompts within the specified days window
        prompts = [
            p for p in metrics.renewal_prompts
            if abs(p.get('days_since_or_until_expiry', 0)) <= days
        ][:20]  # Limit to 20 results
        return {
            "success": True,
            "data": prompts,
            "metadata": {
                "window_days": days,
                "total_count": len(prompts),
            },
        }
    except Exception as e:
        logger.error(f"Renewal prompts error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/rate-limit-events")
@require_permission(Permission.VIEW_DASHBOARD)
async def get_rate_limit_events(
    request: Request,
    limit: int = Query(default=50, ge=1, le=200),
    event_type: Optional[str] = Query(None),
    tenant_id: Optional[str] = Query(None),
):
    """Get recent rate limit events with optional filters."""
    try:
        events = await dashboard_service._rate_limit_emitter.get_recent_events(
            tenant_id=tenant_id,
            event_type=event_type,
            limit=limit,
        )
        return {
            "success": True,
            "data": events,
            "metadata": {
                "total_count": len(events),
                "filters": {
                    "event_type": event_type,
                    "tenant_id": tenant_id,
                },
            },
        }
    except Exception as e:
        logger.error(f"Rate limit events error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/filters/licenses")
async def get_license_filters():
    """Get list of license keys for filter dropdown."""
    try:
        licenses = await dashboard_service._queries.get_active_licenses()
        # Return unique license keys with metadata
        result = []
        seen = set()
        for lic in licenses:
            key = lic.get("license_key", "")
            if key and key not in seen:
                result.append({
                    "key_id": lic.get("key_id", ""),
                    "license_key": key[:20] + "..." if len(key) > 20 else key,
                    "tier": lic.get("tier", "unknown"),
                    "email": lic.get("email", ""),
                })
                seen.add(key)
        return {
            "success": True,
            "data": result[:100],  # Limit to 100 for dropdown performance
        }
    except Exception as e:
        logger.error(f"License filters error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/telemetry/events")
async def get_telemetry_events(
    event_type: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    limit: int = Query(default=100, ge=1, le=1000),
):
    """Get telemetry events with optional filters."""
    try:
        from src.db.queries.analytics_queries import TelemetryQueries

        queries = TelemetryQueries()
        events = await queries.get_telemetry_events(
            event_type=event_type,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
        )
        return {
            "success": True,
            "data": events,
            "metadata": {
                "total_count": len(events),
                "filters": {
                    "event_type": event_type,
                    "start_date": start_date,
                    "end_date": end_date,
                },
            },
        }
    except Exception as e:
        logger.error(f"Telemetry events error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/telemetry/cli-versions")
async def get_cli_versions():
    """Get CLI version distribution from telemetry data."""
    try:
        from src.db.queries.analytics_queries import TelemetryQueries

        queries = TelemetryQueries()
        distribution = await queries.get_cli_version_distribution()
        return {
            "success": True,
            "data": distribution,
        }
    except Exception as e:
        logger.error(f"CLI versions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/telemetry/sessions")
async def get_session_stats(
    range_days: int = Query(default=30, ge=1),
):
    """Get session statistics from telemetry data."""
    try:
        from src.db.queries.analytics_queries import TelemetryQueries

        queries = TelemetryQueries()
        stats = await queries.get_session_statistics(range_days)
        return {
            "success": True,
            "data": stats,
        }
    except Exception as e:
        logger.error(f"Session stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def run_dashboard(
    port: int = 8080,
    open_browser: bool = True,
    host: str = "0.0.0.0",
) -> None:
    """
    Run dashboard server.

    Args:
        port: Server port (default: 8080)
        open_browser: Open browser on start
        host: Bind host (default: 0.0.0.0)
    """
    import threading
    import webbrowser

    if open_browser:
        threading.Timer(
            1.5, lambda: webbrowser.open(f"http://localhost:{port}")
        ).start()

    import uvicorn

    uvicorn.run(
        "src.api.dashboard.app:app",
        host=host,
        port=port,
        reload=True,
    )
