"""
Shared Blackboard - Thread-safe state sharing for agent swarms.
Allows agents to read and write shared context during complex task execution.
"""
import logging
import threading
from datetime import datetime
from typing import Any, Dict, List, Optional, Union, TypedDict

logger = logging.getLogger(__name__)

# Types for blackboard data
BlackboardValue = Union[str, int, float, bool, list, dict, None]


class BlackboardHistoryEntry(TypedDict):
    """A single change record in the blackboard history"""
    timestamp: str
    namespace: str
    key: str
    old_value: BlackboardValue
    new_value: BlackboardValue


class Blackboard:
    """
    A central, thread-safe memory space for all agents in a swarm.
    Includes namespacing and versioning for shared context.
    """
    def __init__(self):
        self._data: Dict[str, Dict[str, BlackboardValue]] = {}
        self._lock = threading.RLock()
        self._history: List[BlackboardHistoryEntry] = []

    def scope(self, namespace: str = "global"):
        """Context manager for thread-safe access to a namespace."""
        class BlackboardScope:
            def __init__(self, bb: 'Blackboard', ns: str):
                self.bb = bb
                self.ns = ns
            def __enter__(self) -> Dict[str, BlackboardValue]:
                self.bb._lock.acquire()
                return self.bb.get_namespace(self.ns)
            def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
                self.bb._lock.release()
        return BlackboardScope(self, namespace)

    def update(self, data: Dict[str, BlackboardValue], namespace: str = "global") -> None:
        """Updates multiple keys at once."""
        with self._lock:
            for k, v in data.items():
                self.set(k, v, namespace)

    def increment(self, key: str, amount: Union[int, float] = 1, namespace: str = "global") -> None:
        """Atomically increments a numeric value."""
        with self._lock:
            val = self.get(key, namespace, 0)
            if isinstance(val, (int, float)):
                self.set(key, val + amount, namespace)

    def set(self, key: str, value: BlackboardValue, namespace: str = "global") -> None:
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

    def get(self, key: str, namespace: str = "global", default: BlackboardValue = None) -> BlackboardValue:
        """Retrieves a value from the blackboard."""
        with self._lock:
            return self._data.get(namespace, {}).get(key, default)

    def delete(self, key: str, namespace: str = "global") -> None:
        """Removes a value from the blackboard."""
        with self._lock:
            if namespace in self._data and key in self._data[namespace]:
                del self._data[namespace][key]

    def get_namespace(self, namespace: str) -> Dict[str, BlackboardValue]:
        """Returns all data in a specific namespace."""
        with self._lock:
            return self._data.get(namespace, {}).copy()

    def clear(self, namespace: Optional[str] = None) -> None:
        """Clears data from a namespace or the entire blackboard."""
        with self._lock:
            if namespace:
                if namespace in self._data:
                    self._data[namespace] = {}
            else:
                self._data = {}

    def get_history(self) -> List[BlackboardHistoryEntry]:
        """Returns the change history of the blackboard."""
        with self._lock:
            return self._history.copy()

# Global blackboard instance for local CLI usage
blackboard = Blackboard()
