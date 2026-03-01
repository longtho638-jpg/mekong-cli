"""Tests for LLM response cache — Portkey-inspired caching layer."""

import time
import unittest

from src.core.llm_cache import CacheEntry, CacheStats, LLMCache


class TestCacheEntry(unittest.TestCase):
    """Test CacheEntry dataclass."""

    def test_not_expired_by_default(self):
        entry = CacheEntry(
            key="abc", content="hello", model="gpt-4o",
            created_at=time.time(), ttl=3600,
        )
        self.assertFalse(entry.is_expired)

    def test_expired_after_ttl(self):
        entry = CacheEntry(
            key="abc", content="hello", model="gpt-4o",
            created_at=time.time() - 100, ttl=50,
        )
        self.assertTrue(entry.is_expired)

    def test_zero_ttl_never_expires(self):
        entry = CacheEntry(
            key="abc", content="hello", model="gpt-4o",
            created_at=time.time() - 999999, ttl=0,
        )
        self.assertFalse(entry.is_expired)


class TestCacheStats(unittest.TestCase):
    """Test CacheStats dataclass."""

    def test_hit_rate_zero(self):
        stats = CacheStats()
        self.assertEqual(stats.hit_rate, 0.0)

    def test_hit_rate_calculation(self):
        stats = CacheStats(hits=7, misses=3)
        self.assertAlmostEqual(stats.hit_rate, 70.0)

    def test_hit_rate_all_hits(self):
        stats = CacheStats(hits=10, misses=0)
        self.assertAlmostEqual(stats.hit_rate, 100.0)


class TestLLMCache(unittest.TestCase):
    """Test LLMCache operations."""

    def setUp(self):
        self.cache = LLMCache(max_entries=5, default_ttl=3600)
        self.messages = [{"role": "user", "content": "hello world"}]

    def test_miss_on_empty_cache(self):
        result = self.cache.get(self.messages, "gpt-4o")
        self.assertIsNone(result)
        self.assertEqual(self.cache.stats.misses, 1)

    def test_put_and_get(self):
        self.cache.put(self.messages, "response text", "gpt-4o")
        result = self.cache.get(self.messages, "gpt-4o")
        self.assertIsNotNone(result)
        self.assertEqual(result.content, "response text")
        self.assertEqual(result.model, "gpt-4o")
        self.assertEqual(self.cache.stats.hits, 1)

    def test_different_model_different_key(self):
        self.cache.put(self.messages, "response-a", "gpt-4o")
        result = self.cache.get(self.messages, "gemini-2.5-pro")
        self.assertIsNone(result)

    def test_different_temperature_different_key(self):
        self.cache.put(self.messages, "warm", "gpt-4o", temperature=0.9)
        result = self.cache.get(self.messages, "gpt-4o", temperature=0.1)
        self.assertIsNone(result)

    def test_lru_eviction(self):
        """Oldest entry evicted when cache is full."""
        for i in range(6):  # max_entries=5
            msgs = [{"role": "user", "content": f"msg-{i}"}]
            self.cache.put(msgs, f"resp-{i}", "gpt-4o")
        self.assertEqual(self.cache.stats.total_entries, 5)
        self.assertEqual(self.cache.stats.evictions, 1)
        # First entry should be evicted
        first = [{"role": "user", "content": "msg-0"}]
        self.assertIsNone(self.cache.get(first, "gpt-4o"))

    def test_expired_entry_returns_none(self):
        self.cache.put(self.messages, "old response", "gpt-4o", ttl=0)
        # Hack: manually set created_at to past
        key = self.cache._make_key(self.messages, "gpt-4o", 0.7)
        self.cache._cache[key].created_at = time.time() - 10
        self.cache._cache[key].ttl = 5
        result = self.cache.get(self.messages, "gpt-4o")
        self.assertIsNone(result)

    def test_invalidate(self):
        key = self.cache.put(self.messages, "response", "gpt-4o")
        self.assertTrue(self.cache.invalidate(key))
        self.assertIsNone(self.cache.get(self.messages, "gpt-4o"))

    def test_invalidate_nonexistent(self):
        self.assertFalse(self.cache.invalidate("nonexistent-key"))

    def test_clear(self):
        self.cache.put(self.messages, "response", "gpt-4o")
        count = self.cache.clear()
        self.assertEqual(count, 1)
        self.assertEqual(self.cache.stats.total_entries, 0)

    def test_cleanup_expired(self):
        self.cache.put(self.messages, "response", "gpt-4o", ttl=1)
        # Hack: set created_at to past
        key = self.cache._make_key(self.messages, "gpt-4o", 0.7)
        self.cache._cache[key].created_at = time.time() - 10
        self.cache._cache[key].ttl = 5
        removed = self.cache.cleanup_expired()
        self.assertEqual(removed, 1)

    def test_get_stats(self):
        self.cache.put(self.messages, "resp", "gpt-4o")
        self.cache.get(self.messages, "gpt-4o")  # hit
        self.cache.get([{"role": "user", "content": "other"}], "gpt-4o")  # miss
        stats = self.cache.get_stats()
        self.assertEqual(stats["hits"], 1)
        self.assertEqual(stats["misses"], 1)
        self.assertEqual(stats["hit_rate"], 50.0)
        self.assertEqual(stats["total_entries"], 1)

    def test_hit_increments_hit_count(self):
        self.cache.put(self.messages, "resp", "gpt-4o")
        self.cache.get(self.messages, "gpt-4o")
        self.cache.get(self.messages, "gpt-4o")
        key = self.cache._make_key(self.messages, "gpt-4o", 0.7)
        self.assertEqual(self.cache._cache[key].hit_count, 2)

    def test_cost_saved_tracking(self):
        self.cache.put(self.messages, "resp", "gpt-4o")
        self.cache.get(self.messages, "gpt-4o")
        self.assertGreater(self.cache.stats.estimated_cost_saved, 0)

    def test_usage_stored(self):
        usage = {"input_tokens": 10, "output_tokens": 50, "total_tokens": 60}
        self.cache.put(self.messages, "resp", "gpt-4o", usage=usage)
        result = self.cache.get(self.messages, "gpt-4o")
        self.assertEqual(result.usage["total_tokens"], 60)


if __name__ == "__main__":
    unittest.main()
