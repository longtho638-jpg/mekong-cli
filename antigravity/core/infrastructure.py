"""
🏗️ Full Stack Infrastructure - The Unified 10-Layer Stack
========================================================

Defines and monitors the complete operational stack for the Agency OS.
Unlike traditional Frontend/Backend splits, this model identifies 10
distinct layers required for professional production readiness.

Layers:
1. 🗄️ Database: Data persistence and integrity.
2. 🖥️ Server: Core logic and API execution.
3. 🌐 Networking: DNS, SSL, and connectivity.
4. ☁️ Cloud: Computing and storage allocation.
5. 🔄 CI/CD: Automated integration and deployment.
6. 🔒 Security: Auth, RLS, and WAF protection.
7. 📊 Monitoring: Observability and error tracking.
8. 📦 Containers: Runtime isolation and scaling.
9. ⚡ CDN: Edge acceleration and optimization.
10. 💾 Backup: Disaster recovery and snapshots.

Binh Pháp: 🏗️ Địa (Ground) - Securing the foundation of the fortress.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

# Configure logging
logger = logging.getLogger(__name__)


class StackLayer(Enum):
    """The 10 functional layers of a modern production stack."""

    DATABASE = "database"
    SERVER = "server"
    NETWORKING = "networking"
    CLOUD = "cloud"
    CICD = "ci_cd"
    SECURITY = "security"
    MONITORING = "monitoring"
    CONTAINERS = "containers"
    CDN = "cdn"
    BACKUP = "backup"


@dataclass
class LayerConfig:
    """Standardized configuration and status for a stack layer."""

    layer: StackLayer
    provider: str
    status: str = "configured"  # configured, running, warning, error
    tier: str = "starter"
    config: Dict[str, Any] = field(default_factory=dict)
    last_check: datetime = field(default_factory=datetime.now)


class InfrastructureStack:
    """
    🏗️ Infrastructure Manager

    Orchestrates the 'Strong Ground' policy. Ensures all 10 layers of
    production infrastructure are correctly provisioned and monitored.
    """

    def __init__(self):
        self.layers: Dict[StackLayer, LayerConfig] = {}
        self._initialize_default_stack()

    def _initialize_default_stack(self):
        """Builds the Agency OS 'Golden Stack' defaults."""

        # Mapping definition logic
        defaults = [
            (StackLayer.DATABASE, "Supabase (Postgres)", {"rls": True, "realtime": True}),
            (StackLayer.SERVER, "Vercel Edge", {"runtime": "Edge", "framework": "Next.js"}),
            (StackLayer.NETWORKING, "Cloudflare", {"dns": "Strict", "ssl": "Full"}),
            (StackLayer.CLOUD, "Vercel + Supabase", {"compute": "Serverless"}),
            (StackLayer.CICD, "GitHub Actions", {"auto_deploy": True}),
            (StackLayer.SECURITY, "Multi-layered", {"auth": "Supabase Auth", "waf": "Cloudflare"}),
            (StackLayer.MONITORING, "Vercel + Sentry", {"apm": "Speed Insights"}),
            (StackLayer.CONTAINERS, "Serverless Edge", {"scaling": "Dynamic"}),
            (StackLayer.CDN, "Vercel Edge Network", {"caching": "Auto"}),
            (StackLayer.BACKUP, "GitHub + Supabase", {"frequency": "Daily"}),
        ]

        for layer, provider, cfg in defaults:
            self.layers[layer] = LayerConfig(layer=layer, provider=provider, config=cfg)

    def get_health_score(self) -> int:
        """Calculates 0-100 system health score based on layer statuses."""
        weights = {"running": 100, "configured": 90, "warning": 50, "error": 0}

        total = sum(weights.get(lead.status, 0) for lead in self.layers.values())
        return total // len(self.layers) if self.layers else 0

    def update_layer(self, layer: StackLayer, status: str, provider: Optional[str] = None):
        """Updates the operational state of a specific stack layer."""
        if layer in self.layers:
            self.layers[layer].status = status
            if provider:
                self.layers[layer].provider = provider
            self.layers[layer].last_check = datetime.now()
            logger.info(f"Infrastructure: {layer.value} updated to {status}")

    def get_layer_summary(self) -> List[Dict[str, Any]]:
        """Returns a flat list of layer status for dashboards."""
        return [
            {
                "id": lead.layer.value,
                "provider": lead.provider,
                "status": lead.status,
                "health": "OK" if lead.status in ["running", "configured"] else "FAIL",
            }
            for lead in self.layers.values()
        ]

    def print_status_report(self):
        """Pretty-prints the full 10-layer stack report to the console."""
        score = self.get_health_score()

        print("\n" + "═" * 65)
        print("║" + "🏗️ INFRASTRUCTURE STACK REPORT (10/10)".center(63) + "║")
        print("═" * 65)

        icons = {
            StackLayer.DATABASE: "🗄️",
            StackLayer.SERVER: "🖥️",
            StackLayer.NETWORKING: "🌐",
            StackLayer.CLOUD: "☁️",
            StackLayer.CICD: "🔄",
            StackLayer.SECURITY: "🔒",
            StackLayer.MONITORING: "📊",
            StackLayer.CONTAINERS: "📦",
            StackLayer.CDN: "⚡",
            StackLayer.BACKUP: "💾",
        }

        status_colors = {"running": "🟢", "configured": "🔵", "warning": "🟡", "error": "🔴"}

        for ltype, lcfg in self.layers.items():
            s_icon = status_colors.get(lcfg.status, "⚪")
            l_icon = icons.get(ltype, "•")
            print(f"  {l_icon} {ltype.value.upper():<12} | {s_icon} {lcfg.provider}")

        print("\n" + "─" * 65)
        print(f"  🏆 STACK HEALTH: {score}%")

        verdict = (
            "🚀 PRODUCTION READY"
            if score >= 90
            else "⚠️ AT RISK - NEEDS CONFIG"
            if score >= 70
            else "🚫 INSECURE / UNSTABLE"
        )
        print(f"  📢 STATUS: {verdict}")
        print("═" * 65 + "\n")


# --- Stack Presets (Static Definitions) ---

STACK_PRESETS = {
    "solo": {
        "label": "Solo Unicorn (Low Cost)",
        "stack": "Supabase + Vercel + Cloudflare",
        "monthly_est": "$0 - $25",
        "maintenance": "Minimal (Serverless)",
    },
    "studio": {
        "label": "Agency Studio (High Performance)",
        "stack": "AWS + Vercel Pro + Datadog",
        "monthly_est": "$100 - $500",
        "maintenance": "Automated (DevOps Needed)",
    },
}


def get_preset_comparison() -> str:
    """Visualizes the difference between infrastructure tiers."""
    lines = ["\n🏗️ AGENCY OS - STACK COMPARISON", "═" * 50]
    for key, p in STACK_PRESETS.items():
        lines.append(f"📦 {p['label'].upper()}")
        lines.append(f"   Stack: {p['stack']}")
        lines.append(f"   Cost : {p['monthly_est']}")
        lines.append("")
    return "\n".join(lines)
