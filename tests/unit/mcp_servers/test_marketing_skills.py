import asyncio
from antigravity.mcp_servers.marketing_server.handlers import MarketingHandler
from unittest.mock import MagicMock, patch

import pytest


@pytest.mark.asyncio
async def test_audit_seo():
    handler = MarketingHandler()

    # Mock sleep to speed up test
    with patch("asyncio.sleep", return_value=None):
        result = await handler.audit_seo("https://example.com")

    assert result["url"] == "https://example.com"
    assert result["score"] == 78
    assert len(result["issues"]) == 3
    assert len(result["recommendations"]) == 3
    assert result["issues"][0]["type"] == "Technical"

@pytest.mark.asyncio
async def test_analyze_cro():
    handler = MarketingHandler()

    with patch("asyncio.sleep", return_value=None):
        result = await handler.analyze_cro("https://example.com", "pricing")

    assert result["url"] == "https://example.com"
    assert result["page_type"] == "pricing"
    assert "conversion_score" in result
    assert len(result["observations"]) > 0
    assert len(result["experiments"]) > 0

@pytest.mark.asyncio
async def test_generate_copy():
    handler = MarketingHandler()
    context = {
        "product_name": "SuperTool",
        "audience": "Developers",
        "tone": "Witty"
    }

    with patch("asyncio.sleep", return_value=None):
        result = await handler.generate_copy("landing", context)

    assert result["page_type"] == "landing"
    assert result["tone"] == "Witty"
    sections = result["sections"]
    assert "SuperTool" in sections["headline"]
    assert "Developers" in sections["headline"]
    assert len(sections["benefits"]) == 3

@pytest.mark.asyncio
async def test_pricing_strategy():
    handler = MarketingHandler()

    with patch("asyncio.sleep", return_value=None):
        result = await handler.pricing_strategy("SaaS", "Enterprise")

    assert result["model"] == "Freemium + Tiered"
    assert len(result["tiers"]) == 3
    assert "Enterprise" in result["recommendation"]
