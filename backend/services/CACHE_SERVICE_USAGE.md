# Cache Service Usage Examples

## Overview

The `cache_service.py` provides a Redis caching layer with automatic fallback to in-memory cache when Redis is unavailable.

## Features

✅ Cache API responses with TTL
✅ Cache invalidation on update
✅ Key prefix by service
✅ Get/Set/Delete operations
✅ Fallback to in-memory if Redis unavailable
✅ Decorator for caching function results
✅ Global cache instances for common use cases

## Basic Usage

### 1. Create a Cache Service

```python
from backend.services.cache_service import CacheService

# Create cache with custom prefix
user_cache = CacheService(
    prefix="user",
    host="localhost",
    port=6379,
    default_ttl=600  # 10 minutes
)
```

### 2. Set and Get Data

```python
# Cache a string
user_cache.set("user:123", "John Doe")
name = user_cache.get("user:123")  # "John Doe"

# Cache a dictionary
user_data = {"id": 123, "name": "John", "email": "john@example.com"}
user_cache.set("user:123", user_data, ttl=300)
cached_user = user_cache.get("user:123")  # Returns dict

# Get with default value
user = user_cache.get("user:999", default={"id": 999, "name": "Unknown"})
```

### 3. Delete and Invalidate

```python
# Delete single key
user_cache.delete("user:123")

# Delete multiple keys
user_cache.delete("user:123", "user:456", "user:789")

# Invalidate pattern (all user keys)
user_cache.invalidate_pattern("user:*")

# Clear all cache for this service
user_cache.clear_all()
```

## Cache Invalidation on Update

```python
from backend.services.cache_service import CacheService

cache = CacheService(prefix="api")

# Cache initial data
cache.set("product:123", {"name": "Widget", "price": 10.00})

# When updating product in database
def update_product(product_id, new_data):
    # Update database
    db.update(product_id, new_data)

    # Invalidate cache
    cache.delete(f"product:{product_id}")

    # Or invalidate all related caches
    cache.invalidate_pattern(f"product:{product_id}:*")
```

## Using the Decorator

```python
from backend.services.cache_service import cached

# Cache function results
@cached(
    key_func=lambda user_id: f"user:{user_id}",
    ttl=300,
    prefix="user_lookup"
)
def get_user_from_db(user_id):
    # Expensive database query
    return db.query(User).filter_by(id=user_id).first()

# First call - hits database
user = get_user_from_db(123)

# Second call - returns cached result
user = get_user_from_db(123)

# Invalidate cache when needed
get_user_from_db.invalidate()
```

## Global Cache Instances

Pre-configured cache instances are available:

```python
from backend.services.cache_service import api_cache, user_cache, session_cache

# API response cache (TTL: 300s)
api_cache.set("endpoint:/users", {"users": [...]})

# User data cache (TTL: 600s)
user_cache.set("user:123", {"name": "John"})

# Session cache (TTL: 1800s)
session_cache.set("session:abc123", {"user_id": 123})
```

## Service Isolation with Prefixes

```python
# Different services with isolated caches
auth_cache = CacheService(prefix="auth")
product_cache = CacheService(prefix="product")
order_cache = CacheService(prefix="order")

# Same key, different values
auth_cache.set("status", "authenticated")
product_cache.set("status", "in_stock")
order_cache.set("status", "pending")

# No conflicts
print(auth_cache.get("status"))      # "authenticated"
print(product_cache.get("status"))   # "in_stock"
print(order_cache.get("status"))     # "pending"
```

## FastAPI Integration Example

```python
from fastapi import APIRouter, Depends
from backend.services.cache_service import api_cache

router = APIRouter()

@router.get("/users/{user_id}")
async def get_user(user_id: int):
    # Try cache first
    cached_user = api_cache.get(f"user:{user_id}")
    if cached_user:
        return cached_user

    # Cache miss - fetch from database
    user = await db.get_user(user_id)

    # Cache for 5 minutes
    api_cache.set(f"user:{user_id}", user, ttl=300)

    return user

@router.put("/users/{user_id}")
async def update_user(user_id: int, data: dict):
    # Update database
    updated_user = await db.update_user(user_id, data)

    # Invalidate cache
    api_cache.delete(f"user:{user_id}")

    return updated_user
```

## Advanced Pattern: Cache-Aside

```python
from backend.services.cache_service import CacheService

class UserRepository:
    def __init__(self):
        self.cache = CacheService(prefix="user_repo", default_ttl=600)

    def get_user(self, user_id: int):
        # 1. Try cache
        cache_key = f"user:{user_id}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        # 2. Cache miss - query database
        user = self.db.query(User).filter_by(id=user_id).first()

        # 3. Store in cache
        if user:
            self.cache.set(cache_key, user)

        return user

    def update_user(self, user_id: int, data: dict):
        # 1. Update database
        user = self.db.query(User).filter_by(id=user_id).update(data)

        # 2. Invalidate cache
        self.cache.delete(f"user:{user_id}")

        return user

    def delete_user(self, user_id: int):
        # 1. Delete from database
        self.db.query(User).filter_by(id=user_id).delete()

        # 2. Remove from cache
        self.cache.delete(f"user:{user_id}")
```

## Checking Cache Availability

```python
from backend.services.cache_service import CacheService

cache = CacheService(prefix="my_service")

# Check if using Redis or in-memory
if cache.is_redis_available():
    print("Using Redis cache")
else:
    print("Using in-memory cache (Redis unavailable)")
```

## Best Practices

1. **Use appropriate TTL**: Short TTL for frequently changing data, longer for static data
2. **Invalidate on update**: Always invalidate cache when updating data
3. **Use prefixes**: Separate caches by service/domain for better organization
4. **Handle cache misses**: Always have fallback logic to fetch from source
5. **Monitor cache hits**: Track cache effectiveness to optimize TTL values

## Testing

All features are tested with both Redis and in-memory implementations:

```bash
cd backend/services
python3 -m pytest test_cache_service.py -v
```

Test coverage includes:
- Basic get/set/delete operations
- TTL expiration
- Pattern-based invalidation
- Service prefix isolation
- Decorator functionality
- Fallback behavior
