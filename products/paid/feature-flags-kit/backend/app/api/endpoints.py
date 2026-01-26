from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.feature import (
    FeatureFlagCreate,
    FeatureFlagUpdate,
    FeatureFlagResponse,
    EvaluationRequest
)
from app.services.feature_service import FeatureService
from typing import List, Dict

router = APIRouter()

@router.post("/flags", response_model=FeatureFlagResponse)
async def create_flag(flag: FeatureFlagCreate, db: AsyncSession = Depends(get_db)):
    service = FeatureService(db)
    existing = await service.get_flag_by_key(flag.key)
    if existing:
        raise HTTPException(status_code=400, detail="Flag with this key already exists")
    return await service.create_flag(flag)

@router.get("/flags", response_model=List[FeatureFlagResponse])
async def list_flags(db: AsyncSession = Depends(get_db)):
    service = FeatureService(db)
    return await service.get_all_flags()

@router.get("/flags/{key}", response_model=FeatureFlagResponse)
async def get_flag(key: str, db: AsyncSession = Depends(get_db)):
    service = FeatureService(db)
    flag = await service.get_flag_by_key(key)
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    return flag

@router.patch("/flags/{key}", response_model=FeatureFlagResponse)
async def update_flag(key: str, flag_in: FeatureFlagUpdate, db: AsyncSession = Depends(get_db)):
    service = FeatureService(db)
    flag = await service.update_flag(key, flag_in)
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    return flag

@router.delete("/flags/{key}")
async def delete_flag(key: str, db: AsyncSession = Depends(get_db)):
    service = FeatureService(db)
    success = await service.delete_flag(key)
    if not success:
        raise HTTPException(status_code=404, detail="Flag not found")
    return {"status": "deleted"}

@router.post("/client/evaluate", response_model=Dict[str, bool])
async def evaluate_flags(req: EvaluationRequest, db: AsyncSession = Depends(get_db)):
    """
    Evaluate all flags for a given context.
    Returns a dictionary of flag_key -> boolean.
    """
    service = FeatureService(db)
    all_flags = await service.get_all_flags()

    result = {}
    for flag in all_flags:
        result[flag.key] = service.evaluate_flag(flag, req.context)

    return result
