from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from app import models, crud, schemas
import pytest
from unittest.mock import MagicMock

client = TestClient(app)

# Mock DB dependency
def override_get_db():
    try:
        db = MagicMock()
        yield db
    finally:
        pass

app.dependency_overrides[get_db] = override_get_db

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Search Index Kit API is running"}

def test_search_endpoint_mock(monkeypatch):
    # We need to patch crud.get_search_results since we can't easily mock the intricate sqlalchemy chain in the dependency
    # for the endpoint integration test without a real DB or complex mocks.
    # However, since we are overriding get_db, the endpoint receives a MagicMock.
    # The endpoint calls crud.get_search_results(db, ...).
    # We can mock crud.get_search_results directly.

    mock_results = [
        schemas.SearchResult(id=1, title="Test", url="/", score=1.0, snippet="Test", category="general")
    ]
    monkeypatch.setattr("app.crud.get_search_results", lambda db, q, p, ps, c: (mock_results, 1))

    response = client.post("/api/search?query=test")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["results"][0]["title"] == "Test"

def test_autocomplete_endpoint_mock(monkeypatch):
    monkeypatch.setattr("app.crud.get_autocomplete_suggestions", lambda db, q, l: [("Test 1",)])

    response = client.get("/api/search/autocomplete?query=test")
    assert response.status_code == 200
    data = response.json()
    assert data["suggestions"] == ["Test 1"]
