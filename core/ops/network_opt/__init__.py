"""
Network Optimizer Facade.
"""
from typing import Dict

from .optimizer import Optimizer


class NetworkOptimizer(Optimizer):
    """
    Manages network connectivity to ensure optimal routing and availability.
    Includes advanced tools for WARP endpoint scanning and ISP throttling bypass.
    """
    def get_status_report(self) -> Dict:
        """Return a structured status report"""
        warp = self.get_warp_status()
        ts = self.get_tailscale_status()
        colo = self.get_cloudflare_colo()
        latency = self.get_ping_latency()
        google_latency = self.get_google_latency()
        ip_info = self.get_current_ip_info()

        quality = "POOR"
        if latency < 50:
            quality = "EXCELLENT"
        elif latency < 100:
            quality = "GOOD"

        return {
            "warp": warp,
            "tailscale": ts,
            "colo": colo,
            "latency": latency,
            "google_latency": google_latency,
            "ip_info": ip_info,
            "quality": quality,
        }
