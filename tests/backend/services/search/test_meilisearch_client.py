"""
Unit Tests for Meilisearch Client
=================================
"""

import unittest
from unittest.mock import MagicMock, patch

from backend.services.search.meilisearch_client import MeilisearchClient


class TestMeilisearchClient(unittest.TestCase):

    @patch('meilisearch.Client')
    def test_client_initialization(self, mock_meilisearch):
        """Test that the client is initialized correctly."""
        # Reset singleton instance
        MeilisearchClient._instance = None

        client = MeilisearchClient()
        self.assertIsNotNone(client.client)
        mock_meilisearch.assert_called_once()

    @patch('meilisearch.Client')
    def test_singleton_pattern(self, mock_meilisearch):
        """Test that the client follows singleton pattern."""
        MeilisearchClient._instance = None

        client1 = MeilisearchClient()
        client2 = MeilisearchClient()

        self.assertIs(client1, client2)
        mock_meilisearch.assert_called_once()

    @patch('meilisearch.Client')
    def test_is_healthy(self, mock_meilisearch):
        """Test health check."""
        MeilisearchClient._instance = None
        mock_client_instance = MagicMock()
        mock_meilisearch.return_value = mock_client_instance

        # Test healthy
        mock_client_instance.is_healthy.return_value = True
        client = MeilisearchClient()
        self.assertTrue(client.is_healthy())

        # Test unhealthy (exception)
        mock_client_instance.is_healthy.side_effect = Exception("Connection error")
        self.assertFalse(client.is_healthy())

    @patch('meilisearch.Client')
    def test_get_version(self, mock_meilisearch):
        """Test getting version."""
        MeilisearchClient._instance = None
        mock_client_instance = MagicMock()
        mock_meilisearch.return_value = mock_client_instance

        expected_version = {'pkgVersion': '1.6.0'}
        mock_client_instance.get_version.return_value = expected_version

        client = MeilisearchClient()
        self.assertEqual(client.get_version(), expected_version)
