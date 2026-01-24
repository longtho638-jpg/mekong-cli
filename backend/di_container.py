"""
Dependency Injection container for backend services
"""

from typing import Any, Dict

from backend.controllers import (
    AgentController,
    AgentOpsController,
    CommandController,
    RouterController,
    VibeController,
)
from backend.services import (
    AgentOpsService,
    AgentService,
    CommandService,
    RouterService,
    VibeService,
    OpsService,
)


class DIContainer:
    """Simple dependency injection container"""

    def __init__(self):
        self._services: Dict[str, Any] = {}
        self._controllers: Dict[str, Any] = {}
        self._initialize_services()
        self._initialize_controllers()

    def _initialize_services(self):
        """Initialize all services"""
        self._services["agent"] = AgentService()
        self._services["command"] = CommandService()
        self._services["vibe"] = VibeService()
        self._services["router"] = RouterService()
        self._services["agentops"] = AgentOpsService()
        self._services["ops"] = OpsService()

    def _initialize_controllers(self):
        """Initialize all controllers with service dependencies"""
        self._controllers["agent"] = AgentController(self._services["agent"])
        self._controllers["command"] = CommandController(self._services["command"])
        self._controllers["vibe"] = VibeController(self._services["vibe"])
        self._controllers["router"] = RouterController(self._services["router"])
        self._controllers["agentops"] = AgentOpsController(self._services["agentops"])

    def get_service(self, name: str) -> Any:
        """Get a service by name"""
        if name not in self._services:
            raise ValueError(f"Service '{name}' not found")
        return self._services[name]

    def get_controller(self, name: str) -> Any:
        """Get a controller by name"""
        if name not in self._controllers:
            raise ValueError(f"Controller '{name}' not found")
        return self._controllers[name]


# Global container instance
container = DIContainer()
