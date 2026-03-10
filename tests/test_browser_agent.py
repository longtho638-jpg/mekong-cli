"""Tests for Mekong Browser Agent (AGI v2)."""

import subprocess
import unittest

from src.core.browser_agent import (
    BrowserAction,
    BrowserAgent,
    BrowserResult,
    PageInfo,
)


def _has_network():
    """Check if network is available."""
    try:
        result = subprocess.run(
            ["curl", "-sL", "-o", "/dev/null", "-w", "%{http_code}",
             "--max-time", "5", "https://httpbin.org/status/200"],
            capture_output=True, text=True, timeout=10,
        )
        return result.stdout.strip() == "200"
    except Exception:
        return False


_NETWORK = _has_network()


class TestBrowserResult(unittest.TestCase):
    def test_default_values(self):
        r = BrowserResult(action=BrowserAction.NAVIGATE)
        self.assertFalse(r.success)
        self.assertEqual(r.url, "")
        self.assertEqual(r.status_code, 0)

    def test_fields_settable(self):
        r = BrowserResult(
            action=BrowserAction.CHECK_STATUS,
            success=True,
            url="https://example.com",
            status_code=200,
        )
        self.assertTrue(r.success)
        self.assertEqual(r.status_code, 200)


class TestPageInfo(unittest.TestCase):
    def test_default_values(self):
        p = PageInfo(url="https://test.com")
        self.assertEqual(p.url, "https://test.com")
        self.assertEqual(p.title, "")
        self.assertEqual(p.links, [])


class TestBrowserAgent(unittest.TestCase):
    def test_init(self):
        agent = BrowserAgent()
        self.assertIsNotNone(agent)

    @unittest.skipUnless(_NETWORK, "Network unavailable")
    def test_check_status(self):
        agent = BrowserAgent()
        result = agent.check_status("https://httpbin.org/status/200")
        self.assertTrue(result.success)
        self.assertEqual(result.status_code, 200)

    @unittest.skipUnless(_NETWORK, "Network unavailable")
    def test_navigate(self):
        agent = BrowserAgent()
        result = agent.navigate("https://httpbin.org/html")
        self.assertTrue(result.success)
        self.assertEqual(result.status_code, 200)
        self.assertGreater(len(result.content), 0)

    @unittest.skipUnless(_NETWORK, "Network unavailable")
    def test_extract_text(self):
        agent = BrowserAgent()
        result = agent.extract_text("https://httpbin.org/html")
        self.assertTrue(result.success)
        self.assertNotIn("<html>", result.content)

    @unittest.skipUnless(_NETWORK, "Network unavailable")
    def test_get_links(self):
        agent = BrowserAgent()
        result = agent.get_links("https://httpbin.org")
        self.assertTrue(result.success)

    @unittest.skipUnless(_NETWORK, "Network unavailable")
    def test_analyze_page(self):
        agent = BrowserAgent()
        info = agent.analyze_page("https://httpbin.org/html")
        self.assertEqual(info.status_code, 200)
        self.assertGreater(len(info.text_content), 0)

    @unittest.skipUnless(_NETWORK, "Network unavailable")
    def test_history(self):
        agent = BrowserAgent()
        agent.check_status("https://httpbin.org/status/200")
        history = agent.get_history()
        self.assertEqual(len(history), 1)

    @unittest.skipUnless(_NETWORK, "Network unavailable")
    def test_stats(self):
        agent = BrowserAgent()
        agent.check_status("https://httpbin.org/status/200")
        stats = agent.get_stats()
        self.assertEqual(stats["total_actions"], 1)
        self.assertIn("playwright_available", stats)

    @unittest.skipUnless(_NETWORK, "Network unavailable")
    def test_invalid_url(self):
        agent = BrowserAgent()
        result = agent.check_status("https://this-domain-does-not-exist-12345.com")
        self.assertFalse(result.success)

    def test_stats_empty(self):
        agent = BrowserAgent()
        stats = agent.get_stats()
        self.assertEqual(stats["total_actions"], 0)


if __name__ == "__main__":
    unittest.main()
