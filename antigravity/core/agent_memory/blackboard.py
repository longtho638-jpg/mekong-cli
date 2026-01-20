"""
Shared Blackboard - Thread-safe state sharing for agent swarms.
Allows agents to read and write shared context during complex task execution.
"""
import threading
from datetime import datetime
from typing import Any, Dict, List, Optional


class Blackboard:
    """
    A central, thread-safe memory space for all agents in a swarm.
    Includes namespacing and versioning for shared context.
    """
    def __init__(self):
        self._data: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.RLock()
        self._history: List[Dict[str, Any]] = []

    def scope(self, namespace: str = "global"):
        """Context manager for thread-safe access to a namespace."""
        class BlackboardScope:
            def __init__(self, bb, ns):
                self.bb = bb
                self.ns = ns
            def __enter__(self):
                self.bb._lock.acquire()
                return self.bb.get_namespace(self.ns)
            def __exit__(self, exc_type, exc_val, exc_tb):
                self.bb._lock.release()
        return BlackboardScope(self, namespace)

    def update(self, data: Dict[str, Any], namespace: str = "global"):
        """Updates multiple keys at once."""
        with self._lock:
            for k, v in data.items():
                self.set(k, v, namespace)

    def increment(self, key: str, amount: int = 1, namespace: str = "global"):
        """Atomically increments a numeric value."""
        with self._lock:
            val = self.get(key, namespace, 0)
            if isinstance(val, (int, float)):
                self.set(key, val + amount, namespace)

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
