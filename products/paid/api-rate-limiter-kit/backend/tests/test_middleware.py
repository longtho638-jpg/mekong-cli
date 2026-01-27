import pytest
import time

def test_middleware_enforcement(client):
    # 1. Create a rule for a specific path
    rule_data = {
        "path": "/api/v1/middleware-test",
        "method": "GET",
        "limit": 2,
        "window": 1,
        "strategy": "fixed"
    }
    client.post("/api/v1/admin/rules/", json=rule_data)

    # 2. Add a dummy endpoint in main.py?
    # Since we can't easily modify main.py from here during test execution without reloading,
    # we rely on the middleware intercepting even 404s if we configured it that way,
    # OR we assume the middleware allows the request to proceed to 404 but checks limits first.
    # However, the middleware usually passes request to next.
    # But wait, our middleware code checks `call_next(request)`.
    # If we hit a non-existent endpoint, it returns 404.
    # The rate limit check happens BEFORE `call_next`.

    # So we can hit "/api/v1/middleware-test" (which doesn't exist)
    # It should return 404 for the first 2 requests, then 429 for the 3rd.

    # Req 1: Allowed (404)
    res1 = client.get("/api/v1/middleware-test")
    # Note: Depending on where the router is mounted, it might return 404.
    # But headers should be present.
    assert "X-RateLimit-Remaining" in res1.headers

    # Req 2: Allowed
    res2 = client.get("/api/v1/middleware-test")

    # Req 3: Blocked (429)
    res3 = client.get("/api/v1/middleware-test")
    assert res3.status_code == 429
    assert res3.json()["detail"] == "Too Many Requests"

def test_token_bucket_strategy(client):
    rule_data = {
        "path": "/api/v1/bucket-test",
        "method": "GET",
        "limit": 3,
        "window": 1,
        "strategy": "token_bucket"
    }
    client.post("/api/v1/admin/rules/", json=rule_data)

    # Burst 3
    for _ in range(3):
        res = client.get("/api/v1/bucket-test")
        assert res.status_code != 429

    # 4th should fail
    res = client.get("/api/v1/bucket-test")
    assert res.status_code == 429
