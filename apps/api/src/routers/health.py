from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from src.database import get_db

router = APIRouter(prefix="/health", tags=["System"])

@router.get("/")
async def health_check():
    """
    Basic health check.
    """
    return {"status": "ok", "service": "money-layer"}

@router.get("/db")
async def db_health_check(db: AsyncSession = Depends(get_db)):
    """
    Check database connectivity.
    """
    try:
        # Execute a simple query
        result = await db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}
