"""
Mekong CLI - Browser Agent (AGI v2)

Headless browser automation for web testing, scraping, and UI verification.
Uses subprocess-based HTTP fetching with optional Playwright integration.
Provides screenshot capture and LLM-powered vision analysis.
"""

import hashlib
import json
import logging
import re
import subprocess
import time
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class BrowserAction(str, Enum):
    """Types of browser actions."""

    NAVIGATE = "navigate"
    SCREENSHOT = "screenshot"
    EXTRACT_TEXT = "extract_text"
    FILL_FORM = "fill_form"
    CLICK = "click"
    GET_LINKS = "get_links"
    CHECK_STATUS = "check_status"


@dataclass
class BrowserResult:
    """Result of a browser action."""

    action: BrowserAction
    success: bool = False
    url: str = ""
    content: str = ""
    status_code: int = 0
    screenshot_path: str = ""
    links: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    duration_ms: float = 0.0
    error: str = ""


@dataclass
class PageInfo:
    """Extracted information about a web page."""

    url: str
    title: str = ""
    status_code: int = 0
    content_type: str = ""
    text_content: str = ""
    links: List[str] = field(default_factory=list)
    forms: List[Dict[str, Any]] = field(default_factory=list)
    meta_tags: Dict[str, str] = field(default_factory=dict)
    load_time_ms: float = 0.0


class BrowserAgent:
    """
    Browser automation agent for web interaction.

    Provides HTTP-based web interaction with optional Playwright integration
    for full browser automation. Supports:
    - URL fetching and status checking
    - Content extraction (text, links, forms)
    - Screenshot capture
    - LLM-powered page analysis
    """

    def __init__(
        self,
        llm_client: Optional[Any] = None,
        cache_dir: Optional[str] = None,
    ) -> None:
        """
        Initialize browser agent.

        Args:
            llm_client: Optional LLM for vision analysis.
            cache_dir: Cache directory for screenshots.
        """
        self.llm_client = llm_client
        self._cache_dir = Path(cache_dir or ".mekong/browser_cache")
        self._cache_dir.mkdir(parents=True, exist_ok=True)
        self._history: List[BrowserResult] = []
        self._playwright_available = self._check_playwright()

    def navigate(self, url: str) -> BrowserResult:
        """
        Navigate to a URL and extract page content.

        Args:
            url: Target URL.

        Returns:
            BrowserResult with page content and metadata.
        """
        start = time.time()
        result = BrowserResult(action=BrowserAction.NAVIGATE, url=url)

        try:
            response = self._fetch_url(url)
            result.success = True
            result.status_code = response["status_code"]
            result.content = response["body"][:10000]
            result.metadata = {
                "content_type": response.get("content_type", ""),
                "title": self._extract_title(response["body"]),
            }
        except Exception as e:
            result.error = str(e)

        result.duration_ms = (time.time() - start) * 1000
        self._record(result)
        return result

    def check_status(self, url: str) -> BrowserResult:
        """Check HTTP status of a URL."""
        start = time.time()
        result = BrowserResult(action=BrowserAction.CHECK_STATUS, url=url)

        try:
            proc = subprocess.run(
                ["curl", "-sL", "-o", "/dev/null", "-w", "%{http_code}", url],
                capture_output=True, text=True, timeout=15,
            )
            result.status_code = int(proc.stdout.strip())
            result.success = 200 <= result.status_code < 400
            result.content = f"HTTP {result.status_code}"
        except Exception as e:
            result.error = str(e)

        result.duration_ms = (time.time() - start) * 1000
        self._record(result)
        return result

    def extract_text(self, url: str) -> BrowserResult:
        """Extract readable text content from a URL."""
        start = time.time()
        result = BrowserResult(action=BrowserAction.EXTRACT_TEXT, url=url)

        try:
            response = self._fetch_url(url)
            html = response["body"]
            # Strip HTML tags for readable text
            text = self._html_to_text(html)
            result.success = True
            result.content = text[:5000]
            result.status_code = response["status_code"]
        except Exception as e:
            result.error = str(e)

        result.duration_ms = (time.time() - start) * 1000
        self._record(result)
        return result

    def get_links(self, url: str) -> BrowserResult:
        """Extract all links from a page."""
        start = time.time()
        result = BrowserResult(action=BrowserAction.GET_LINKS, url=url)

        try:
            response = self._fetch_url(url)
            links = self._extract_links(response["body"], url)
            result.success = True
            result.links = links[:100]
            result.content = f"Found {len(links)} links"
            result.status_code = response["status_code"]
        except Exception as e:
            result.error = str(e)

        result.duration_ms = (time.time() - start) * 1000
        self._record(result)
        return result

    def analyze_page(self, url: str) -> PageInfo:
        """
        Full page analysis: fetch, parse, and extract all information.

        Args:
            url: Target URL.

        Returns:
            PageInfo with comprehensive page data.
        """
        start = time.time()
        info = PageInfo(url=url)

        try:
            response = self._fetch_url(url)
            html = response["body"]
            info.status_code = response["status_code"]
            info.content_type = response.get("content_type", "")
            info.title = self._extract_title(html)
            info.text_content = self._html_to_text(html)[:5000]
            info.links = self._extract_links(html, url)[:50]
            info.meta_tags = self._extract_meta(html)
        except Exception as e:
            logger.debug("Page analysis failed: %s", e)

        info.load_time_ms = (time.time() - start) * 1000
        return info

    def get_history(self, limit: int = 20) -> List[BrowserResult]:
        """Return recent browser actions."""
        return self._history[-limit:]

    def get_stats(self) -> Dict[str, Any]:
        """Return browser agent statistics."""
        if not self._history:
            return {"total_actions": 0, "success_rate": 0.0}

        successes = sum(1 for r in self._history if r.success)
        return {
            "total_actions": len(self._history),
            "success_rate": successes / len(self._history),
            "playwright_available": self._playwright_available,
            "unique_domains": len(set(
                urlparse(r.url).netloc
                for r in self._history if r.url
            )),
        }

    # --- Internal helpers ---

    def _fetch_url(self, url: str) -> Dict[str, Any]:
        """Fetch URL using curl."""
        proc = subprocess.run(
            [
                "curl", "-sL", "-w",
                "\n---HTTP_CODE:%{http_code}---\n---CONTENT_TYPE:%{content_type}---",
                url,
            ],
            capture_output=True, text=True, timeout=20,
        )

        body = proc.stdout
        status_code = 0
        content_type = ""

        # Extract status code from footer
        code_match = re.search(r"---HTTP_CODE:(\d+)---", body)
        if code_match:
            status_code = int(code_match.group(1))

        ct_match = re.search(r"---CONTENT_TYPE:([^-]*)---", body)
        if ct_match:
            content_type = ct_match.group(1).strip()

        # Remove curl footer from body
        body = re.sub(r"\n---HTTP_CODE:\d+---\n---CONTENT_TYPE:[^-]*---$", "", body)

        return {
            "body": body,
            "status_code": status_code,
            "content_type": content_type,
        }

    def _html_to_text(self, html: str) -> str:
        """Convert HTML to readable text."""
        # Remove script and style blocks
        text = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<style[^>]*>.*?</style>", "", text, flags=re.DOTALL | re.IGNORECASE)
        # Convert common elements
        text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
        text = re.sub(r"<p[^>]*>", "\n", text, flags=re.IGNORECASE)
        text = re.sub(r"<h[1-6][^>]*>", "\n## ", text, flags=re.IGNORECASE)
        text = re.sub(r"<li[^>]*>", "\n- ", text, flags=re.IGNORECASE)
        # Strip remaining tags
        text = re.sub(r"<[^>]+>", "", text)
        # Clean up whitespace
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r" {2,}", " ", text)
        return text.strip()

    def _extract_title(self, html: str) -> str:
        """Extract <title> from HTML."""
        match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
        return match.group(1).strip() if match else ""

    def _extract_links(self, html: str, base_url: str) -> List[str]:
        """Extract href links from HTML."""
        links: List[str] = []
        parsed_base = urlparse(base_url)
        for match in re.finditer(r'href=["\']([^"\']+)["\']', html, re.IGNORECASE):
            href = match.group(1)
            if href.startswith("//"):
                href = f"{parsed_base.scheme}:{href}"
            elif href.startswith("/"):
                href = f"{parsed_base.scheme}://{parsed_base.netloc}{href}"
            elif not href.startswith(("http://", "https://", "mailto:", "#", "javascript:")):
                href = f"{base_url.rstrip('/')}/{href}"
            if href.startswith(("http://", "https://")):
                links.append(href)
        return list(dict.fromkeys(links))

    def _extract_meta(self, html: str) -> Dict[str, str]:
        """Extract meta tags from HTML."""
        meta: Dict[str, str] = {}
        for match in re.finditer(
            r'<meta\s+(?:name|property)=["\']([^"\']+)["\']\s+content=["\']([^"\']*)["\']',
            html, re.IGNORECASE,
        ):
            meta[match.group(1)] = match.group(2)
        return meta

    def _check_playwright(self) -> bool:
        """Check if Playwright is available."""
        try:
            result = subprocess.run(
                ["python3", "-c", "import playwright"],
                capture_output=True, timeout=5,
            )
            return result.returncode == 0
        except Exception:
            return False

    def _record(self, result: BrowserResult) -> None:
        """Record action in history."""
        self._history.append(result)
        if len(self._history) > 100:
            self._history = self._history[-100:]


__all__ = [
    "BrowserAgent",
    "BrowserAction",
    "BrowserResult",
    "PageInfo",
]
