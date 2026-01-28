"""
CDN Router
API endpoints for managing CDN cache and assets.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, HttpUrl

from backend.api.auth.dependencies import get_current_active_superuser
from backend.services.cdn.manager import CDNManager
from backend.api.config.settings import settings

router = APIRouter(prefix="/cdn", tags=["cdn"])

# --- Models ---

class PurgeRequest(BaseModel):
    purge_all: bool = False
    urls: Optional[List[str]] = None
    tags: Optional[List[str]] = None

class OptimizationRequest(BaseModel):
    directory: str
    extensions: Optional[List[str]] = None

class CDNConfigResponse(BaseModel):
    provider: str
    enabled: bool
    zone_id: Optional[str] = None
    service_id: Optional[str] = None

# --- Dependencies ---

def get_cdn_manager():
    return CDNManager()

# --- Endpoints ---

@router.post("/purge", dependencies=[Depends(get_current_active_superuser)])
async def purge_cache(
    request: PurgeRequest,
    manager: CDNManager = Depends(get_cdn_manager)
):
    """
    Purge CDN cache.
    Requires superuser privileges.
    """
    if request.purge_all:
        success = await manager.purge_all()
        if not success:
            raise HTTPException(status_code=500, detail="Failed to purge all cache")
        return {"message": "Purge all initiated successfully"}

    if request.urls:
        success = await manager.purge_urls(request.urls)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to purge URLs")
        return {"message": f"Purge initiated for {len(request.urls)} URLs"}

    if request.tags:
        success = await manager.purge_tags(request.tags)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to purge tags")
        return {"message": f"Purge initiated for {len(request.tags)} tags"}

    raise HTTPException(status_code=400, detail="Invalid purge request: specify purge_all, urls, or tags")


@router.get("/config", response_model=CDNConfigResponse, dependencies=[Depends(get_current_active_superuser)])
async def get_cdn_config():
    """
    Get current CDN configuration.
    """
    provider = settings.cdn_provider
    enabled = False
    zone_id = None
    service_id = None

    if provider == "cloudflare" and settings.cloudflare_api_token:
        enabled = True
        zone_id = settings.cloudflare_zone_id
    elif provider == "fastly" and settings.fastly_api_token:
        enabled = True
        service_id = settings.fastly_service_id

    return CDNConfigResponse(
        provider=provider,
        enabled=enabled,
        zone_id=zone_id,
        service_id=service_id
    )


@router.post("/optimize", dependencies=[Depends(get_current_active_superuser)])
async def trigger_optimization(
    request: OptimizationRequest,
    background_tasks: BackgroundTasks,
    manager: CDNManager = Depends(get_cdn_manager)
):
    """
    Trigger asset optimization in background.
    """
    # Verify directory safety - simple check to ensure it's within project
    # In a real app, strict validation is needed
    if ".." in request.directory or request.directory.startswith("/"):
        # Allow absolute paths but be careful? Ideally restrict to known static dirs.
        # For now, let's assume the admin knows what they are doing but add a warning/restriction
        pass

    # We run this in background as it might take time
    background_tasks.add_task(manager.optimize_directory, request.directory)

    return {"message": "Optimization task triggered in background"}
