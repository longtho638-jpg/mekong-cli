from fastapi import APIRouter, Depends, HTTPException
from backend.services.rate_limiter_service import RateLimiterService
# from backend.api.auth.dependencies import get_current_admin_user # Assuming this exists or similar

router = APIRouter(prefix='/admin/rate-limits', tags=['Admin - Rate Limits'])

# Mock admin dependency for now if not available
async def get_current_admin_user():
    return {"id": "admin", "role": "admin"}

@router.get('/status/{key}')
async def get_rate_limit_status(
    key: str,
    admin = Depends(get_current_admin_user),
):
    """
    Get current rate limit status for a key.
    Key format: user:{user_id}:{endpoint} or ip:{ip}:{endpoint}
    """
    rate_limiter = RateLimiterService()
    status = await rate_limiter.get_status(key)
    return status

@router.delete('/reset/{key}')
async def reset_rate_limit(
    key: str,
    admin = Depends(get_current_admin_user),
):
    """
    Reset rate limit for a key (emergency use).
    """
    rate_limiter = RateLimiterService()
    await rate_limiter.reset(key)
    return {'success': True, 'key': key}

@router.get('/top-users')
async def get_top_rate_limited_users(
    limit: int = 10,
    admin = Depends(get_current_admin_user),
):
    """
    Get users hitting rate limits most frequently.
    """
    rate_limiter = RateLimiterService()
    top_users = await rate_limiter.get_top_limited_users(limit)
    return {'top_users': top_users}
