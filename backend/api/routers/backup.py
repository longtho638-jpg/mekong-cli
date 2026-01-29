from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from backend.api.auth.dependencies import get_current_active_superuser
from backend.services.backup.compression import GzipCompressionService
from backend.services.backup.encryption import AesEncryptionService
from backend.services.backup.orchestrator import BackupOrchestrator
from backend.services.backup.storage.s3 import S3StorageAdapter
from backend.services.backup.strategies.postgres import PostgresBackupStrategy

router = APIRouter(prefix="/backups", tags=["backups"])

# Configuration (In a real app, inject this)
BUCKET_NAME = "agencyos-backups-primary-us-east-1"
REGION = "us-east-1"


def get_orchestrator():
    # Factory for orchestrator
    strategy = PostgresBackupStrategy()
    storage = S3StorageAdapter(BUCKET_NAME, REGION)
    compression = GzipCompressionService()
    encryption = AesEncryptionService()  # Loads key from env

    return BackupOrchestrator(strategy, storage, compression, encryption)


class BackupResponse(BaseModel):
    backup_id: str
    timestamp: datetime
    status: str
    location: Optional[str] = None
    size_bytes: Optional[int] = None


@router.post(
    "/trigger", response_model=BackupResponse, dependencies=[Depends(get_current_active_superuser)]
)
async def trigger_backup(background_tasks: BackgroundTasks):
    """
    Trigger an immediate manual backup.
    """
    # For async trigger, we might want to return a job ID.
    # Here we'll just kick it off.
    orchestrator = get_orchestrator()

    try:
        # In a real scenario, run this in background and update status in DB
        # For now, we await to ensure it works for the MVP/Test
        metadata = await orchestrator.perform_backup(backup_type="manual")
        return BackupResponse(
            backup_id=metadata.backup_id,
            timestamp=metadata.timestamp,
            status="completed",
            location=metadata.location,
            size_bytes=metadata.size_bytes,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[str], dependencies=[Depends(get_current_active_superuser)])
async def list_backups():
    """
    List available backups in storage.
    """
    storage = S3StorageAdapter(BUCKET_NAME, REGION)
    try:
        return await storage.list_backups()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/restore/{backup_key:path}", dependencies=[Depends(get_current_active_superuser)])
async def restore_backup(backup_key: str):
    """
    Restore a specific backup.
    WARNING: This will overwrite current database data.
    """
    orchestrator = get_orchestrator()
    try:
        # Prepend s3://bucket/ if missing or handle key
        if not backup_key.startswith("s3://"):
            location = f"s3://{BUCKET_NAME}/{backup_key}"
        else:
            location = backup_key

        success = await orchestrator.restore_backup(location)
        if not success:
            raise HTTPException(status_code=500, detail="Restore failed during execution")
        return {"status": "success", "message": "Database restored successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
