from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
import redis.asyncio as redis
from contextlib import asynccontextmanager
from app.limiter.dependency import RateLimiter, get_ip_key
from app.limiter.core import SlidingWindowLimiter

from app.api import rules
from app.middleware.rate_limit import DynamicRateLimitMiddleware

# Global Redis client
redis_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global redis_client
    redis_client = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        password=settings.REDIS_PASSWORD,
        decode_responses=True
    )
    print(f"Connected to Redis at {settings.REDIS_HOST}:{settings.REDIS_PORT}")
    yield
    # Shutdown
    await redis_client.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Helper to get global redis client in middleware
def get_redis_client():
    return redis_client

# Middleware
app.add_middleware(DynamicRateLimitMiddleware, redis_client_func=get_redis_client)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rules.router, prefix="/api/v1/admin/rules", tags=["Admin Rules"])

@app.get("/")
async def root():
    return {"message": "API Rate Limiter Kit Backend is running"}

@app.get("/health")
async def health_check():
    try:
        if redis_client:
            await redis_client.ping()
            redis_status = "connected"
        else:
            redis_status = "disconnected"
    except Exception as e:
        redis_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "redis": redis_status
    }

# --- Rate Limit Tests ---

# 1. Fixed Window (Default): 5 requests per 60 seconds
@app.get(
    "/api/v1/limited",
    dependencies=[Depends(RateLimiter(times=5, seconds=60))]
)
async def limited_endpoint():
    return {"message": "You are allowed to see this."}

# 2. Sliding Window: 10 requests per 30 seconds
@app.get(
    "/api/v1/sliding",
    dependencies=[Depends(RateLimiter(
        times=10,
        seconds=30,
        strategy=SlidingWindowLimiter,
        prefix="sliding_limiter"
    ))]
)
async def sliding_endpoint():
    return {"message": "Sliding window check passed."}
