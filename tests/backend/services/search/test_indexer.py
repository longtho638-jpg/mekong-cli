"""
Unit Tests for Search Indexer
=============================
"""

import unittest
from unittest.mock import MagicMock, patch

from backend.services.search.config import INDEXES
from backend.services.search.indexer import SearchIndexer


class TestSearchIndexer(unittest.TestCase):

    def setUp(self):
        self.mock_client = MagicMock()
        self.patcher = patch('backend.services.search.indexer.get_meilisearch_client')
        self.mock_get_client = self.patcher.start()
        self.mock_get_client.return_value.client = self.mock_client
        self.indexer = SearchIndexer()

    def tearDown(self):
        self.patcher.stop()

    def test_create_index_success(self):
        """Test creating a valid index."""
        index_name = "users"
        mock_index_obj = MagicMock()
        self.mock_client.index.return_value = mock_index_obj

        self.indexer.create_index(index_name)

        self.mock_client.create_index.assert_called()
        self.mock_client.index.assert_called_with(index_name)
        mock_index_obj.update_settings.assert_called()

    def test_create_index_invalid(self):
        """Test creating an invalid index raises error."""
        with self.assertRaises(ValueError):
            self.indexer.create_index("invalid_index_name")

    def test_add_documents(self):
        """Test adding documents."""
        index_name = "users"
        docs = [{"id": 1, "name": "Test"}]

        mock_index_obj = MagicMock()
        self.mock_client.index.return_value = mock_index_obj
        mock_task = MagicMock()
        mock_task.task_uid = 123
        mock_index_obj.add_documents.return_value = mock_task

        result = self.indexer.add_documents(index_name, docs)

        self.assertEqual(result['status'], 'enqueued')
        self.assertEqual(result['task_uid'], 123)
        mock_index_obj.add_documents.assert_called_with(docs)

    def test_add_documents_empty(self):
        """Test adding empty documents list."""
        result = self.indexer.add_documents("users", [])
        self.assertEqual(result['status'], 'skipped')

    def test_delete_document(self):
        """Test deleting a document."""
        index_name = "users"
        doc_id = "123"

        mock_index_obj = MagicMock()
        self.mock_client.index.return_value = mock_index_obj
        mock_task = MagicMock()
        mock_task.task_uid = 456
        mock_index_obj.delete_document.return_value = mock_task

        result = self.indexer.delete_document(index_name, doc_id)

        self.assertEqual(result['status'], 'enqueued')
        mock_index_obj.delete_document.assert_called_with(doc_id)
