"""
🏗️ Full Stack Infrastructure - The ACTUAL Full Stack

Not just Frontend + Backend, but ALL 10 layers:
1. Database
2. Server
3. Networking
4. Cloud Infrastructure
5. CI/CD
6. Security
7. Monitoring
8. Containers
9. CDN
10. Backup

Usage:
    from antigravity.core.infrastructure import InfrastructureStack
    stack = InfrastructureStack()
    stack.print_status()
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import json


class StackLayer(Enum):
    """The 10 layers of Actual Full Stack."""
    DATABASE = "database"
    SERVER = "server"
    NETWORKING = "networking"
    CLOUD = "cloud_infrastructure"
    CICD = "ci_cd"
    SECURITY = "security"
    MONITORING = "monitoring"
    CONTAINERS = "containers"
    CDN = "cdn"
    BACKUP = "backup"


@dataclass
class LayerConfig:
    """Configuration for a stack layer."""
    layer: StackLayer
    provider: str
    status: str  # configured, running, warning, error
    config: Dict[str, Any] = field(default_factory=dict)
    last_check: Optional[datetime] = None


class InfrastructureStack:
    """
    🏗️ Infrastructure Stack
    
    Manages the ACTUAL 10-layer full stack architecture.
    """
    
    def __init__(self):
        self.layers: Dict[StackLayer, LayerConfig] = {}
        self._init_defaults()
    
    def _init_defaults(self):
        """Initialize with AgencyOS recommended stack."""
        
        # 1. DATABASE
        self.layers[StackLayer.DATABASE] = LayerConfig(
            layer=StackLayer.DATABASE,
            provider="Supabase",
            status="configured",
            config={
                "type": "PostgreSQL",
                "realtime": True,
                "row_level_security": True,
                "edge_functions": True,
            }
        )
        
        # 2. SERVER
        self.layers[StackLayer.SERVER] = LayerConfig(
            layer=StackLayer.SERVER,
            provider="Vercel Edge",
            status="configured",
            config={
                "framework": "Next.js 15",
                "runtime": "Edge Functions",
                "regions": ["sin1", "hnd1", "sfo1"],
            }
        )
        
        # 3. NETWORKING
        self.layers[StackLayer.NETWORKING] = LayerConfig(
            layer=StackLayer.NETWORKING,
            provider="Cloudflare",
            status="configured",
            config={
                "dns": "Cloudflare DNS",
                "ssl": "Full (strict)",
                "http2": True,
                "websockets": True,
            }
        )
        
        # 4. CLOUD INFRASTRUCTURE
        self.layers[StackLayer.CLOUD] = LayerConfig(
            layer=StackLayer.CLOUD,
            provider="Vercel + Supabase",
            status="configured",
            config={
                "compute": "Vercel Serverless",
                "storage": "Supabase Storage",
                "functions": "Edge Functions",
                "regions": "Global",
            }
        )
        
        # 5. CI/CD
        self.layers[StackLayer.CICD] = LayerConfig(
            layer=StackLayer.CICD,
            provider="GitHub Actions",
            status="configured",
            config={
                "workflows": ["test", "build", "deploy"],
                "auto_deploy": True,
                "preview_deploys": True,
                "branch_protection": True,
            }
        )
        
        # 6. SECURITY
        self.layers[StackLayer.SECURITY] = LayerConfig(
            layer=StackLayer.SECURITY,
            provider="Multi-layer",
            status="configured",
            config={
                "auth": "Supabase Auth",
                "2fa": True,
                "rls": "Row Level Security",
                "waf": "Cloudflare WAF",
                "secrets": "Environment Variables",
            }
        )
        
        # 7. MONITORING
        self.layers[StackLayer.MONITORING] = LayerConfig(
            layer=StackLayer.MONITORING,
            provider="Vercel Analytics",
            status="configured",
            config={
                "apm": "Vercel Speed Insights",
                "errors": "Sentry",
                "logs": "Vercel Logs",
                "uptime": "Better Uptime",
            }
        )
        
        # 8. CONTAINERS
        self.layers[StackLayer.CONTAINERS] = LayerConfig(
            layer=StackLayer.CONTAINERS,
            provider="Serverless",
            status="configured",
            config={
                "type": "Serverless (no containers)",
                "cold_start": "Edge = instant",
                "scaling": "Auto-scale to 0",
            }
        )
        
        # 9. CDN
        self.layers[StackLayer.CDN] = LayerConfig(
            layer=StackLayer.CDN,
            provider="Vercel Edge Network",
            status="configured",
            config={
                "pops": "100+ global",
                "caching": "Automatic",
                "compression": "Brotli",
                "images": "Vercel Image Optimization",
            }
        )
        
        # 10. BACKUP
        self.layers[StackLayer.BACKUP] = LayerConfig(
            layer=StackLayer.BACKUP,
            provider="Supabase + GitHub",
            status="configured",
            config={
                "database": "Daily automatic",
                "code": "Git versioned",
                "storage": "Replicated",
                "recovery_time": "< 1 hour",
            }
        )
    
    def get_layer_status(self, layer: StackLayer) -> LayerConfig:
        """Get status of a specific layer."""
        return self.layers.get(layer)
    
    def get_health_score(self) -> int:
        """Get overall stack health score (0-100)."""
        status_scores = {
            "running": 100,
            "configured": 90,
            "warning": 50,
            "error": 0,
        }
        
        total = sum(
            status_scores.get(layer.status, 0) 
            for layer in self.layers.values()
        )
        return total // len(self.layers)
    
    def get_layer_summary(self) -> List[Dict]:
        """Get summary of all layers."""
        return [
            {
                "layer": layer.value,
                "provider": config.provider,
                "status": config.status,
            }
            for layer, config in self.layers.items()
        ]
    
    def print_status(self):
        """Print infrastructure status."""
        health = self.get_health_score()
        
        print("\n" + "═" * 60)
        print("║" + "🏗️ ACTUAL FULL STACK INFRASTRUCTURE".center(58) + "║")
        print("═" * 60)
        
        # Status icons
        status_icons = {
            "running": "🟢",
            "configured": "🔵",
            "warning": "🟡",
            "error": "🔴",
        }
        
        # Layer icons
        layer_icons = {
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
        
        print("\n📋 STACK LAYERS (10/10):\n")
        
        for layer, config in self.layers.items():
            icon = layer_icons.get(layer, "•")
            status_icon = status_icons.get(config.status, "⚪")
            print(f"   {icon} {layer.value.upper()}")
            print(f"      {status_icon} {config.provider}")
        
        print("\n" + "─" * 60)
        print(f"   🏆 HEALTH SCORE: {health}%")
        
        if health >= 90:
            print("   ✅ PRODUCTION READY")
        elif health >= 70:
            print("   ⚠️ NEEDS ATTENTION")
        else:
            print("   ❌ CRITICAL ISSUES")
        
        print("═" * 60)
    
    def print_layer_detail(self, layer: StackLayer):
        """Print detailed info for a layer."""
        config = self.layers.get(layer)
        if not config:
            print(f"Layer {layer} not found")
            return
        
        print(f"\n🔍 {layer.value.upper()} DETAIL")
        print("─" * 40)
        print(f"   Provider: {config.provider}")
        print(f"   Status: {config.status}")
        print(f"   Config:")
        for key, value in config.config.items():
            print(f"      • {key}: {value}")


# ============================================
# RECOMMENDED STACK PRESETS
# ============================================

STACK_PRESETS = {
    "starter": {
        "database": "Supabase",
        "server": "Vercel",
        "networking": "Cloudflare",
        "cloud": "Vercel + Supabase",
        "cicd": "GitHub Actions",
        "security": "Supabase Auth",
        "monitoring": "Vercel Analytics",
        "containers": "Serverless",
        "cdn": "Vercel Edge",
        "backup": "Automatic",
        "cost": "$0-50/month",
    },
    "growth": {
        "database": "Supabase Pro",
        "server": "Vercel Pro",
        "networking": "Cloudflare Pro",
        "cloud": "AWS",
        "cicd": "GitHub Actions",
        "security": "Auth0",
        "monitoring": "Datadog",
        "containers": "Docker",
        "cdn": "CloudFront",
        "backup": "AWS Backup",
        "cost": "$100-500/month",
    },
    "enterprise": {
        "database": "AWS RDS",
        "server": "AWS ECS",
        "networking": "AWS VPC",
        "cloud": "AWS",
        "cicd": "CircleCI",
        "security": "Multi-layer",
        "monitoring": "Datadog + PagerDuty",
        "containers": "Kubernetes",
        "cdn": "CloudFront + WAF",
        "backup": "Multi-region",
        "cost": "$1000+/month",
    },
}


def get_recommended_stack(tier: str = "starter") -> Dict:
    """Get recommended stack for a tier."""
    return STACK_PRESETS.get(tier, STACK_PRESETS["starter"])


def print_stack_comparison():
    """Print comparison of stack presets."""
    print("\n🏗️ STACK PRESETS COMPARISON")
    print("═" * 60)
    
    for name, stack in STACK_PRESETS.items():
        print(f"\n📦 {name.upper()}")
        print(f"   Cost: {stack['cost']}")
        print(f"   DB: {stack['database']}")
        print(f"   Server: {stack['server']}")
        print(f"   Security: {stack['security']}")
