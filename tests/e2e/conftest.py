import pytest
pydantic_settings = pytest.importorskip("pydantic_settings", reason="pydantic-settings not installed")

from fastapi.testclient import TestClient  # noqa: E402

from backend.api.main import app  # noqa: E402


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
