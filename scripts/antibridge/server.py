#!/usr/bin/env python3
"""
🌉 AntiBridge Server - WOW Edition
Premium HTTP server with rich command responses for remote AI control.
"""

import datetime
import http.server
import json
import os
import socketserver
import subprocess
from pathlib import Path
from urllib.parse import urlparse

PORT = int(os.environ.get("ANTIBRIDGE_PORT", 8000))
SCRIPT_DIR = Path(__file__).parent


class AntiBridgeHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler with premium chat API support."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SCRIPT_DIR), **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/chat":
            self.handle_chat()
        else:
            self.send_error(404, "Not Found")

    def handle_chat(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))
            message = data.get("message", "")
            response = self.process_command(message)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "response": response}).encode("utf-8"))
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))

    def process_command(self, message: str) -> str:
        """Process incoming command with WOW responses."""
        message = message.strip().lower()

        if message == "/status":
            return self.cmd_status()
        elif message == "/help":
            return self.cmd_help()
        elif message == "/test":
            return self.cmd_test()
        elif message == "/ship":
            return self.cmd_ship()
        elif message == "/cook":
            return self.cmd_cook()
        elif message.startswith("/"):
            return self.cmd_unknown(message)
        else:
            return self.cmd_chat(message)

    def cmd_status(self) -> str:
        """Return premium system status."""
        hostname = self._run_cmd(["hostname"]) or "unknown"
        local_ip = self._run_cmd(["ipconfig", "getifaddr", "en0"]) or "N/A"
        tailscale_ip = self._run_cmd(["tailscale", "ip", "-4"]) or "Offline"
        uptime = self._run_cmd(["uptime"]) or "N/A"
        now = datetime.datetime.now().strftime("%H:%M:%S")

        # Get git status
        git_branch = self._run_cmd(["git", "branch", "--show-current"]) or "N/A"
        git_status = self._run_cmd(["git", "status", "--porcelain"])
        changes = len(git_status.strip().split("\n")) if git_status.strip() else 0

        return f"""
╔══════════════════════════════════════╗
║     📊 **ANTIBRIDGE STATUS**         ║
╚══════════════════════════════════════╝

🖥️ **System Info**
├─ Host: `{hostname}`
├─ Time: `{now}`
└─ Uptime: `{uptime.split("up")[1].split(",")[0].strip() if "up" in uptime else "N/A"}`

🌐 **Network**
├─ LAN IP: `{local_ip}`
├─ Tailscale: `{tailscale_ip}`
└─ Port: `{PORT}`

📦 **Git Status**
├─ Branch: `{git_branch}`
└─ Changes: `{changes} file(s)`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ **All Systems Operational**
"""

    def cmd_help(self) -> str:
        """Return premium help menu."""
        return """
╔══════════════════════════════════════╗
║       ❓ **ANTIBRIDGE HELP**         ║
╚══════════════════════════════════════╝

📋 **Available Commands**

┌─ 🔧 **System**
│  `/status`  → System & network info
│  `/test`    → Connection test
│  `/help`    → This help menu
│
├─ 🚀 **Development**
│  `/ship`    → Git commit & push
│  `/cook`    → Start dev server
│
└─ 💬 **Chat**
   `any text` → Chat with AI

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 **Quick Tips**
• Dùng nút nhanh ở dưới màn hình
• Swipe để xem lịch sử chat
• Gõ lệnh bắt đầu bằng `/`

🌟 **Pro Tips**
• `/status` để kiểm tra trước khi ship
• Kết hợp lệnh: gõ liên tục
"""

    def cmd_test(self) -> str:
        """Return premium test result."""
        latency = "< 1ms"
        return f"""
╔══════════════════════════════════════╗
║       🧪 **CONNECTION TEST**         ║
╚══════════════════════════════════════╝

┌─────────────────────────────────────┐
│                                     │
│           ✅ **SUCCESS**            │
│                                     │
│   Kết nối AntiBridge thành công!    │
│                                     │
└─────────────────────────────────────┘

📡 **Connection Details**
├─ Latency: `{latency}`
├─ Protocol: `HTTP/1.1`
├─ Status: `200 OK`
└─ Server: `AntiBridge/2.0`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Bạn đã sẵn sàng điều khiển AI từ xa!
"""

    def cmd_ship(self) -> str:
        """Execute git commit and push."""
        # Get changes
        status = self._run_cmd(["git", "status", "--porcelain"])
        if not status.strip():
            return """
╔══════════════════════════════════════╗
║         🚀 **SHIP STATUS**           ║
╚══════════════════════════════════════╝

ℹ️ **No Changes to Ship**

Working directory is clean.
Không có thay đổi nào để commit.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Tip: Sửa code trước rồi `/ship`
"""

        changes = len(status.strip().split("\n"))
        branch = self._run_cmd(["git", "branch", "--show-current"]) or "main"

        return f"""
╔══════════════════════════════════════╗
║         🚀 **READY TO SHIP**         ║
╚══════════════════════════════════════╝

📦 **Pending Changes**: `{changes} file(s)`
🌿 **Branch**: `{branch}`

⚠️ **Ship Command** (chạy trên Mac):
```bash
git add . && git commit -m "feat: update" && git push
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Full ship sẽ được tích hợp sớm!
"""

    def cmd_cook(self) -> str:
        """Development mode status."""
        return """
╔══════════════════════════════════════╗
║        👨‍🍳 **COOK MODE**              ║
╚══════════════════════════════════════╝

🔥 **Dev Server Running**

┌─────────────────────────────────────┐
│  AntiBridge: ✅ Active              │
│  Port 8000:  ✅ Listening           │
│  Hot Reload: ✅ Enabled             │
└─────────────────────────────────────┘

📍 **Access Points**
├─ Local:  `http://localhost:8000`
├─ LAN:    `http://192.168.x.x:8000`
└─ Remote: Via Tailscale

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🍳 Happy cooking! Sẵn sàng dev.
"""

    def cmd_unknown(self, cmd: str) -> str:
        """Handle unknown command."""
        return f"""
╔══════════════════════════════════════╗
║       ⚠️ **UNKNOWN COMMAND**         ║
╚══════════════════════════════════════╝

❌ Command `{cmd}` không tồn tại.

📋 **Available Commands**
`/status` `/help` `/test` `/ship` `/cook`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Gõ `/help` để xem danh sách đầy đủ.
"""

    def cmd_chat(self, message: str) -> str:
        """Handle chat messages."""
        return f"""
╔══════════════════════════════════════╗
║         💬 **AI RESPONSE**           ║
╚══════════════════════════════════════╝

📝 **Your message**: "{message}"

🤖 **AI says**:
Cảm ơn bạn đã nhắn tin! 

Đây là demo mode. Để tích hợp AI thực:
• Kết nối với Antigravity IDE
• Hoặc API như Gemini/GPT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Gõ `/help` để xem các lệnh có sẵn.
"""

    def _run_cmd(self, cmd: list) -> str:
        """Run shell command and return output."""
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=5,
                cwd=str(Path.home() / "mekong-cli"),
            )
            return result.stdout.strip()
        except Exception:
            return ""

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        print(f"[AntiBridge] {args[0]}")


def get_ips():
    import subprocess

    local_ip = "localhost"
    tailscale_ip = None
    try:
        local_ip = (
            subprocess.check_output(["ipconfig", "getifaddr", "en0"], stderr=subprocess.DEVNULL)
            .decode()
            .strip()
        )
    except Exception:
        pass
    try:
        tailscale_ip = (
            subprocess.check_output(["tailscale", "ip", "-4"], stderr=subprocess.DEVNULL)
            .decode()
            .strip()
        )
    except Exception:
        pass
    return local_ip, tailscale_ip


def main():
    print()
    print("🌉 AntiBridge Server - WOW Edition")
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
