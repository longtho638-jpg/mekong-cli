"""Integration tests for packages/memory — Mem0 + Qdrant facade."""

import os
import tempfile
from unittest.mock import patch, MagicMock


class TestQdrantProvider:
    def test_connect_returns_false_when_qdrant_unavailable(self):
        """QdrantProvider.connect() returns False when qdrant-client not installed."""
        from packages.memory.qdrant_provider import QdrantProvider
        provider = QdrantProvider("http://localhost:6333", "test_col", 1536)
        with patch("packages.memory.qdrant_provider.QDRANT_AVAILABLE", False):
            result = provider.connect()
            assert result is False

    def test_connect_with_mock_client(self):
        """QdrantProvider.connect() returns True when Qdrant reachable via mock."""
        import packages.memory.qdrant_provider as qdrant_mod
        if not qdrant_mod.QDRANT_AVAILABLE:
            # qdrant-client not installed — test graceful degradation path
            from packages.memory.qdrant_provider import QdrantProvider
            provider = QdrantProvider("http://localhost:6333", "test_col", 1536)
            assert provider.connect() is False
            return
        # qdrant-client available — test real mock path
        from packages.memory.qdrant_provider import QdrantProvider
        provider = QdrantProvider("http://localhost:6333", "test_col", 1536)
        with patch("packages.memory.qdrant_provider.QdrantClient") as MockClient:
            mock_instance = MagicMock()
            MockClient.return_value = mock_instance
            mock_instance.get_collections.return_value = MagicMock(collections=[])
            result = provider.connect()
            assert isinstance(result, bool)
            assert result is True

    def test_health_check_when_disconnected(self):
        """health_check() returns False when not connected."""
        from packages.memory.qdrant_provider import QdrantProvider
        provider = QdrantProvider("http://localhost:6333", "test_col", 1536)
        assert provider.health_check() is False

    def test_is_connected_property_default(self):
        """is_connected is False on fresh provider."""
        from packages.memory.qdrant_provider import QdrantProvider
        provider = QdrantProvider("http://localhost:6333", "test_col", 1536)
        assert provider.is_connected is False

    def test_client_property_none_when_not_connected(self):
        """client property returns None when not connected."""
        from packages.memory.qdrant_provider import QdrantProvider
        provider = QdrantProvider("http://localhost:6333", "test_col", 1536)
        assert provider.client is None

    def test_close_safe_when_not_connected(self):
        """close() doesn't raise when never connected."""
        from packages.memory.qdrant_provider import QdrantProvider
        provider = QdrantProvider("http://localhost:6333", "test_col", 1536)
        provider.close()  # Should not raise


class TestMemoryFacade:
    def test_facade_singleton(self):
        """get_memory_facade returns same instance on repeated calls."""
        import packages.memory.memory_facade as mf_module
        # Reset singleton to ensure clean state
        mf_module._facade = None
        from packages.memory.memory_facade import get_memory_facade
        f1 = get_memory_facade()
        f2 = get_memory_facade()
        assert f1 is f2
        # Cleanup
        mf_module._facade = None

    def test_add_returns_false_when_not_connected(self):
        """add() returns False when vector backend unavailable."""
        from packages.memory.memory_facade import MemoryFacade
        facade = MemoryFacade()
        result = facade.add("test content", user_id="agent:session")
        assert result is False

    def test_search_returns_empty_when_not_connected(self):
        """search() returns empty list when vector unavailable."""
        from packages.memory.memory_facade import MemoryFacade
        facade = MemoryFacade()
        results = facade.search("test query")
        assert results == []

    def test_forget_returns_false_when_not_connected(self):
        """forget() returns False when disconnected."""
        from packages.memory.memory_facade import MemoryFacade
        facade = MemoryFacade()
        assert facade.forget("some-id") is False

    def test_provider_status_yaml_fallback(self):
        """get_provider_status() shows yaml fallback when disconnected."""
        from packages.memory.memory_facade import MemoryFacade
        facade = MemoryFacade()
        status = facade.get_provider_status()
        assert status["active_provider"] == "yaml"
        assert status["vector_ready"] is False

    def test_provider_status_keys_present(self):
        """get_provider_status() returns all expected keys."""
        from packages.memory.memory_facade import MemoryFacade
        facade = MemoryFacade()
        status = facade.get_provider_status()
        for key in ("vector_ready", "qdrant_connected", "mem0_available", "active_provider"):
            assert key in status

    def test_close_does_not_raise(self):
        """close() on disconnected facade doesn't raise."""
        from packages.memory.memory_facade import MemoryFacade
        facade = MemoryFacade()
        facade.close()  # Should not raise


class TestMemoryStoreBackwardCompat:
    def test_record_still_works(self):
        """MemoryStore.record() works without Qdrant."""
        from src.core.memory import MemoryStore, MemoryEntry
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
            store = MemoryStore(os.path.join(tmp, "test_mem.yaml"))
            entry = MemoryEntry(goal="test goal", status="success")
            store.record(entry)
            results = store.query("test")
            assert len(results) == 1
            assert results[0].goal == "test goal"

    def test_query_still_works(self):
        """MemoryStore.query() substring search still functional."""
        from src.core.memory import MemoryStore, MemoryEntry
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
            store = MemoryStore(os.path.join(tmp, "test_mem.yaml"))
            store.record(MemoryEntry(goal="deploy production", status="success"))
            store.record(MemoryEntry(goal="run tests", status="failed"))
            assert len(store.query("deploy")) == 1
            assert len(store.query("tests")) == 1

    def test_empty_query_returns_all(self):
        """MemoryStore.query('') returns all entries."""
        from src.core.memory import MemoryStore, MemoryEntry
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
            store = MemoryStore(os.path.join(tmp, "test_mem.yaml"))
            store.record(MemoryEntry(goal="task one", status="success"))
            store.record(MemoryEntry(goal="task two", status="success"))
            results = store.query("")
            assert len(results) == 2
