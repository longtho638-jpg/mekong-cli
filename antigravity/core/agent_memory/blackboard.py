"""
Shared Blackboard - Thread-safe state sharing for agent swarms.
Allows agents to read and write shared context during complex task execution.
"""
import threading
from typing import Any, Dict, List, Optional
from datetime import datetime

class Blackboard:
    """
    A central, thread-safe memory space for all agents in a swarm.
    Includes namespacing and versioning for shared context.
    """
    def __init__(self):
        self._data: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.RLock()
        self._history: List[Dict[str, Any]] = []

    def set(self, key: str, value: Any, namespace: str = "global"):
        """Sets a value in the blackboard."""
        with self._lock:
            if namespace not in self._data:
                self._data[namespace] = {}

            old_value = self._data[namespace].get(key)
            self._data[namespace][key] = value

            entry = {
                "timestamp": datetime.now().isoformat(),
                "namespace": namespace,
                "key": key,
                "old_value": old_value,
                "new_value": value
            }
            self._history.append(entry)

    def get(self, key: str, namespace: str = "global", default: Any = None) -> Any:
        """Retrieves a value from the blackboard."""
        with self._lock:
            return self._data.get(namespace, {}).get(key, default)

    def delete(self, key: str, namespace: str = "global"):
        """Removes a value from the blackboard."""
        with self._lock:
            if namespace in self._data and key in self._data[namespace]:
                del self._data[namespace][key]

    def get_namespace(self, namespace: str) -> Dict[str, Any]:
        """Returns all data in a specific namespace."""
        with self._lock:
            return self._data.get(namespace, {}).copy()

    def clear(self, namespace: Optional[str] = None):
        """Clears data from a namespace or the entire blackboard."""
        with self._lock:
            if namespace:
                if namespace in self._data:
                    self._data[namespace] = {}
            else:
                self._data = {}

    def get_history(self) -> List[Dict[str, Any]]:
        """Returns the change history of the blackboard."""
        with self._lock:
            return self._history.copy()

# Global blackboard instance for local CLI usage
blackboard = Blackboard()
