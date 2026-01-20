"""
Network connectivity actions.
"""
import time

from .status import StatusChecker


class ActionManager(StatusChecker):
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
