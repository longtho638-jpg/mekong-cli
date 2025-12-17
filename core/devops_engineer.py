"""
🔧 DevOps Engineer - Infrastructure & Deployment
==================================================

Manage infrastructure and deployments.
Reliable systems that scale!

Roles:
- CI/CD pipelines
- Infrastructure management
- Monitoring & alerts
- Deployment automation
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class EnvironmentType(Enum):
    """Environment types."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class DeploymentStatus(Enum):
    """Deployment status."""
    PENDING = "pending"
    BUILDING = "building"
    DEPLOYING = "deploying"
    SUCCESS = "success"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class ServiceHealth(Enum):
    """Service health status."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    DOWN = "down"


@dataclass
class Deployment:
    """A deployment."""
    id: str
    project: str
    environment: EnvironmentType
    version: str
    status: DeploymentStatus = DeploymentStatus.PENDING
    deployed_by: str = ""
    deployed_at: Optional[datetime] = None
    duration_seconds: int = 0


@dataclass
class Service:
    """A monitored service."""
    id: str
    name: str
    url: str
    health: ServiceHealth = ServiceHealth.HEALTHY
    uptime_percent: float = 99.9
    last_check: datetime = field(default_factory=datetime.now)


class DevOpsEngineer:
    """
    DevOps Engineer System.
    
    Infrastructure and deployment.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.deployments: List[Deployment] = []
        self.services: Dict[str, Service] = {}
    
    def deploy(
        self,
        project: str,
        environment: EnvironmentType,
        version: str,
        deployed_by: str = ""
    ) -> Deployment:
        """Create a deployment."""
        deployment = Deployment(
            id=f"DEP-{uuid.uuid4().hex[:6].upper()}",
            project=project,
            environment=environment,
            version=version,
            deployed_by=deployed_by
        )
        self.deployments.append(deployment)
        return deployment
    
    def complete_deployment(self, deployment: Deployment, success: bool, duration: int = 0):
        """Complete a deployment."""
        deployment.status = DeploymentStatus.SUCCESS if success else DeploymentStatus.FAILED
        deployment.deployed_at = datetime.now()
        deployment.duration_seconds = duration
    
    def add_service(
        self,
        name: str,
        url: str,
        uptime: float = 99.9
    ) -> Service:
        """Add a service to monitor."""
        service = Service(
            id=f"SVC-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            url=url,
            uptime_percent=uptime
        )
        self.services[service.id] = service
        return service
    
    def update_health(self, service: Service, health: ServiceHealth):
        """Update service health."""
        service.health = health
        service.last_check = datetime.now()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get DevOps stats."""
        successful = sum(1 for d in self.deployments if d.status == DeploymentStatus.SUCCESS)
        healthy = sum(1 for s in self.services.values() if s.health == ServiceHealth.HEALTHY)
        avg_uptime = sum(s.uptime_percent for s in self.services.values()) / len(self.services) if self.services else 0
        
        return {
            "total_deployments": len(self.deployments),
            "successful": successful,
            "success_rate": (successful / len(self.deployments) * 100) if self.deployments else 0,
            "services": len(self.services),
            "healthy_services": healthy,
            "avg_uptime": avg_uptime
        }
    
    def format_dashboard(self) -> str:
        """Format DevOps dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🔧 DEVOPS ENGINEER                                       ║",
            f"║  {stats['total_deployments']} deploys │ {stats['success_rate']:.0f}% success │ {stats['avg_uptime']:.1f}% uptime  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 SERVICE HEALTH                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        health_icons = {"healthy": "🟢", "degraded": "🟡", "down": "🔴"}
        
        for service in list(self.services.values())[:5]:
            icon = health_icons.get(service.health.value, "⚪")
            lines.append(f"║  {icon} {service.name[:20]:<20} │ {service.uptime_percent:>5.1f}% │ {service.url[:15]:<15}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🚀 RECENT DEPLOYMENTS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        status_icons = {"pending": "⏳", "building": "🔄", "deploying": "🚀", 
                       "success": "✅", "failed": "❌", "rolled_back": "↩️"}
        env_icons = {"development": "🔧", "staging": "🎭", "production": "🚀"}
        
        for deploy in self.deployments[-4:]:
            s_icon = status_icons.get(deploy.status.value, "⚪")
            e_icon = env_icons.get(deploy.environment.value, "📦")
            
            lines.append(f"║  {s_icon} {e_icon} {deploy.project[:15]:<15} │ {deploy.version:<10} │ {deploy.duration_seconds:>3}s  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🚀 Deploy]  [📊 Metrics]  [🔔 Alerts]                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Reliable systems!                ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    devops = DevOpsEngineer("Saigon Digital Hub")
    
    print("🔧 DevOps Engineer")
    print("=" * 60)
    print()
    
    # Add services
    devops.add_service("Main Website", "https://saigonhub.vn", 99.95)
    devops.add_service("Client Portal", "https://portal.saigonhub.vn", 99.8)
    devops.add_service("API Gateway", "https://api.saigonhub.vn", 99.99)
    
    # Create deployments
    d1 = devops.deploy("Website", EnvironmentType.PRODUCTION, "v2.1.0", "Alex")
    d2 = devops.deploy("Portal", EnvironmentType.STAGING, "v1.5.2", "Sam")
    d3 = devops.deploy("API", EnvironmentType.PRODUCTION, "v3.0.0", "Alex")
    
    devops.complete_deployment(d1, True, 45)
    devops.complete_deployment(d2, True, 30)
    devops.complete_deployment(d3, False, 120)
    
    print(devops.format_dashboard())
