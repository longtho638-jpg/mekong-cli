"""
Autonomous Operations Engine.
Handles self-healing and automated recovery actions.
"""
import logging
import time
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class HealthStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"

@dataclass
class ServiceHealth:
    name: str
    status: HealthStatus
    last_check: float
    error_count: int = 0
    message: Optional[str] = None

class AutoHealer:
    """
    Monitors system components and triggers recovery actions.
    """
    def __init__(self):
        self.services: Dict[str, ServiceHealth] = {}
        self.recovery_actions: Dict[str, Callable] = {}
        self._thresholds = {
            "error_count": 3,
            "latency_ms": 1000
        }

    def register_service(self, name: str):
        """Register a service to monitor."""
        self.services[name] = ServiceHealth(
            name=name,
            status=HealthStatus.HEALTHY,
            last_check=time.time()
        )

    def register_recovery_action(self, service_name: str, action: Callable):
        """Register a recovery action for a service."""
        self.recovery_actions[service_name] = action

    def report_health(self, service_name: str, status: HealthStatus, message: str = None):
        """Update health status of a service."""
        if service_name not in self.services:
            self.register_service(service_name)

        service = self.services[service_name]
        service.status = status
        service.last_check = time.time()
        service.message = message

        if status != HealthStatus.HEALTHY:
            service.error_count += 1
            self._evaluate_recovery(service)
        else:
            service.error_count = 0

    def _evaluate_recovery(self, service: ServiceHealth):
        """Check if recovery action is needed."""
        if service.error_count >= self._thresholds["error_count"]:
            logger.warning(f"Service {service.name} is unhealthy ({service.error_count} errors). Triggering recovery.")
            self._trigger_recovery(service.name)

    def _trigger_recovery(self, service_name: str):
        """Execute recovery action."""
        if service_name in self.recovery_actions:
            try:
                action = self.recovery_actions[service_name]
                logger.info(f"Executing recovery action for {service_name}...")
                result = action()
                logger.info(f"Recovery action completed: {result}")

                # Reset error count if recovery implies success (naive assumption, better to wait for next health check)
                if service_name in self.services:
                    self.services[service_name].error_count = 0
                    self.services[service_name].status = HealthStatus.DEGRADED # Tentative
            except Exception as e:
                logger.error(f"Recovery action failed for {service_name}: {e}")
        else:
            logger.error(f"No recovery action defined for {service_name}")

    def get_system_status(self) -> Dict[str, str]:
        """Get summary of all services."""
        return {name: svc.status.value for name, svc in self.services.items()}
