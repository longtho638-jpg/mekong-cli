"""
Test CDN Utils
"""
import pytest

from backend.services.cdn.utils import map_cache_rules_to_middleware


def test_map_cache_rules():
    config = {
        "cdn": {
            "cache_rules": [
                {
                    "path": "/static/*",
                    "cache_level": "cache_everything",
                    "browser_ttl": 3600
                },
                {
                    "path": "/api/*",
                    "cache_level": "bypass",
                    "browser_ttl": 0
                }
            ]
        }
    }

    rules = map_cache_rules_to_middleware(config)
    assert len(rules) == 2

    rule1 = rules[0]
    assert rule1["path_regex"] == "^/static/.*"
    assert "public" in rule1["cache_control"]
    assert "max-age=3600" in rule1["cache_control"]

    rule2 = rules[1]
    assert rule2["path_regex"] == "^/api/.*"
    assert "no-store" in rule2["cache_control"]
