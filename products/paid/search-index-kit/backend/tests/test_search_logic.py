import pytest
from unittest.mock import MagicMock
from app.crud import get_search_results, get_autocomplete_suggestions
from app import models, schemas

def test_get_search_results_mock():
    # Mock database session
    db = MagicMock()

    # Mock query chain
    mock_query = db.query.return_value
    mock_filter = mock_query.filter.return_value
    mock_order_by = mock_filter.order_by.return_value

    # Mock count and limit/offset
    mock_order_by.count.return_value = 1

    # Mock result row: (SearchDocument, rank, snippet)
    mock_doc = models.SearchDocument(id=1, title="Test Doc", url="/test", category="test")
    mock_order_by.offset.return_value.limit.return_value.all.return_value = [
        (mock_doc, 0.9, "<b>Test</b> snippet")
    ]

    results, total = get_search_results(db, "Test")

    assert total == 1
    assert len(results) == 1
    assert results[0].title == "Test Doc"
    assert results[0].score == 0.9
    assert results[0].snippet == "<b>Test</b> snippet"

def test_get_autocomplete_suggestions_mock():
    db = MagicMock()

    # Mock query chain
    mock_query = db.query.return_value
    mock_filter = mock_query.filter.return_value
    mock_limit = mock_filter.limit.return_value

    # Mock results
    mock_limit.all.return_value = [("Test Doc 1",), ("Test Doc 2",)]

    suggestions = get_autocomplete_suggestions(db, "Test")

    assert len(suggestions) == 2
    assert suggestions[0][0] == "Test Doc 1"

