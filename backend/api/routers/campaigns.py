from fastapi import APIRouter

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("/")
async def list_campaigns():
    """List active marketing campaigns."""
    return {"campaigns": []}
