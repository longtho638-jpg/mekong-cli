import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Aggressive mocking of redis to prevent any connection attempts
with patch("redis.asyncio.Redis") as MockRedis, \
     patch("redis.asyncio.ConnectionPool") as MockPool, \
     patch("backend.core.infrastructure.redis.RedisClient.get_instance") as mock_get_instance:

    mock_redis_instance = AsyncMock()
    MockRedis.return_value = mock_redis_instance
    mock_get_instance.return_value = mock_redis_instance

    # Also patch the service level redis client
    with patch("backend.services.redis_client.RedisService.get_client", return_value=mock_redis_instance):
        from backend.api.main import app
        from backend.api.routers.inventory import get_queue_service
        from backend.services.queue_service import QueueService

@pytest.fixture
def mock_queue_service():
    service = MagicMock(spec=QueueService)
    service.enqueue_job.return_value = "job-123"
    return service

def test_create_product_enqueues_indexing_job(mock_queue_service):
    from fastapi.testclient import TestClient

    # Override dependency
    app.dependency_overrides[get_queue_service] = lambda: mock_queue_service

    # We need to mock RateLimiterService within the app's middleware stack or services
    # because TestClient triggers startup events and middleware init
    with patch("backend.services.rate_limiter_service.RateLimiterService") as MockRateLimiter, \
         patch("backend.middleware.rate_limiter.RateLimiterService", new=MockRateLimiter), \
         patch("backend.services.cache.warming.CacheWarmer.initialize", new_callable=AsyncMock), \
         patch("backend.services.ip_blocker.IpBlocker.is_blocked", new_callable=AsyncMock, return_value=False):

        # Setup mock rate limiter to allow everything
        mock_limiter = MockRateLimiter.return_value
        mock_limiter.check_sliding_window = AsyncMock(return_value=(True, 100))
        mock_limiter.check_token_bucket = AsyncMock(return_value=(True, 100))
        mock_limiter.check_fixed_window = AsyncMock(return_value=(True, 100))
        mock_limiter.get_reset_time = AsyncMock(return_value=0)

        with TestClient(app) as client:
            payload = {
                "id": "prod_new_001",
                "name": "Test Product",
                "quantity": 10,
                "price": 99.99,
                "description": "A new test product",
                "tags": ["test", "demo"]
            }

            response = client.post("/api/v1/inventory/products", json=payload)

            if response.status_code != 200:
                print(f"Response status: {response.status_code}")
                print(f"Response body: {response.text}")

            assert response.status_code == 200
            data = response.json()
            assert data["id"] == payload["id"]

            # Verify queue_service.enqueue_job was called
            mock_queue_service.enqueue_job.assert_called_once()

            # Verify arguments
            call_args = mock_queue_service.enqueue_job.call_args
            assert call_args.kwargs["job_type"] == "search_indexing"
            assert call_args.kwargs["payload"]["action"] == "index"
            assert call_args.kwargs["payload"]["index"] == "products"
            assert call_args.kwargs["payload"]["document"]["id"] == payload["id"]
            assert call_args.kwargs["payload"]["document"]["title"] == payload["name"]

def test_update_product_enqueues_indexing_job(mock_queue_service):
    from fastapi.testclient import TestClient

    # Override dependency
    app.dependency_overrides[get_queue_service] = lambda: mock_queue_service

    with patch("backend.services.rate_limiter_service.RateLimiterService") as MockRateLimiter, \
         patch("backend.middleware.rate_limiter.RateLimiterService", new=MockRateLimiter), \
         patch("backend.services.cache.warming.CacheWarmer.initialize", new_callable=AsyncMock), \
         patch("backend.services.ip_blocker.IpBlocker.is_blocked", new_callable=AsyncMock, return_value=False):

        mock_limiter = MockRateLimiter.return_value
        mock_limiter.check_sliding_window = AsyncMock(return_value=(True, 100))
        mock_limiter.check_token_bucket = AsyncMock(return_value=(True, 100))
        mock_limiter.check_fixed_window = AsyncMock(return_value=(True, 100))
        mock_limiter.get_reset_time = AsyncMock(return_value=0)

        with TestClient(app) as client:
            product_id = "prod_update_001"
            payload = {
                "id": product_id,
                "name": "Updated Product Name",
                "quantity": 20,
                "price": 149.99,
                "description": "Updated description",
                "tags": ["updated"]
            }

            response = client.put(f"/api/v1/inventory/products/{product_id}", json=payload)

            assert response.status_code == 200
            data = response.json()
            assert data["name"] == payload["name"]

            # Verify queue_service.enqueue_job was called
            # Note: Since fixtures are shared/reset per test function in pytest usually,
            # we need to ensure we are looking at the right call.
            # But here we are defining the test function inside the context? No, wait.
            # The indentation of the previous edit ended the file inside test_create_product_enqueues_indexing_job?
            # No, I need to make sure I am adding new functions at the module level.

            # Check calls
            assert mock_queue_service.enqueue_job.called

            # Get the last call (update)
            call_args = mock_queue_service.enqueue_job.call_args
            assert call_args.kwargs["job_type"] == "search_indexing"
            assert call_args.kwargs["payload"]["action"] == "update"
            assert call_args.kwargs["payload"]["index"] == "products"
            assert call_args.kwargs["payload"]["document"]["id"] == product_id
            assert call_args.kwargs["payload"]["document"]["title"] == payload["name"]

def test_delete_product_enqueues_indexing_job(mock_queue_service):
    from fastapi.testclient import TestClient

    # Override dependency
    app.dependency_overrides[get_queue_service] = lambda: mock_queue_service

    with patch("backend.services.rate_limiter_service.RateLimiterService") as MockRateLimiter, \
         patch("backend.middleware.rate_limiter.RateLimiterService", new=MockRateLimiter), \
         patch("backend.services.cache.warming.CacheWarmer.initialize", new_callable=AsyncMock), \
         patch("backend.services.ip_blocker.IpBlocker.is_blocked", new_callable=AsyncMock, return_value=False):

        mock_limiter = MockRateLimiter.return_value
        mock_limiter.check_sliding_window = AsyncMock(return_value=(True, 100))
        mock_limiter.check_token_bucket = AsyncMock(return_value=(True, 100))
        mock_limiter.check_fixed_window = AsyncMock(return_value=(True, 100))
        mock_limiter.get_reset_time = AsyncMock(return_value=0)

        with TestClient(app) as client:
            product_id = "prod_delete_001"

            response = client.delete(f"/api/v1/inventory/products/{product_id}")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "deleted"
            assert data["id"] == product_id

            # Verify call
            assert mock_queue_service.enqueue_job.called
            call_args = mock_queue_service.enqueue_job.call_args
            assert call_args.kwargs["job_type"] == "search_indexing"
            assert call_args.kwargs["payload"]["action"] == "delete"
            assert call_args.kwargs["payload"]["index"] == "products"
            assert call_args.kwargs["payload"]["document_id"] == product_id

    # Clean up dependency override
    if get_queue_service in app.dependency_overrides:
        del app.dependency_overrides[get_queue_service]
