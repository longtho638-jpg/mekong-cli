#!/usr/bin/env python3
"""
🌉 AntiBridge Server
Simple HTTP server with chat API for remote AI control.
"""

import http.server
import json
import os
import socketserver
from pathlib import Path
from urllib.parse import urlparse

PORT = int(os.environ.get("ANTIBRIDGE_PORT", 8000))
SCRIPT_DIR = Path(__file__).parent


class AntiBridgeHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler with chat API support."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SCRIPT_DIR), **kwargs)

    def do_GET(self):
        """Handle GET requests."""
        parsed = urlparse(self.path)

        # Serve index.html for root
        if parsed.path == "/":
            self.path = "/index.html"

        return super().do_GET()

    def do_POST(self):
        """Handle POST requests (chat API)."""
        parsed = urlparse(self.path)

        if parsed.path == "/api/chat":
            self.handle_chat()
        else:
            self.send_error(404, "Not Found")

    def handle_chat(self):
        """Process chat messages."""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))

            message = data.get("message", "")

            # Process command
            response = self.process_command(message)

            # Send response
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            self.wfile.write(
                json.dumps({"success": True, "response": response}).encode("utf-8")
            )

        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(
                json.dumps({"success": False, "error": str(e)}).encode("utf-8")
            )

    def process_command(self, message: str) -> str:
        """Process incoming command and return response."""
        message = message.strip()

        # Built-in commands
        if message == "/status":
            return self.cmd_status()
        elif message == "/help":
            return self.cmd_help()
        elif message == "/test":
            return "✅ Kết nối thành công! AntiBridge đang hoạt động."
        elif message.startswith("/"):
            return f"🤖 Received command: `{message}`\n\n(Đang trong demo mode - kết nối với Antigravity IDE sẽ được thêm sau)"
        else:
            return (
                f'💬 Bạn nói: "{message}"\n\n(Demo mode - AI response sẽ được tích hợp)'
            )

    def cmd_status(self) -> str:
        """Return system status."""
        import subprocess

        # Get basic info
        try:
            hostname = subprocess.check_output(["hostname"]).decode().strip()
        except:
            hostname = "unknown"

        # Get IPs
        try:
            local_ip = (
                subprocess.check_output(
                    ["ipconfig", "getifaddr", "en0"], stderr=subprocess.DEVNULL
                )
                .decode()
                .strip()
            )
        except:
            local_ip = "N/A"

        try:
            tailscale_ip = (
                subprocess.check_output(
                    ["tailscale", "ip", "-4"], stderr=subprocess.DEVNULL
                )
                .decode()
                .strip()
            )
        except:
            tailscale_ip = "N/A (offline)"

        return f"""📊 **AntiBridge Status**

🖥️ Host: `{hostname}`
🌐 LAN IP: `{local_ip}`
🔗 Tailscale: `{tailscale_ip}`
🚀 Server: Running on port {PORT}

✅ All systems operational"""

    def cmd_help(self) -> str:
        """Return help text."""
        return """❓ **AntiBridge Commands**

📊 `/status` - Xem trạng thái hệ thống
🧪 `/test` - Test kết nối
❓ `/help` - Hiện trợ giúp này
🚀 `/ship` - Deploy code

💬 Gõ bất kỳ text nào để gửi đến AI

📱 **Quick Tips:**
- Dùng nút nhanh ở trên để thao tác
- Swipe để xem lịch sử chat"""

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        """Custom logging."""
        print(f"[AntiBridge] {args[0]}")


def get_ips():
    """Get local and Tailscale IPs."""
    import subprocess

    local_ip = "localhost"
    tailscale_ip = None

    try:
        local_ip = (
            subprocess.check_output(
                ["ipconfig", "getifaddr", "en0"], stderr=subprocess.DEVNULL
            )
            .decode()
            .strip()
        )
    except:
        pass

    try:
        tailscale_ip = (
            subprocess.check_output(
                ["tailscale", "ip", "-4"], stderr=subprocess.DEVNULL
            )
            .decode()
            .strip()
        )
    except:
        pass

    return local_ip, tailscale_ip


def main():
    """Start the server."""
    print()
    print("🌉 AntiBridge Server")
    print("═" * 50)
    print()

    local_ip, tailscale_ip = get_ips()

    print("📍 Access URLs:")
    print(f"   Local:     http://localhost:{PORT}")
    print(f"   LAN:       http://{local_ip}:{PORT}")
    if tailscale_ip:
        print(f"   Tailscale: http://{tailscale_ip}:{PORT}")
    print()
    print("Press Ctrl+C to stop")
    print()

    with socketserver.TCPServer(("", PORT), AntiBridgeHandler) as httpd:
        httpd.allow_reuse_address = True
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Server stopped")


if __name__ == "__main__":
    main()
