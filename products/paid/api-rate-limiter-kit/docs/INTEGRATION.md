# Integration Guide

How to add the **API Rate Limiter** to your existing FastAPI application.

## Option 1: Full Middleware Integration (Recommended)

This method provides global protection and enables the dynamic rule engine managed by the dashboard.

### 1. Copy Files
Copy the `backend/app/limiter` directory and `backend/app/middleware` directory to your project.

```bash
cp -r api-rate-limiter-kit/backend/app/limiter your-project/app/
cp -r api-rate-limiter-kit/backend/app/middleware your-project/app/
cp -r api-rate-limiter-kit/backend/app/services your-project/app/
cp -r api-rate-limiter-kit/backend/app/models your-project/app/
```

### 2. Install Dependencies
Ensure you have `redis` and `fastapi` installed.

```bash
pip install redis
```

### 3. Configure Redis
Ensure you have a global `redis_client` initialized in your application startup (lifespan).

```python
# main.py
import redis.asyncio as redis
from contextlib import asynccontextmanager

redis_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)
    yield
    await redis_client.close()
```

### 4. Add Middleware
Register the middleware in your FastAPI app.

```python
from app.middleware.rate_limit import DynamicRateLimitMiddleware

def get_redis_client():
    return redis_client

app = FastAPI(lifespan=lifespan)
app.add_middleware(DynamicRateLimitMiddleware, redis_client_func=get_redis_client)
```

Now, any rules created via the Dashboard (or directly in Redis) will be enforced globally.

## Option 2: Per-Route Dependency

If you only want to protect specific endpoints without the dynamic rule engine:

### 1. Import Dependency
Copy `backend/app/limiter` to your project.

### 2. Use in Routes

```python
from fastapi import Depends
from app.limiter.dependency import RateLimiter

@app.get("/heavy-task", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def heavy_task():
    return {"data": "..."}
```

## Advanced Configuration

### Custom Identifier (Key Function)
By default, the limiter uses IP address. You can change this to use User ID from JWT or API Key.

```python
from fastapi import Request

def get_user_id(request: Request) -> str:
    # Example: extract from auth header
    return request.headers.get("X-User-ID", "anonymous")

RateLimiter(key_func=get_user_id)
```

### Sliding Window
For smoother traffic shaping, switch to Sliding Window strategy (uses slightly more Redis memory).

```python
from app.limiter.core import SlidingWindowLimiter

RateLimiter(strategy=SlidingWindowLimiter)
```
