"""
Tunnel Metrics.
"""

from typing import Dict


class TunnelMetrics:
    def __init__(self):
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.total_latency = 0.0

    def record_request(self, duration: float, success: bool):
        self.total_requests += 1
        self.total_latency += duration
        if success:
            self.successful_requests += 1
        else:
            self.failed_requests += 1

    def get_stats(self) -> Dict[str, float]:
        avg_latency = self.total_latency / self.total_requests if self.total_requests > 0 else 0.0
        return {
            "total_requests": self.total_requests,
            "success_rate": (self.successful_requests / self.total_requests) * 100
            if self.total_requests > 0
            else 0.0,
            "avg_latency": avg_latency,
        }
