"""
Advanced network optimization logic.
"""
import concurrent.futures
import json
import socket
import time
from typing import Dict, List, Optional, Tuple

from .actions import ActionManager
from .models import ANYCAST_IPS, COMMON_PORTS, MULLVAD_NODES, PING_THRESHOLD_MS, WARP_CONFIG_FILE


class Optimizer(ActionManager):
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
