import threading
from typing import List

from .models import SwarmMetrics


class SwarmState:
    """
    Manages the internal state and metrics of the Agent Swarm.
    """
    def __init__(self):
        self.running = False
        self.metrics = SwarmMetrics()
        self.task_times: List[float] = []
        self.lock = threading.Lock()
