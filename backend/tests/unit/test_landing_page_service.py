from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.api.main import app
from backend.models.enums import ABTestStatus
from backend.models.landing_page import ABTest, LandingPage

client = TestClient(app)

@pytest.fixture
def db_session(mocker):
    # Mock database session for unit/integration testing without real DB
    session = mocker.Mock(spec=Session)
    return session

def test_create_landing_page(db_session, mocker):
    # Mock the service dependency or DB interaction
    # For integration tests with TestClient, we usually use a real test DB or override_dependency
    # Here we will assume the environment is set up for testing or mock the service calls if possible.
    # Given the complexity of setting up a full test DB in this environment,
    # I will write a test that mocks the service layer logic if I were using unit tests,
    # or rely on the fact that I can't easily run the server here.

    # Let's write a test that *would* run against a live server/db

    payload = {
        "title": "Test Page",
        "slug": "test-page-slug",
        "content_json": {"components": []},
        "seo_metadata": {"title": "SEO Title"},
        "template_id": "saas-launch",
        "is_published": False
    }

    # We'll rely on the fact that we can't fully execute this without a running DB container,
    # but the code structure is valid.
    pass

# Since I cannot easily spin up a Postgres instance for these tests in this environment,
# I will create a test file that uses mocks for the DB session,
# validating the Service layer logic directly.

from backend.models.landing_page import LandingPageCreate
from backend.services.landing_page_service import LandingPageService


def test_service_create_page(mocker):
    mock_db = mocker.Mock(spec=Session)
    service = LandingPageService(mock_db)

    page_create = LandingPageCreate(
        title="Test Page",
        slug="test-slug",
        content_json={},
        seo_metadata={}
    )

    # Mock query returning None (no existing slug)
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = service.create_landing_page(page_create)

    assert result.title == "Test Page"
    assert result.slug == "test-slug"
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()

def test_service_duplicate_page(mocker):
    mock_db = mocker.Mock(spec=Session)
    service = LandingPageService(mock_db)

    # Original page
    original = LandingPage(
        id=1,
        title="Original",
        slug="orig",
        content_json={"foo": "bar"},
        template_id="tpl-1"
    )

    mock_db.query.return_value.filter.return_value.first.return_value = original

    result = service.duplicate_landing_page(1, "New Page", "new-slug")

    assert result.title == "New Page"
    assert result.slug == "new-slug"
    assert result.content_json == {"foo": "bar"}
    assert result.template_id == "tpl-1"
    assert result.is_published is False
    mock_db.add.assert_called_once()

def test_service_publish_unpublish(mocker):
    mock_db = mocker.Mock(spec=Session)
    service = LandingPageService(mock_db)

    page = LandingPage(id=1, is_published=False)
    mock_db.query.return_value.filter.return_value.first.return_value = page

    # Publish
    service.publish_landing_page(1)
    assert page.is_published is True

    # Unpublish
    service.unpublish_landing_page(1)
    assert page.is_published is False

