"""
Network Operations
==================
Optimize network connectivity for ISP bypass and performance.
Strategy: WARP-first (FREE, stable, HKG/SIN/SGN routing) -> Fallback: Mullvad via Tailscale.
Includes special optimizations for Viettel ISP (SGN/Turbo mode).
"""

import concurrent.futures
import json
import socket
import subprocess
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Configuration
PING_TARGET = "1.1.1.1"
PING_THRESHOLD_MS = 100
LOG_FILE = Path.home() / ".network_optimizer.log"
WARP_CONFIG_FILE = Path.home() / ".warp_config.json"

# Preferred exit nodes (ordered by priority)
MULLVAD_NODES = [
    "sg-sin-wg-001.mullvad.ts.net",  # Singapore
    "hk-hkg-wg-201.mullvad.ts.net",  # Hong Kong
    "jp-tyo-wg-001.mullvad.ts.net",  # Tokyo
]

# WARP Optimization Constants
OPTIMAL_ENDPOINTS = [
    ("162.159.193.1", 2408),
    ("162.159.192.1", 2408),
    ("162.159.195.1", 2408),
    ("162.159.193.1", 500),
    ("162.159.192.1", 500),
    ("162.159.193.1", 4500),
    ("162.159.192.1", 4500),
    ("162.159.192.1", 1701),
]

ANYCAST_IPS = [
    "162.159.192.1",
    "162.159.193.1",
    "162.159.195.1",
    "162.159.192.2",
    "162.159.193.2",
    "162.159.195.2",
    "162.159.192.5",
    "162.159.193.5",
    "162.159.192.10",
]

COMMON_PORTS = [2408, 500, 4500, 1701, 854]


class NetworkOptimizer:
    """
    Manages network connectivity to ensure optimal routing and availability.
    Includes advanced tools for WARP endpoint scanning and ISP throttling bypass.
    """

    def log(self, msg: str):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        line = f"[{timestamp}] {msg}"
        print(line)
        try:
            with open(LOG_FILE, "a") as f:
                f.write(line + "\n")
        except Exception:
            pass

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

    # --- Status Checks ---

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
        except Exception:
            return {"online": False, "exit_node": None}

    def get_ping_latency(self, target: str = PING_TARGET) -> float:
        """Get ping latency to target"""
        code, output = self.run_cmd(f"ping -c 3 {target}")
        if code != 0:
            return 999.0

        try:
            for line in output.split("\n"):
                if "avg" in line:
                    parts = line.split("=")[1].strip().split("/")
                    return float(parts[1])
        except Exception:
            pass
        return 999.0

    def get_google_latency(self) -> float:
        """Test Google latency (HTTP)"""
        code, output = self.run_cmd(
            "curl -s -o /dev/null -w '%{time_total}' https://www.google.com/generate_204",
            timeout=10,
        )
        try:
            return float(output) * 1000
        except Exception:
            return 9999.0

    def get_cloudflare_colo(self) -> str:
        """Get Cloudflare datacenter colo"""
        code, output = self.run_cmd("curl -s https://cloudflare.com/cdn-cgi/trace", timeout=10)
        if code != 0:
            return "UNKNOWN"

        for line in output.split("\n"):
            if line.startswith("colo="):
                return line.split("=")[1]
        return "UNKNOWN"

    def get_current_ip_info(self) -> str:
        """Get current public IP and location"""
        code, output = self.run_cmd("curl -s https://ipinfo.io/json", timeout=10)
        if code == 0:
            try:
                data = json.loads(output)
                return f"{data.get('ip')} ({data.get('city')}, {data.get('country')})"
            except Exception:
                pass
        return "Unknown"

    # --- Actions ---

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

    def set_warp_endpoint(self, ip: str, port: int) -> bool:
        """Set custom WARP endpoint"""
        self.run_cmd("warp-cli disconnect")
        time.sleep(1)
        self.run_cmd(f"warp-cli tunnel endpoint set {ip}:{port}")
        time.sleep(1)
        self.run_cmd("warp-cli connect")
        time.sleep(3)
        status = self.get_warp_status()
        return status["connected"]

    def set_optimal_dns(self):
        """Set Google + Cloudflare DNS (macOS)"""
        self.run_cmd("networksetup -setdnsservers Wi-Fi 8.8.8.8 8.8.4.4 1.1.1.1 1.0.0.1")
        self.run_cmd("sudo dscacheutil -flushcache")
        self.run_cmd("sudo killall -HUP mDNSResponder")

    def disable_tailscale_exit(self) -> bool:
        """Disable Tailscale exit node"""
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

    # --- Optimization Logic ---

    def optimize(self) -> bool:
        """Standard optimization logic"""
        self.log("=" * 50)
        self.log("🌐 Network Optimizer Starting...")

        warp = self.get_warp_status()
        ts = self.get_tailscale_status()
        if ts.get("exit_node_active"):
            self.log("⚠️ Tailscale exit node active - disabling to avoid conflict")
            self.disable_tailscale_exit()

        if not warp["connected"]:
            if not self.connect_warp():
                self.log("⚠️ WARP failed, trying Mullvad fallback...")
                for node in MULLVAD_NODES:
                    if self.enable_tailscale_exit(node):
                        latency = self.get_ping_latency()
                        if latency < PING_THRESHOLD_MS:
                            self.log(f"✅ Mullvad {node} active - {latency}ms")
                            return True
                self.log("❌ All network options failed!")
                return False

        latency = self.get_ping_latency()
        colo = self.get_cloudflare_colo()
        self.log(f"📍 Cloudflare Colo: {colo}")
        self.log(f"⏱️ Ping Latency: {latency}ms")

        if latency > PING_THRESHOLD_MS:
            self.log(f"⚠️ High latency ({latency}ms), consider Turbo Mode")
        else:
            self.log(f"✅ Network optimal! ({latency}ms via {colo})")
        return True

    def find_best_endpoint(self, target_colo: str = "SGN") -> Optional[Dict]:
        """Find the endpoint with lowest latency, preferring target colo (SGN)"""
        self.log(f"🔍 Scanning for best endpoint (Target: {target_colo})...")

        tested = []
        for ip in ANYCAST_IPS[:5]:  # Limit for speed
            for port in COMMON_PORTS:
                self.log(f"  Testing {ip}:{port}...")
                if self.set_warp_endpoint(ip, port):
                    colo = self.get_cloudflare_colo()
                    latency = self.get_google_latency()

                    result = {"ip": ip, "port": port, "colo": colo, "latency": latency}
                    tested.append(result)

                    self.log(f"  → {colo} ({latency:.0f}ms)")

                    if colo == target_colo and latency < 100:
                        self.log("  ✅ Found target match!")
                        return result
                else:
                    self.log("  ❌ Connection failed")

        if tested:
            best = min(tested, key=lambda x: x["latency"])
            self.log(
                f"✅ Best found: {best['ip']}:{best['port']} ({best['colo']} @ {best['latency']:.0f}ms)"
            )
            return best
        return None

    def turbo_mode(self) -> bool:
        """Full optimization for Viettel/Throttle bypass"""
        self.log("\n🚀 VIETTEL TURBO MODE ACTIVATED")
        self.log("=" * 60)

        self.log("📡 Step 1: Setting optimal DNS...")
        self.set_optimal_dns()

        self.log("🔄 Step 2: Finding best WARP endpoint...")
        best = self.find_best_endpoint()

        if best:
            self.log(f"✅ Applying: {best['ip']}:{best['port']} ({best['colo']})")
            # Save config for quick connect
            config = {
                "optimal_endpoint": f"{best['ip']}:{best['port']}",
                "colo": best["colo"],
                "last_optimized": time.strftime("%Y-%m-%d %H:%M:%S"),
                "latency": best["latency"],
            }
            with open(WARP_CONFIG_FILE, "w") as f:
                json.dump(config, f, indent=2)
            return True

        self.log("❌ No working endpoint found")
        return False

    def scan_endpoints(self) -> List[Tuple[str, int, float]]:
        """Scan endpoint latencies using UDP"""

        def test_endpoint(ip, port):
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                sock.settimeout(2.0)
                start = time.time()
                sock.sendto(b"\x00" * 32, (ip, port))
                latency = (time.time() - start) * 1000
                sock.close()
                return (ip, port, latency)
            except Exception:
                return (ip, port, 9999.0)

        results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = []
            for ip in ANYCAST_IPS:
                for port in [2408, 500, 4500]:
                    futures.append(executor.submit(test_endpoint, ip, port))

            for future in concurrent.futures.as_completed(futures):
                res = future.result()
                if res[2] < 1000:
                    results.append(res)

        results.sort(key=lambda x: x[2])
        return results

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
