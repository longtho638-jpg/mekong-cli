import json
import platform
import re
import ssl
import subprocess
import sys
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional


class QuotaConnector:
    """
    Handles connection to local Antigravity Language Server.
    """

    # API endpoint from vscode-antigravity-cockpit
    API_ENDPOINT = "/exa.language_server_pb.LanguageServerService/GetUserStatus"

    # Process names by platform (from vscode-antigravity-cockpit)
    PROCESS_NAMES = {
        "darwin_arm": "language_server_macos_arm",
        "darwin_x64": "language_server_macos",
        "linux": "language_server_linux",
    }

    def __init__(self):
        self._connect_port: Optional[int] = None
        self._csrf_token: Optional[str] = None

    def get_real_quota_data(self) -> Optional[Dict[str, Any]]:
        """
        Connects to local process and fetches quota data.
        Returns parsed JSON or None if failed.
        """
        try:
            connection_info = self._scan_for_antigravity_process()

            if connection_info:
                self._connect_port = connection_info["port"]
                self._csrf_token = connection_info["csrf_token"]
                return self._fetch_quota_from_api()

        except Exception:
            # Silent failure expected if process not running
            pass

        return None

    def _scan_for_antigravity_process(self) -> Optional[Dict[str, Any]]:
        """
        Scan for Antigravity Language Server process.
        Returns dict with 'port', 'csrf_token', and 'pid' if found.
        """
        # Determine target process name based on platform
        if platform.system() == "Darwin":
            arch = platform.machine()
            target_process = (
                self.PROCESS_NAMES["darwin_arm"]
                if arch == "arm64"
                else self.PROCESS_NAMES["darwin_x64"]
            )
        elif platform.system() == "Linux":
            target_process = self.PROCESS_NAMES["linux"]
        else:
            return None  # Windows not supported in this version

        try:
            # Get process info using ps command
            result = subprocess.run(
                ["ps", "aux"],
                capture_output=True,
                text=True,
                timeout=5,
            )

            for line in result.stdout.split("\n"):
                if target_process in line:
                    # Found the process! Extract PID and csrf_token from args
                    parts = line.split()
                    if len(parts) >= 2:
                        pid = int(parts[1])
                    else:
                        continue

                    token_match = re.search(r"--csrf_token[=\s]+([a-f0-9-]+)", line)

                    if token_match:
                        csrf_token = token_match.group(1)

                        # Get actual listening ports from lsof
                        ports = self._get_listening_ports(pid)

                        if ports:
                            # Find the correct API port by probing
                            for port in ports:
                                if self._verify_api_port(port, csrf_token):
                                    return {
                                        "port": port,
                                        "csrf_token": csrf_token,
                                        "pid": pid,
                                    }

        except (subprocess.TimeoutExpired, FileNotFoundError, ValueError):
            pass

        return None

    def _get_listening_ports(self, pid: int) -> List[int]:
        """Get all listening ports for a process using lsof."""
        try:
            result = subprocess.run(
                ["lsof", "-i", "-n", "-P"],
                capture_output=True,
                text=True,
                timeout=5,
            )

            ports = []
            for line in result.stdout.split("\n"):
                if str(pid) in line and "LISTEN" in line:
                    # Extract port from "127.0.0.1:58004 (LISTEN)"
                    port_match = re.search(r":(\d+)\s+\(LISTEN\)", line)
                    if port_match:
                        ports.append(int(port_match.group(1)))

            return ports

        except (subprocess.TimeoutExpired, FileNotFoundError):
            return []

    def _verify_api_port(self, port: int, csrf_token: str) -> bool:
        """Verify if a port responds to the API endpoint."""
        url = f"https://127.0.0.1:{port}{self.API_ENDPOINT}"

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        req = urllib.request.Request(
            url,
            data=json.dumps({}).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Connect-Protocol-Version": "1",
                "X-Codeium-Csrf-Token": csrf_token,
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=3, context=ctx) as response:
                return response.status == 200
        except:
            return False

    def _fetch_quota_from_api(self) -> Optional[Dict[str, Any]]:
        """
        Fetch quota data from local Antigravity Language Server API.
        Calls: POST https://127.0.0.1:{port}/exa.language_server_pb.LanguageServerService/GetUserStatus
        """
        if not self._connect_port or not self._csrf_token:
            return None

        url = f"https://127.0.0.1:{self._connect_port}{self.API_ENDPOINT}"

        # Request body (empty object for GetUserStatus)
        data = json.dumps({}).encode("utf-8")

        # Create SSL context that doesn't verify (localhost self-signed cert)
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        # Create request with required headers
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "Connect-Protocol-Version": "1",
                "X-Codeium-Csrf-Token": self._csrf_token,
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=10, context=ctx) as response:
                body = response.read().decode("utf-8")
                return json.loads(body)
        except (urllib.error.URLError, json.JSONDecodeError):
            return None
