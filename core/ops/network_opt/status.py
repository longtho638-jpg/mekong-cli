"""
Network status checking logic.
"""
import json
import logging
import subprocess
from datetime import datetime
from typing import Dict, Tuple

from .models import LOG_FILE, PING_TARGET

logger = logging.getLogger(__name__)

class StatusChecker:
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
