"""
Dependency Injection container for backend services
"""

from typing import Dict, Union

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
    OpsService,
    RouterService,
    VibeService,
)

# Type aliases for clarity
ServiceT = Union[
    AgentService,
    CommandService,
    VibeService,
    RouterService,
    AgentOpsService,
    OpsService,
]

ControllerT = Union[
    AgentController,
    AgentOpsController,
    CommandController,
    RouterController,
    VibeController,
]


class DIContainer:
    """Simple dependency injection container"""

    def __init__(self):
        self._services: Dict[str, ServiceT] = {}
        self._controllers: Dict[str, ControllerT] = {}
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
        # We use type: ignore because the controllers expect specific service subclasses
        # but are stored in a generic dictionary. The getters provide correct typing.
        self._controllers["agent"] = AgentController(self._services["agent"])  # type: ignore
        self._controllers["command"] = CommandController(self._services["command"])  # type: ignore
        self._controllers["vibe"] = VibeController(self._services["vibe"])  # type: ignore
        self._controllers["router"] = RouterController(self._services["router"])  # type: ignore
        self._controllers["agentops"] = AgentOpsController(self._services["agentops"])  # type: ignore

    def get_service(self, name: str) -> ServiceT:
        """Get a service by name"""
        if name not in self._services:
            raise ValueError(f"Service '{name}' not found")
        return self._services[name]

    def get_controller(self, name: str) -> ControllerT:
        """Get a controller by name"""
        if name not in self._controllers:
            raise ValueError(f"Controller '{name}' not found")
        return self._controllers[name]


# Global container instance
container = DIContainer()
