"""
Network Operations
==================
Optimize network connectivity for ISP bypass and performance.
Strategy: WARP-first (FREE, stable, HKG/SIN routing) -> Fallback: Mullvad via Tailscale.
"""

import json
import subprocess
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Tuple, List

# Configuration
PING_TARGET = "1.1.1.1"
PING_THRESHOLD_MS = 100
LOG_FILE = Path.home() / ".network_optimizer.log"

# Preferred exit nodes (ordered by priority)
MULLVAD_NODES = [
    "sg-sin-wg-001.mullvad.ts.net",  # Singapore
    "hk-hkg-wg-201.mullvad.ts.net",  # Hong Kong
    "jp-tyo-wg-001.mullvad.ts.net",  # Tokyo
]

class NetworkOptimizer:
    """
    Manages network connectivity to ensure optimal routing and availability.
    """
    
    def log(self, msg: str):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        line = f"[{timestamp}] {msg}"
        print(line)
        # Ensure log directory exists if needed, or just write to user home
        try:
            with open(LOG_FILE, "a") as f:
                f.write(line + "\n")
        except Exception:
            pass # Fail silently on log write permissions

    def run_cmd(self, cmd: str, timeout: int = 30) -> Tuple[int, str]:
        """Run command and return (exit_code, output)"""
        try:
            result = subprocess.run(
                cmd, shell=True, capture_output=True, text=True, timeout=timeout
            )
            return result.returncode, result.stdout + result.stderr
        except subprocess.TimeoutExpired:
            return -1, "Command timed out"
        except Exception as e:
            return -1, str(e)

    def get_warp_status(self) -> Dict:
        """Get WARP connection status"""
        code, output = self.run_cmd("warp-cli status")
        connected = "Connected" in output
        healthy = "healthy" in output.lower()
        return {"connected": connected, "healthy": healthy, "output": output}

    def get_tailscale_status(self) -> Dict:
        """Get Tailscale status"""
        code, output = self.run_cmd("tailscale status --json")
        if code != 0:
            return {"online": False, "exit_node": None, "error": output}

        try:
            data = json.loads(output)
            exit_node = data.get("ExitNodeStatus", {})
            return {
                "online": data.get("Self", {}).get("Online", False),
                "exit_node_active": exit_node.get("Online", False),
                "exit_node_id": exit_node.get("ID"),
            }
        except:
            return {"online": False, "exit_node": None}

    def get_ping_latency(self) -> float:
        """Get ping latency to Cloudflare"""
        code, output = self.run_cmd(f"ping -c 3 {PING_TARGET}")
        if code != 0:
            return 999.0

        # Parse avg from: min/avg/max/stddev = x/y/z/w ms
        try:
            for line in output.split("\n"):
                if "avg" in line:
                    parts = line.split("=")[1].strip().split("/")
                    return float(parts[1])
        except:
            pass
        return 999.0

    def get_cloudflare_colo(self) -> str:
        """Get Cloudflare datacenter colo"""
        code, output = self.run_cmd("curl -s https://cloudflare.com/cdn-cgi/trace", timeout=10)
        if code != 0:
            return "UNKNOWN"

        for line in output.split("\n"):
            if line.startswith("colo="):
                return line.split("=")[1]
        return "UNKNOWN"

    def connect_warp(self) -> bool:
        """Connect to WARP"""
        self.log("🔄 Connecting WARP...")
        code, _ = self.run_cmd("warp-cli connect")
        time.sleep(3)
        status = self.get_warp_status()
        if status["connected"]:
            self.log("✅ WARP connected successfully")
            return True
        self.log("❌ WARP connection failed")
        return False

    def disconnect_warp(self) -> bool:
        """Disconnect WARP"""
        self.log("🔄 Disconnecting WARP...")
        code, _ = self.run_cmd("warp-cli disconnect")
        return code == 0

    def disable_tailscale_exit(self) -> bool:
        """Disable Tailscale exit node to avoid conflicts"""
        self.log("🔄 Disabling Tailscale exit node...")
        code, _ = self.run_cmd("tailscale set --exit-node=")
        return code == 0

    def enable_tailscale_exit(self, node: str) -> bool:
        """Enable specific Tailscale exit node"""
        self.log(f"🔄 Enabling Tailscale exit node: {node}")
        code, _ = self.run_cmd(
            f"tailscale up --accept-routes --exit-node={node} --exit-node-allow-lan-access"
        )
        time.sleep(5)
        return code == 0

    def optimize(self) -> bool:
        """Main optimization logic"""
        self.log("=" * 50)
        self.log("🌐 Network Optimizer Starting...")

        # Step 1: Check WARP status
        warp = self.get_warp_status()
        self.log(f"WARP: {'✅ Connected' if warp['connected'] else '❌ Disconnected'}")

        # Step 2: Disable Tailscale exit node if active (prevent conflicts)
        ts = self.get_tailscale_status()
        if ts.get("exit_node_active"):
            self.log("⚠️ Tailscale exit node active - disabling to avoid conflict")
            self.disable_tailscale_exit()

        # Step 3: Ensure WARP is connected
        if not warp["connected"]:
            if not self.connect_warp():
                self.log("⚠️ WARP failed, trying Mullvad fallback...")
                # Fallback to Mullvad
                for node in MULLVAD_NODES:
                    if self.enable_tailscale_exit(node):
                        latency = self.get_ping_latency()
                        if latency < PING_THRESHOLD_MS:
                            self.log(f"✅ Mullvad {node} active - {latency}ms")
                            return True
                self.log("❌ All network options failed!")
                return False

        # Step 4: Verify connection quality
        latency = self.get_ping_latency()
        colo = self.get_cloudflare_colo()

        self.log(f"📍 Cloudflare Colo: {colo}")
        self.log(f"⏱️ Ping Latency: {latency}ms")

        if latency > PING_THRESHOLD_MS:
            self.log(f"⚠️ High latency ({latency}ms), consider switching nodes")
        else:
            self.log(f"✅ Network optimal! ({latency}ms via {colo})")

        return True
    
    def get_status_report(self) -> Dict:
        """Return a structured status report"""
        warp = self.get_warp_status()
        ts = self.get_tailscale_status()
        colo = self.get_cloudflare_colo()
        latency = self.get_ping_latency()
        
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
            "quality": quality
        }
