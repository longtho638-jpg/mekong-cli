from datetime import datetime
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.api.main import app
from backend.models.enums import ABTestStatus
from backend.models.landing_page import ABTest, LandingPage, LandingPageCreate
from backend.services.landing_page_service import LandingPageService

client = TestClient(app)


@pytest.fixture
def db_session():
    # Mock database session for unit/integration testing without real DB
    session = MagicMock(spec=Session)
    return session


def test_create_landing_page(db_session):
    # This test was empty/pass in original file, keeping it essentially skipped or pass
    pass


def test_service_create_page():
    mock_db = MagicMock(spec=Session)
    service = LandingPageService(mock_db)

    page_create = LandingPageCreate(
        title="Test Page", slug="test-slug", content_json={}, seo_metadata={}
    )

    # Mock query returning None (no existing slug)
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = service.create_landing_page(page_create)

    assert result.title == "Test Page"
    assert result.slug == "test-slug"
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()


def test_service_duplicate_page():
    mock_db = MagicMock(spec=Session)
    service = LandingPageService(mock_db)

    # Original page
    original = LandingPage(
        id=1, title="Original", slug="orig", content_json={"foo": "bar"}, template_id="tpl-1"
    )

    mock_db.query.return_value.filter.return_value.first.return_value = original

    result = service.duplicate_landing_page(1, "New Page", "new-slug")

    assert result.title == "New Page"
    assert result.slug == "new-slug"
    assert result.content_json == {"foo": "bar"}
    assert result.template_id == "tpl-1"
    assert result.is_published is False
    mock_db.add.assert_called_once()


def test_service_publish_unpublish():
    mock_db = MagicMock(spec=Session)
    service = LandingPageService(mock_db)

    page = LandingPage(id=1, is_published=False)
    mock_db.query.return_value.filter.return_value.first.return_value = page

    # Publish
    service.publish_landing_page(1)
    assert page.is_published is True

    # Unpublish
    service.unpublish_landing_page(1)
    assert page.is_published is False
