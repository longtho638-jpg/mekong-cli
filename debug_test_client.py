
from fastapi.testclient import TestClient

from backend.api.auth.dependencies import get_current_user_id
from backend.main import app

# Override auth
app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"

client = TestClient(app)

print("Testing POST /api/exports/")
response = client.post("/api/exports/", json={
    "format": "csv",
    "resource_type": "users",
    "filters": {"active": True},
    "columns": ["id", "email"]
})
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

print("\nTesting GET /api/exports/")
response = client.get("/api/exports/")
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
