"""
Network Optimizer Engine
========================
Automates WARP/DoH management and latency optimization.

Commands:
    /network status - Show current network status
    /network optimize - Auto-optimize WARP settings
    /network doh - Enable DoH mode
    /network endpoint [ip] - Switch WARP endpoint
"""

import re
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional


@dataclass
class NetworkStatus:
    """Current network status."""

    warp_connected: bool
    warp_mode: str
    colo: str  # Cloudflare datacenter (HKG, SIN, etc.)
    latency_ms: Optional[float]
    endpoint: Optional[str]


class NetworkOptimizer:
    """
    Network Optimizer for Antigravity Proxy.

    Manages WARP/DoH settings to minimize latency to Google APIs.
    """

    # Optimal endpoints for Vietnam (ordered by proximity)
    VIETNAM_ENDPOINTS = [
        "162.159.193.1:4500",  # Singapore preferred
        "162.159.192.1:4500",  # Default
        "162.159.195.1:4500",  # Alternative
    ]

    # Target APIs for latency testing
    TEST_TARGETS = [
        "cloudcode-pa.googleapis.com",
        "daily-cloudcode-pa.googleapis.com",
    ]

    def __init__(self):
        self.status_cache: Optional[NetworkStatus] = None

    def get_status(self) -> NetworkStatus:
        """Get current network status."""
        # Check WARP status
        try:
            result = subprocess.run(
                ["warp-cli", "status"], capture_output=True, text=True, timeout=5
            )
            warp_connected = "Connected" in result.stdout
        except Exception:
            warp_connected = False

        # Get WARP mode
        try:
            result = subprocess.run(
                ["warp-cli", "settings"], capture_output=True, text=True, timeout=5
            )
            mode_match = re.search(r"Mode:\s*(\S+)", result.stdout)
            warp_mode = mode_match.group(1) if mode_match else "unknown"

            endpoint_match = re.search(r"Override WARP endpoint:\s*(\S+)", result.stdout)
            endpoint = endpoint_match.group(1) if endpoint_match else None
        except Exception:
            warp_mode = "unknown"
            endpoint = None

        # Get Cloudflare colo
        try:
            result = subprocess.run(
                ["curl", "-s", "https://cloudflare.com/cdn-cgi/trace"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            colo_match = re.search(r"colo=(\w+)", result.stdout)
            colo = colo_match.group(1) if colo_match else "unknown"
        except Exception:
            colo = "unknown"

        # Get latency
        latency_ms = self._measure_latency(self.TEST_TARGETS[0])

        self.status_cache = NetworkStatus(
            warp_connected=warp_connected,
            warp_mode=warp_mode,
            colo=colo,
            latency_ms=latency_ms,
            endpoint=endpoint,
        )
        return self.status_cache

    def _measure_latency(self, host: str) -> Optional[float]:
        """Measure ping latency to a host."""
        try:
            result = subprocess.run(
                ["ping", "-c", "3", host], capture_output=True, text=True, timeout=15
            )
            # Parse average latency
            match = re.search(r"min/avg/max/\w+ = [\d.]+/([\d.]+)/", result.stdout)
            if match:
                return float(match.group(1))
        except Exception:
            pass
        return None

    def enable_doh(self) -> bool:
        """Enable WARP+DoH mode for optimized DNS."""
        try:
            result = subprocess.run(
                ["warp-cli", "mode", "warp+doh"], capture_output=True, text=True, timeout=10
            )
            return "Success" in result.stdout
        except Exception:
            return False

    def set_endpoint(self, endpoint: str) -> bool:
        """Set WARP tunnel endpoint."""
        try:
            result = subprocess.run(
                ["warp-cli", "tunnel", "endpoint", "set", endpoint],
                capture_output=True,
                text=True,
                timeout=10,
            )
            return result.returncode == 0
        except Exception:
            return False

    def optimize(self) -> dict:
        """
        Auto-optimize network settings.

        1. Enable WARP+DoH mode
        2. Test endpoints and pick the fastest
        3. Report results
        """
        results = {
            "doh_enabled": False,
            "best_endpoint": None,
            "latency_improvement": None,
            "actions": [],
        }

        # Step 1: Enable DoH
        if self.enable_doh():
            results["doh_enabled"] = True
            results["actions"].append("Enabled WARP+DoH mode")

        # Step 2: Test endpoints
        initial_status = self.get_status()
        initial_latency = initial_status.latency_ms or 999

        best_latency = initial_latency
        best_endpoint = initial_status.endpoint

        for endpoint in self.VIETNAM_ENDPOINTS:
            if self.set_endpoint(endpoint):
                # Wait for connection to stabilize
                import time

                time.sleep(2)

                latency = self._measure_latency(self.TEST_TARGETS[0])
                if latency and latency < best_latency:
                    best_latency = latency
                    best_endpoint = endpoint

        # Step 3: Apply best endpoint
        if best_endpoint and best_endpoint != initial_status.endpoint:
            self.set_endpoint(best_endpoint)
            results["best_endpoint"] = best_endpoint
            results["actions"].append(f"Switched to endpoint: {best_endpoint}")

        # Calculate improvement
        if initial_latency > 0 and best_latency > 0:
            improvement = ((initial_latency - best_latency) / initial_latency) * 100
            results["latency_improvement"] = f"{improvement:.1f}%"

        return results

    def report(self) -> str:
        """Generate a status report."""
        status = self.get_status()

        colo_emoji = "🟢" if status.colo in ["SIN", "HKG"] else "🟡"
        latency_emoji = (
            "🟢"
            if status.latency_ms and status.latency_ms < 150
            else "🟡"
            if status.latency_ms and status.latency_ms < 250
            else "🔴"
        )

        report = f"""
🌐 **Network Status Report**

| Metric | Value | Status |
|--------|-------|--------|
| WARP Connected | {status.warp_connected} | {"🟢" if status.warp_connected else "🔴"} |
| WARP Mode | {status.warp_mode} | {"🟢" if "doh" in status.warp_mode.lower() else "🟡"} |
| Cloudflare Colo | {status.colo} | {colo_emoji} |
| API Latency | {status.latency_ms:.0f}ms | {latency_emoji} |
| Endpoint | {status.endpoint or "default"} | - |

**Recommendations:**
"""
        if status.latency_ms and status.latency_ms > 200:
            report += "- ⚠️ High latency detected. Consider peak hour avoidance (17:00-23:00).\n"
        if status.colo not in ["SIN", "HKG"]:
            report += f"- ⚠️ Routing through {status.colo}. Singapore (SIN) is optimal.\n"
        if "doh" not in status.warp_mode.lower():
            report += "- 💡 Run `/network doh` to enable DoH for faster DNS.\n"

        return report.strip()


def main():
    """CLI interface for Network Optimizer."""
    import sys

    optimizer = NetworkOptimizer()

    if len(sys.argv) < 2:
        print(optimizer.report())
        return

    command = sys.argv[1].lower()

    if command == "status":
        print(optimizer.report())
    elif command == "doh":
        if optimizer.enable_doh():
            print("✅ WARP+DoH mode enabled")
        else:
            print("❌ Failed to enable DoH mode")
    elif command == "optimize":
        results = optimizer.optimize()
        print("🚀 Optimization complete:")
        for action in results["actions"]:
            print(f"  ✓ {action}")
        if results["latency_improvement"]:
            print(f"  📈 Latency improved by {results['latency_improvement']}")
    elif command == "endpoint" and len(sys.argv) > 2:
        endpoint = sys.argv[2]
        if optimizer.set_endpoint(endpoint):
            print(f"✅ Endpoint set to {endpoint}")
        else:
            print("❌ Failed to set endpoint")
    else:
        print("Usage: python network_optimizer.py [status|doh|optimize|endpoint <ip:port>]")


if __name__ == "__main__":
    main()
