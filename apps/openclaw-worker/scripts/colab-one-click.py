# ═══════════════════════════════════════════════════════════════
# 🧠 OpenClaw-RL — ONE CLICK SETUP (Đã sửa lỗi Indentation)
# Copy toàn bộ cell này vào Colab → Bấm Play → Xong!
# ═══════════════════════════════════════════════════════════════

import subprocess, os, time, threading, urllib.request

# GPU Check
print("🖥️ Kiểm tra GPU:")
os.system('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader')

# Clone repos
print("\n📥 Cloning repos...")
if not os.path.exists('OpenClaw-RL'):
    os.system('git clone --depth 1 https://github.com/Gen-Verse/OpenClaw-RL.git')

if not os.path.exists('OpenClaw-RL/slime'):
    os.system('cd OpenClaw-RL && git clone --depth 1 https://github.com/THUDM/slime.git')

# Install deps
print("\n📦 Cài đặt thư viện (2-3 phút)...")
os.system('pip install -q torch transformers accelerate vllm sglang[all] 2>/dev/null')
os.system('cd OpenClaw-RL && pip install -q -r requirements.txt 2>/dev/null')

# Cloudflare tunnel (sửa lỗi auth ngrok)
print("\n🌐 Mở Cloudflare tunnel...")
PORT = 30000
import re
if not os.path.exists('cloudflared-linux-amd64'):
    os.system('wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64')
    os.system('chmod +x cloudflared-linux-amd64')

os.system('pkill -f cloudflared')
os.system(f'nohup ./cloudflared-linux-amd64 tunnel --url http://127.0.0.1:{PORT} > cloudflared.log 2>&1 &')

PUBLIC_URL = None
for _ in range(30):
    time.sleep(1)
    if os.path.exists('cloudflared.log'):
        with open('cloudflared.log', 'r') as f:
            content = f.read()
            match = re.search(r'https://[-a-zA-Z0-9]+\.trycloudflare\.com', content)
            if match:
                PUBLIC_URL = match.group(0)
                break

if not PUBLIC_URL:
    print("❌ Error: Could not get Cloudflare URL, output:")
    if os.path.exists('cloudflared.log'):
        os.system('cat cloudflared.log')
    PUBLIC_URL = "http://localhost:30000"

# Config
API_KEY = f"openclaw-rl-{int(time.time())}"
MODEL = "Qwen/Qwen3-4B"
os.environ.update({
    'NUM_GPUS': '1', 'ACTOR_GPUS': '1', 'ROLLOUT_GPUS': '1', 'PRM_GPUS': '0',
    'HF_CKPT': MODEL, 'PRM_MODEL_PATH': MODEL, 'SAVE_CKPT': './checkpoints',
    'SGLANG_API_KEY': API_KEY, 'PORT': str(PORT),
})

# Start server
print(f"\n🚀 Khởi động RL server model {MODEL}...")
def run_server():
    os.system('cd OpenClaw-RL/slime && bash ../openclaw-rl/run_qwen3_4b_openclaw_rl.sh')
threading.Thread(target=run_server, daemon=True).start()

# Wait for ready
print("⏳ Đang tải model (khoảng 3-5 phút)...")
for i in range(60):
    time.sleep(5)
    try:
        req = urllib.request.Request(f'http://localhost:{PORT}/health')
        with urllib.request.urlopen(req, timeout=3) as r:
            if r.status == 200:
                print("\n✅ SERVER ĐÃ READY!")
                break
    except Exception:
        if i % 6 == 0:
            print(f"   Vẫn đang tải... ({i*5}s)")

# Print result
print("\n" + "="*60)
print("🧠 OpenClaw-RL SERVER ĐÃ SẴN SÀNG")
print(f"URL: {PUBLIC_URL}/v1")
print(f"Key: {API_KEY}")
print("\n📋 CHẠY 3 LỆNH NÀY TRÊN MÁY MAC CỦA SẾP:")
print(f'export OPENCLAW_RL_HOST="{PUBLIC_URL}/v1"')
print(f'export OPENCLAW_RL_API_KEY="{API_KEY}"')
print("cd ~/mekong-cli/apps/openclaw-worker && bash restart-cto.sh")
print("="*60)

print("\n🔄 Giữ tab này luôn mở để server không bị tắt...")
while True:
    time.sleep(300)
    print(f"💓 Server vẫn sống lúc {time.strftime('%H:%M:%S')}")
