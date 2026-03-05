"""
Mekong CLI - Gateway Configuration

Reads .mekong/gateway.yaml for persistent gateway configuration.
Falls back to hardcoded defaults when no config file exists.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional


# Default preset actions — the "Washing Machine" buttons
DEFAULT_PRESETS: List[Dict[str, str]] = [
    {"id": "deploy", "icon": "\U0001f680", "label": "Quick Deploy",
     "goal": "deploy all applications to production",
     "label_vi": "Tri\u1ec3n Khai Nhanh",
     "description": "Deploy all apps to production",
     "color": "green"},
    {"id": "leads", "icon": "\U0001f50d", "label": "Audit Leads",
     "goal": "scan and audit all lead generation sources",
     "label_vi": "Ki\u1ec3m Tra Leads",
     "description": "Audit lead generation sources",
     "color": "blue"},
    {"id": "content", "icon": "\U0001f4dd", "label": "Plan Content",
     "goal": "create a content plan for this week",
     "label_vi": "L\u00ean K\u1ebf Ho\u1ea1ch N\u1ed9i Dung",
     "description": "Create weekly content plan",
     "color": "orange"},
    {"id": "ask", "icon": "\U0001f4a1", "label": "Ask AI",
     "goal": "answer my question using AI analysis",
     "label_vi": "H\u1ecfi AI",
     "description": "Ask AI for analysis",
     "color": "purple"},
    {"id": "review", "icon": "\U0001f9d0", "label": "Code Review",
     "goal": "review recent code changes for quality and security",
     "label_vi": "Ki\u1ec3m Tra Code",
     "description": "Review code for quality and security",
     "color": "yellow"},
    {"id": "status", "icon": "\U0001f4ca", "label": "System Status",
     "goal": "check system health and report status of all services",
     "label_vi": "Tr\u1ea1ng Th\u00e1i H\u1ec7 Th\u1ed1ng",
     "description": "Check system health status",
     "color": "red"},
]


@dataclass
class GatewayConfig:
    """Persistent gateway configuration."""

    presets: List[Dict[str, str]] = field(
        default_factory=lambda: list(DEFAULT_PRESETS)
    )
    host: str = "127.0.0.1"
    port: int = 8000
    project_paths: List[str] = field(default_factory=lambda: ["apps"])
    tunnel_name: str = ""


def load_config(config_path: Optional[str] = None) -> GatewayConfig:
    """Load gateway config from YAML file, falling back to defaults.

    Tries to import PyYAML; if unavailable, returns defaults.
    """
    if config_path is None:
        config_path = str(Path(".mekong") / "gateway.yaml")

    path = Path(config_path)
    if not path.exists():
        return GatewayConfig()

    try:
        import yaml  # type: ignore[import-untyped]
    except ImportError:
        return GatewayConfig()

    try:
        raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except Exception:
        return GatewayConfig()

    cfg = GatewayConfig()

    if "host" in raw:
        cfg.host = str(raw["host"])
    if "port" in raw:
        cfg.port = int(raw["port"])
    if "tunnel_name" in raw:
        cfg.tunnel_name = str(raw["tunnel_name"])
    if "project_paths" in raw and isinstance(raw["project_paths"], list):
        cfg.project_paths = [str(p) for p in raw["project_paths"]]
    if "presets" in raw and isinstance(raw["presets"], list):
        cfg.presets = raw["presets"]

    return cfg


__all__ = ["GatewayConfig", "load_config", "DEFAULT_PRESETS"]
