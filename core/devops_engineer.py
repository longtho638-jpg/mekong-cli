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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnvironmentType(Enum):
    """Execution environments."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class DeploymentStatus(Enum):
    """Current state of a deployment job."""
    PENDING = "pending"
    BUILDING = "building"
    DEPLOYING = "deploying"
    SUCCESS = "success"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class ServiceHealth(Enum):
    """Operational health of a monitored service."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    DOWN = "down"


@dataclass
class Deployment:
    """A deployment record entity."""
    id: str
    project: str
    environment: EnvironmentType
    version: str
    status: DeploymentStatus = DeploymentStatus.PENDING
    deployed_by: str = ""
    deployed_at: Optional[datetime] = None
    duration_seconds: int = 0

    def __post_init__(self):
        if self.duration_seconds < 0:
            raise ValueError("Duration cannot be negative")


@dataclass
class Service:
    """A monitored service entity."""
    id: str
    name: str
    url: str
    health: ServiceHealth = ServiceHealth.HEALTHY
    uptime_percent: float = 99.9
    last_check: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if not 0 <= self.uptime_percent <= 100:
            raise ValueError("Uptime must be between 0 and 100")


class DevOpsEngineer:
    """
    DevOps Engineer System.
    
    Orchestrates infrastructure health monitoring and automated deployment pipelines.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.deployments: List[Deployment] = []
        self.services: Dict[str, Service] = {}
        logger.info(f"DevOps system initialized for {agency_name}")
    
    def initiate_deploy(
        self,
        project: str,
        environment: EnvironmentType,
        version: str,
        deployed_by: str = "Agency AI"
    ) -> Deployment:
        """Create a new deployment request."""
        if not project or not version:
            raise ValueError("Project name and version are required")

        deployment = Deployment(
            id=f"DEP-{uuid.uuid4().hex[:6].upper()}",
            project=project,
            environment=environment,
            version=version,
            deployed_by=deployed_by
        )
        self.deployments.append(deployment)
        logger.info(f"Deployment initiated: {project} {version} to {environment.value}")
        return deployment
    
    def complete_deploy(self, deployment_id: str, success: bool, duration: int = 0) -> bool:
        """Finalize a deployment and log results."""
        for d in self.deployments:
            if d.id == deployment_id:
                d.status = DeploymentStatus.SUCCESS if success else DeploymentStatus.FAILED
                d.deployed_at = datetime.now()
                d.duration_seconds = duration
                if success:
                    logger.info(f"Deployment {deployment_id} succeeded in {duration}s")
                else:
                    logger.error(f"Deployment {deployment_id} FAILED")
                return True
        return False
    
    def monitor_service(self, name: str, url: str, uptime: float = 99.9) -> Service:
        """Register a new service for health monitoring."""
        service = Service(
            id=f"SVC-{uuid.uuid4().hex[:6].upper()}",
            name=name, url=url, uptime_percent=uptime
        )
        self.services[service.id] = service
        logger.info(f"Service monitor established: {name}")
        return service
    
    def get_aggregate_stats(self) -> Dict[str, Any]:
        """Calculate high-level infrastructure metrics."""
        success_count = sum(1 for d in self.deployments if d.status == DeploymentStatus.SUCCESS)
        total_d = len(self.deployments)
        
        return {
            "total_deployments": total_d,
            "success_rate": (success_count / total_d * 100) if total_d else 0.0,
            "service_count": len(self.services),
            "healthy_count": sum(1 for s in self.services.values() if s.health == ServiceHealth.HEALTHY)
        }
    
    def format_dashboard(self) -> str:
        """Render the DevOps Dashboard."""
        stats = self.get_aggregate_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🔧 DEVOPS ENGINEER DASHBOARD{' ' * 32}║",
            f"║  {stats['total_deployments']} deploys │ {stats['success_rate']:.0f}% success │ {stats['service_count']} services{' ' * 13}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 SERVICE HEALTH MONITOR                                ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        h_icons = {ServiceHealth.HEALTHY: "🟢", ServiceHealth.DEGRADED: "🟡", ServiceHealth.DOWN: "🔴"}
        for s in list(self.services.values())[:4]:
            icon = h_icons.get(s.health, "⚪")
            lines.append(f"║  {icon} {s.name[:20]:<20} │ {s.uptime_percent:>5.1f}% uptime │ {s.id}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🚀 RECENT DEPLOYMENTS                                    ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        s_icons = {DeploymentStatus.SUCCESS: "✅", DeploymentStatus.FAILED: "❌", DeploymentStatus.PENDING: "⏳"}
        e_icons = {EnvironmentType.PRODUCTION: "🚀", EnvironmentType.STAGING: "🎭", EnvironmentType.DEVELOPMENT: "🔧"}
        
        for d in self.deployments[-4:]:
            s_icon = s_icons.get(d.status, "⚪")
            e_icon = e_icons.get(d.environment, "📦")
            proj_disp = (d.project[:15] + '..') if len(d.project) > 17 else d.project
            lines.append(f"║  {s_icon} {e_icon} {proj_disp:<17} │ {d.version:<10} │ {d.duration_seconds:>3}s  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🚀 Deploy Now]  [📊 Infrastructure]  [🔔 Alert Log]     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Stable!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🔧 Initializing DevOps Engineer...")
    print("=" * 60)
    
    try:
        devops = DevOpsEngineer("Saigon Digital Hub")
        
        # Monitor
        devops.monitor_service("API", "https://api.vn", 99.9)
        # Deploy
        dep = devops.initiate_deploy("Portal", EnvironmentType.PRODUCTION, "v1.0.0")
        devops.complete_deploy(dep.id, True, 45)
        
        print("\n" + devops.format_dashboard())
        
    except Exception as e:
        logger.error(f"DevOps Error: {e}")
