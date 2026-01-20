"""
Network Server Handlers
=======================
Logic for Network Optimizer MCP.
"""

import asyncio
import re
import subprocess
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional


@dataclass
class NetworkStatus:
    """Current network status."""
    warp_connected: bool
    warp_mode: str
    colo: str
    latency_ms: Optional[float]
    endpoint: Optional[str]

class NetworkHandler:
    """
    Network Optimizer Logic
    Adapted for MCP usage.
    """

    VIETNAM_ENDPOINTS = [
        "162.159.193.1:4500",  # Singapore preferred
        "162.159.192.1:4500",  # Default
        "162.159.195.1:4500",  # Alternative
    ]

    TEST_TARGETS = [
        "cloudcode-pa.googleapis.com",
        "daily-cloudcode-pa.googleapis.com",
    ]

    def __init__(self):
        self.status_cache: Optional[NetworkStatus] = None

    async def get_status(self) -> Dict[str, Any]:
        """Get current network status."""
        warp_connected = False
        warp_mode = "unknown"
        endpoint = None
        colo = "unknown"

        # Check WARP status
        try:
            result = await asyncio.create_subprocess_exec(
                "warp-cli", "status",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, _ = await asyncio.wait_for(result.communicate(), timeout=5)
            warp_connected = "Connected" in stdout.decode()
        except Exception:
            pass

        # Get WARP mode and settings
        try:
            result = await asyncio.create_subprocess_exec(
                "warp-cli", "settings",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, _ = await asyncio.wait_for(result.communicate(), timeout=5)
            output = stdout.decode()

            mode_match = re.search(r"Mode:\s*(\S+)", output)
            warp_mode = mode_match.group(1) if mode_match else "unknown"

            endpoint_match = re.search(r"Override WARP endpoint:\s*(\S+)", output)
            endpoint = endpoint_match.group(1) if endpoint_match else None
        except Exception:
            pass

        # Get Cloudflare colo
        try:
            result = await asyncio.create_subprocess_exec(
                "curl", "-s", "https://cloudflare.com/cdn-cgi/trace",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, _ = await asyncio.wait_for(result.communicate(), timeout=5)
            colo_match = re.search(r"colo=(\w+)", stdout.decode())
            colo = colo_match.group(1) if colo_match else "unknown"
        except Exception:
            pass

        # Get latency
        latency_ms = await self._measure_latency(self.TEST_TARGETS[0])

        self.status_cache = NetworkStatus(
            warp_connected=warp_connected,
            warp_mode=warp_mode,
            colo=colo,
            latency_ms=latency_ms,
            endpoint=endpoint,
        )
        return asdict(self.status_cache)

    async def _measure_latency(self, host: str) -> Optional[float]:
        """Measure ping latency to a host."""
        try:
            result = await asyncio.create_subprocess_exec(
                "ping", "-c", "3", host,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, _ = await asyncio.wait_for(result.communicate(), timeout=15)
            # Parse average latency
            match = re.search(r"min/avg/max/\w+ = [\d.]+/([\d.]+)/", stdout.decode())
            if match:
                return float(match.group(1))
        except Exception:
            pass
        return None

    async def enable_doh(self) -> bool:
        """Enable WARP+DoH mode for optimized DNS."""
        try:
            result = await asyncio.create_subprocess_exec(
                "warp-cli", "mode", "warp+doh",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, _ = await asyncio.wait_for(result.communicate(), timeout=10)
            return "Success" in stdout.decode()
        except Exception:
            return False

    async def set_endpoint(self, endpoint: str) -> bool:
        """Set WARP tunnel endpoint."""
        try:
            result = await asyncio.create_subprocess_exec(
                "warp-cli", "tunnel", "endpoint", "set", endpoint,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            await asyncio.wait_for(result.communicate(), timeout=10)
            return result.returncode == 0
        except Exception:
            return False

    async def optimize(self) -> Dict[str, Any]:
        """Auto-optimize network settings."""
        results = {
            "doh_enabled": False,
            "best_endpoint": None,
            "latency_improvement": None,
            "actions": [],
        }

        # Step 1: Enable DoH
        if await self.enable_doh():
            results["doh_enabled"] = True
            results["actions"].append("Enabled WARP+DoH mode")

        # Step 2: Test endpoints
        initial_status = await self.get_status()
        initial_latency = initial_status.get("latency_ms") or 999
        initial_endpoint = initial_status.get("endpoint")

        best_latency = initial_latency
        best_endpoint = initial_endpoint

        for endpoint in self.VIETNAM_ENDPOINTS:
            if await self.set_endpoint(endpoint):
                # Wait for connection to stabilize
                await asyncio.sleep(2)

                latency = await self._measure_latency(self.TEST_TARGETS[0])
                if latency and latency < best_latency:
                    best_latency = latency
                    best_endpoint = endpoint

        # Step 3: Apply best endpoint
        if best_endpoint and best_endpoint != initial_endpoint:
            await self.set_endpoint(best_endpoint)
            results["best_endpoint"] = best_endpoint
            results["actions"].append(f"Switched to endpoint: {best_endpoint}")

        # Calculate improvement
        if initial_latency > 0 and best_latency > 0 and best_latency < initial_latency:
            improvement = ((initial_latency - best_latency) / initial_latency) * 100
            results["latency_improvement"] = f"{improvement:.1f}%"

        return results
