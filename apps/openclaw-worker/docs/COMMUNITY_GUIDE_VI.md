🦞 Biến Claude Code thành ĐỘI QUÂN AI tự hành — chỉ bằng 1 file text

Ae dev ơi, chia sẻ tool mình vừa open-source 🔥

—————————————

❓ VẤN ĐỀ QUEN THUỘC

Mở Claude Code → gõ task → ngồi đợi → xong → gõ task tiếp...
10 task × 15 phút = 2.5 tiếng ngồi chờ 😴

✅ GIẢI PHÁP: OpenClaw Worker

Tạo 1 file text → thả vào thư mục → 3 AI agent TỰ nhận việc, chạy SONG SONG.
Không cần ngồi canh. Không copy-paste. Pipeline tự động từ A-Z.

—————————————

🎥 NÓ HOẠT ĐỘNG NHƯ NÀO?

Bạn tạo file text mô tả task
→ System detect trong 5 giây
→ Gửi vào Worker trống (round-robin)
→ Claude CLI thực thi full TUI
→ Xong → archive → nhận task mới

Trên màn hình thấy 4 ô chia đều:

📋 Log viewer  |  🦞 AI Worker 1
🦞 AI Worker 2  |  🦞 AI Worker 3

Real-time xem AI agent đang code cho mình 👀

—————————————

🆕 TÍNH NĂNG MỚI: Nhận Task trong 4 Phút với Antigravity Proxy

Trước đây setup phải mất 15-30 phút config API key, giờ chỉ 4 phút:

1️⃣ Worker nhận task file trong 5s
2️⃣ Antigravity Proxy tự route qua Google Cloud Code
3️⃣ 12 model AI sẵn sàng (Flash ⚡ + Pro 🔥)
4️⃣ 2 Google accounts xoay Hybrid — không bị rate limit

Hỗ trợ 12 Models:

| Model              | Loại         | Dùng cho               |
|--------------------|--------------|-----------------------|
| gemini-3-flash     | Flash ⚡     | Task nhanh, code nhẹ  |
| gemini-3-pro-high  | Pro 🔥       | Task nặng, kiến trúc  |
| gemini-2.5-flash   | Flash        | Phân tích, debug      |
| gemini-2.5-pro     | Pro          | Review code           |
| claude-sonnet-4-5  | Claude       | Coding chính          |
| claude-opus-4-6    | Opus         | Task phức tạp nhất    |
| ...và 6 model khác | Thinking/Lite| Tùy nhu cầu          |

—————————————

⚡ SETUP NHANH = 4 PHÚT

Bước 1: Cài đặt cơ bản (1 phút)

```bash
brew install tmux
npm install -g @anthropic-ai/claude-code
git clone https://github.com/longtho638-jpg/openclaw-worker.git
cd openclaw-worker
```

Bước 2: Cài Antigravity Proxy (1 phút)

```bash
# Cài proxy — biến Google AI thành Anthropic API
npm install -g antigravity-claude-proxy@latest

# Start proxy trên port 9191
PORT=9191 nohup antigravity-claude-proxy start >> logs/antigravity-proxy.log 2>&1 &
```

Bước 3: Thêm Google Account (1 phút)

```bash
# Mở WebUI để thêm account
open http://localhost:9191

# Hoặc thêm qua CLI
antigravity-claude-proxy accounts add
```

→ Đăng nhập Google → OAuth token tự lưu vào database
→ Thêm 2+ accounts để xoay Hybrid (không bị rate limit)

Bước 4: Chạy Swarm (1 phút)

```bash
# Start 3 workers + log viewer
bash restore_swarm.sh
```

Xong! 4 ô hiện ra, 3 worker sẵn sàng nhận việc. 🦞

—————————————

🛡️ BẢO MẬT — Cloudflare WARP

Khuyến nghị bật Cloudflare WARP 1.1.1.1 để bảo vệ:

```bash
# Cài WARP (nếu chưa có)
brew install cloudflare-warp

# Bật WARP
warp-cli connect

# Kiểm tra
curl -s https://www.cloudflare.com/cdn-cgi/trace | grep warp
# Output: warp=on ✅
```

Lợi ích:
- 🔒 Traffic encrypted qua Cloudflare
- 🌐 IP ẩn sau Cloudflare datacenter
- 🛡️ Giảm risk bị Google phát hiện pattern

—————————————

📝 GIAO VIỆC = 1 DÒNG

```bash
echo "Add dark mode toggle" > tasks/mission_myapp_auto_dark_mode.txt
```

Thế thôi. AI tự làm. Bạn đi pha cafe ☕

—————————————

� KIỂM TRA HỆ THỐNG

```bash
# Health check proxy
curl http://localhost:9191/health

# Xem quota từng account
curl "http://localhost:9191/account-limits?format=table"

# Xem models available
curl http://localhost:9191/v1/models
```

—————————————

�💪 TÍNH NĂNG NỔI BẬT

🔄 3 worker song song — 3x nhanh hơn làm tay
🛡️ Tự phục hồi — worker treo → tự kill → chuyển task
🌡️ M1 Cooling — MacBook nóng → tự throttle
🔀 3 chế độ — tmux / headless / VS Code
🌍 Cross-platform — macOS, Linux, Windows (WSL)
🤖 12 AI models — Flash + Pro + Claude + Opus
🔐 OAuth tokens — lưu local, tự refresh
⚡ Hybrid Strategy — xoay 2+ accounts thông minh

—————————————

📊 TRƯỚC vs SAU

❌ Trước: Gõ tay → 1 task 1 lúc → ngồi canh → bị treo = stuck
✅ Sau: Drop file → 3 task song song → đi cafe → tự recovery

—————————————

🏗️ KIẾN TRÚC

```
� Task File (.txt)
  → 🦞 OpenClaw Worker (detect 5s)
    → 🔄 Antigravity Adapter (:11436)
      → 🚀 Antigravity Claude Proxy (:9191)
        → ☁️ Google Cloud Code (12 models)
        → 🛡️ Cloudflare WARP 1.1.1.1
```

—————————————

�🔗 LINK

🐙 GitHub: https://github.com/longtho638-jpg/openclaw-worker
🔧 Antigravity Proxy: https://github.com/badrisnarayanan/antigravity-claude-proxy
📜 License: MIT — tự do fork, sửa, thương mại hóa

Star ⭐ nếu thấy hay nhé!

"Để AI làm việc, bạn làm chiến lược." 🦞

#OpenSource #AI #ClaudeCode #DevTools #Automation #Vietnam #Developer #AICoding #tmux #AgentSwarm #Antigravity #GeminiFlash
