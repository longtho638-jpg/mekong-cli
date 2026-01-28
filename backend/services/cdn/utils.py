"""
CDN Utilities
Helpers for loading configuration and mapping rules.
"""

import os
import yaml
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def load_cdn_config(config_path: str = "config/cdn-config.yaml") -> Dict[str, Any]:
    """
    Load CDN configuration from YAML file.
    """
    if not os.path.exists(config_path):
        logger.warning(f"CDN config not found at {config_path}")
        return {}

    try:
        with open(config_path, "r") as f:
            return yaml.safe_load(f) or {}
    except Exception as e:
        logger.error(f"Failed to load CDN config: {e}")
        return {}

def map_cache_rules_to_middleware(cdn_config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Map CDN config cache rules to CacheControlMiddleware format.

    CDN Config Rule:
    - path: "/static/*"
      cache_level: "cache_everything"
      edge_ttl: 31536000
      browser_ttl: 31536000

    Middleware Rule:
    {
        "path_regex": r"^/static/.*",
        "cache_control": "public, max-age=31536000",
        "server_ttl": None
    }
    """
    rules = []
    cdn_section = cdn_config.get("cdn", {})
    config_rules = cdn_section.get("cache_rules", [])

    for rule in config_rules:
        path = rule.get("path", "")
        if not path:
            continue

        # Convert glob to regex
        # This is a simple conversion, might need more robustness
        path_regex = "^" + path.replace("*", ".*")

        browser_ttl = rule.get("browser_ttl", 0)
        cache_level = rule.get("cache_level", "standard")

        cache_control = "no-store"
        server_ttl = None

        if cache_level == "bypass":
            cache_control = "no-store, no-cache, private"
        elif browser_ttl > 0:
            cache_control = f"public, max-age={browser_ttl}"
            if cache_level == "cache_everything":
                cache_control += ", immutable"
        else:
            # Default or standard
            pass

        # Check for server side caching hint (custom field or inferred)
        # For now we don't infer server_ttl from this config for the app middleware
        # unless we explicitly add a field for it in cdn-config.yaml.
        # But generally, if we set browser TTL, we might want server to cache public GETs too.
        # Let's be conservative and only set cache-control headers.

        rules.append({
            "path_regex": path_regex,
            "cache_control": cache_control,
            "server_ttl": None # Managed separately or added to config later
        })

    return rules
