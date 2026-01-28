from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse

from backend.api.auth.dependencies import get_current_user_id
from backend.api.schemas.exports import (
    ExportCreateRequest,
    ExportResponse,
    ExportTemplateCreate,
    ExportTemplateResponse,
)
from backend.services.queue_service import QueueService
from backend.services.storage_service import StorageService
from core.infrastructure.database import Database, get_db

router = APIRouter(
    prefix="/api/exports",
    tags=["Exports"],
    responses={404: {"description": "Not found"}},
)

def get_queue_service():
    return QueueService()

def get_storage_service():
    return StorageService()

def get_database():
    return get_db()

@router.post("/", response_model=ExportResponse, status_code=status.HTTP_201_CREATED)
async def create_export(
    request: ExportCreateRequest,
    current_user_id: str = Depends(get_current_user_id),
    queue_service: QueueService = Depends(get_queue_service),
    db: Database = Depends(get_database)
):
    """
    Trigger a new data export.
    """
    # 1. Create Export Record
    try:
        new_export = {
            "user_id": current_user_id,
            "format": request.format,
            "status": "pending",
            "progress": 0
        }
        response = db.table("exports").insert(new_export).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create export record")

        export_record = response.data[0]
        export_id = export_record["id"]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # 2. Enqueue Job
    try:
        payload = {
            "export_id": export_id,
            "user_id": current_user_id,
            "resource_type": request.resource_type,
            "format": request.format,
            "filters": request.filters,
            "columns": request.columns,
            "template_id": str(request.template_id) if request.template_id else None
        }

        _ = queue_service.enqueue_job(
            job_type="export_data",
            payload=payload,
            priority="normal",
            tenant_id=None # Add tenant ID if applicable
        )

    except Exception as e:
        # Rollback or mark failed
        db.table("exports").update({"status": "failed", "error_message": str(e)}).eq("id", export_id).execute()
        raise HTTPException(status_code=500, detail=f"Queue error: {str(e)}")

    return export_record

@router.get("/", response_model=List[ExportResponse])
async def list_exports(
    limit: int = 20,
    offset: int = 0,
    current_user_id: str = Depends(get_current_user_id),
    db: Database = Depends(get_database)
):
    """
    List user's exports.
    """
    try:
        response = db.table("exports")\
            .select("*")\
            .eq("user_id", current_user_id)\
            .order("created_at", desc=True)\
            .limit(limit)\
            .range(offset, offset + limit - 1)\
            .execute()

        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{export_id}", response_model=ExportResponse)
async def get_export(
    export_id: UUID,
    current_user_id: str = Depends(get_current_user_id),
    db: Database = Depends(get_database),
    storage_service: StorageService = Depends(get_storage_service)
):
    """
    Get export status and download URL.
    """
    try:
        response = db.table("exports")\
            .select("*")\
            .eq("id", str(export_id))\
            .eq("user_id", current_user_id)\
            .single()\
            .execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Export not found")

        export = response.data

        # Generate presigned URL if completed and url is not already a full http link
        if export["status"] == "completed" and export.get("file_url"):
            file_key = export["file_url"]
            if not file_key.startswith("http"):
                presigned_url = storage_service.generate_presigned_url(file_key, expiration=3600) # 1 hour link
                if presigned_url:
                    export["file_url"] = presigned_url

        return export
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/templates", response_model=ExportTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template: ExportTemplateCreate,
    current_user_id: str = Depends(get_current_user_id),
    db: Database = Depends(get_database)
):
    """
    Save an export template.
    """
    try:
        new_template = template.model_dump()
        new_template["user_id"] = current_user_id

        response = db.table("export_templates").insert(new_template).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create template")

        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates", response_model=List[ExportTemplateResponse])
async def list_templates(
    current_user_id: str = Depends(get_current_user_id),
    db: Database = Depends(get_database)
):
    """
    List user's templates.
    """
    try:
        response = db.table("export_templates")\
            .select("*")\
            .eq("user_id", current_user_id)\
            .order("created_at", desc=True)\
            .execute()

        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
