# LiteLLM Gateway SOPs — Vận Hành OpenClaw Nguồn Mở

> SOPs vận hành kiến trúc LLM nguồn mở cho Tôm Hùm autonomous trading.
> 3-Tier: Local Ollama → GPU vLLM → Cloud API fallback.

---

## Tổng Quan Kiến Trúc

```
Tôm Hùm Daemon → localhost:9191 → LiteLLM Gateway
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              TIER 1: LOCAL       TIER 2: GPU         TIER 3: CLOUD
              Ollama :11434       vLLM :8081          Claude/Gemini
              Phi-4, Qwen-7B     Qwen-32B            Sonnet/Opus
              $0/token            $0.15/1M            $3-15/1M
```

**Zero code change** — Tôm Hùm vẫn gọi `localhost:9191` như trước.
LiteLLM thay Antigravity Proxy, cùng OpenAI-compatible API.

### Nguyên Lý Hoạt Động

1. Tôm Hùm gọi model `"claude-sonnet-4-6-20250514"` → LiteLLM nhận request
2. `model_group_alias` remap: `"claude-sonnet-4-6-20250514"` → `"local-coder"`
3. Gateway route đến Ollama `qwen2.5-coder:7b` (Tier 1, FREE)
4. Nếu Ollama fail/timeout → fallback `gpu-coder` (Tier 2) → `claude-sonnet` (Tier 3)
5. Response trả về cho Tôm Hùm — format OpenAI-compatible, không đổi

### Files Quan Trọng

| File | Mục đích |
|------|---------|
| `config/litellm-open-source-gateway-config.yaml` | Config gateway: models, routing, fallback |
| `scripts/start-open-source-llm-gateway.sh` | Script khởi động gateway |
| `config/.env.example` | Template biến môi trường |
| `docker-compose.client.yml` | Docker stack cho client self-hosted |

---

## SOP-L01: Khởi Động Gateway (5 phút)

**Khi:** Bật máy, sau reboot, hoặc gateway crash.

```bash
# Bước 1: Verify Ollama running
curl -s http://localhost:11434/api/tags | head -5
# Nếu fail:
ollama serve &

# Bước 2: Verify models đã pull
ollama list
# CẦN CÓ ít nhất:
#   phi4:14b-q4_K_M        (health checks, lint)
#   qwen2.5-coder:7b       (code review, bug fix)

# Bước 3: Start gateway
./scripts/start-open-source-llm-gateway.sh
# Hoặc manual:
litellm --config config/litellm-open-source-gateway-config.yaml --port 9191

# Bước 4: Verify
curl http://localhost:9191/health
# → {"status": "healthy"}

# Bước 5: Start Tôm Hùm (nếu chưa chạy)
node apps/openclaw-worker/task-watcher.js
```

**Checklist:**
```
□ Ollama alive (port 11434)
□ Models loaded (ollama list ≥ 2 models)
□ LiteLLM alive (port 9191)
□ Health endpoint OK
□ Tôm Hùm daemon alive
```

---

## SOP-L02: Health Check Hàng Ngày (2 phút)

**Khi:** Mỗi sáng, trước khi hệ thống bắt đầu trading cadence.

```bash
# 1. Gateway health
curl -s http://localhost:9191/health | python3 -m json.tool

# 2. Ollama models
ollama list

# 3. Quick inference test (phải respond <5s)
time curl -s http://localhost:9191/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer openclaw-local" \
  -d '{"model":"local-fast","messages":[{"role":"user","content":"1+1"}],"max_tokens":5}'

# 4. Disk space (models chiếm 4-20GB)
df -h / | tail -1
du -sh ~/.ollama/models/ 2>/dev/null

# 5. Fallback count (nhiều = local đang có vấn đề)
grep -c "fallback\|retry" ~/litellm-gateway.log 2>/dev/null || echo "0"
```

**Đánh giá:**

| Status | Điều kiện | Hành động |
|--------|----------|-----------|
| 🟢 GREEN | Health OK, inference <5s, fallback <5/ngày | Để chạy |
| 🟡 YELLOW | 1 tier unavailable hoặc latency 5-15s | Monitor + check SOP-L08 |
| 🔴 RED | Gateway down hoặc no model respond | Fix ngay SOP-L08 |

---

## SOP-L03: Quản Lý Model Ollama

### Pull Model Mới
```bash
ollama pull <model-name>
# Ollama tự verify SHA256 — an toàn

# Models khuyến nghị theo RAM máy:
# 8GB:  qwen2.5-coder:7b, deepseek-r1:7b
# 16GB: phi4:14b-q4_K_M, qwen2.5-coder:14b
# 32GB: qwen2.5-coder:32b, deepseek-r1:32b
```

### Xóa / Cập Nhật
```bash
# Xóa model cũ giải phóng disk
ollama rm <model-name>

# Update (pull lại, skip nếu unchanged)
ollama pull qwen2.5-coder:7b-instruct-q4_K_M
```

### Memory Optimization (M1/M2 16GB — QUAN TRỌNG)
```bash
# Thêm vào ~/.zshrc:

# Giữ model loaded 30m thay vì 5m default
# → Giảm cold start 10-20s xuống <1s
export OLLAMA_KEEP_ALIVE=30m

# Max 2 models cùng lúc (tránh OOM)
export OLLAMA_MAX_LOADED_MODELS=2

# Flash Attention (giảm RAM khi context dài)
export OLLAMA_FLASH_ATTENTION=1

# Quantize KV cache (giảm thêm 30-50% RAM)
export OLLAMA_KV_CACHE_TYPE=q8_0
```

**Lưu ý:** Sau sửa `.zshrc`, restart Ollama: `pkill -f ollama && ollama serve &`

---

## SOP-L04: Routing & Fallback

### Bảng Routing Trading Commands

| Trading Command | Tier | Model | Lý do |
|-----------------|------|-------|-------|
| `/trading:exec-spec health` | 1 | Phi-4 local | Simple check, free |
| `/trading:sre uptime` | 1 | Phi-4 local | Simple check |
| `/trading:coo health` | 1 | Qwen-7B local | Medium analysis |
| `/trading:cfo review` | 1 | Qwen-7B local | Financial review |
| `/trading:cto audit` | 2 | Qwen-32B GPU | Complex code audit |
| `/trading:ceo risk` | 2 | Qwen-32B GPU | Strategic analysis |
| `/trading:all quarterly` | 2+3 | GPU + cloud fallback | Full 26-role review |
| `/trading:founder:emergency` | 3 | Claude Opus | Max accuracy needed |

### Thay Đổi Routing

Sửa `config/litellm-open-source-gateway-config.yaml`:
```yaml
router_settings:
  model_group_alias:
    "claude-sonnet-4-6-20250514": "gpu-coder"  # đổi từ local-coder
```
Restart: `kill $(lsof -ti:9191) && ./scripts/start-open-source-llm-gateway.sh`

### Fallback Chain (tự động)
```
local-coder → gpu-coder → claude-sonnet
local-fast  → local-coder → gemini-flash
gpu-coder   → claude-opus
```
Config trong `fallbacks:` section. Không cần code change.

---

## SOP-L05: GPU Server (Tier 2 — Optional)

### Setup vLLM
```bash
# 1. Thuê GPU: RunPod RTX 4090 ($0.39/hr) hoặc A100 ($0.79/hr)
# 2. Install + start
pip install vllm
vllm serve Qwen/Qwen2.5-Coder-32B-Instruct \
  --quantization awq --max-model-len 32768 \
  --port 8081 --host 0.0.0.0

# 3. SSH tunnel từ local
ssh -L 8081:localhost:8081 user@runpod-ip -N &

# 4. Verify
curl http://localhost:8081/v1/models
```

### Tắt GPU (tiết kiệm ngoài giờ)
```bash
kill $(lsof -ti:8081) 2>/dev/null
# GPU stop trên RunPod dashboard
# → LiteLLM tự fallback: gpu-coder → claude-opus (Tier 3)
```

---

## SOP-L06: Backup & DR

### Daily Backup
```bash
# Config
cp config/litellm-open-source-gateway-config.yaml \
   config/litellm-backup-$(date +%Y%m%d).yaml

# Trading data
cp -r data/ backup/data-$(date +%Y%m%d)/
```

### DR Playbook

| Scenario | RTO | Hành động |
|----------|-----|-----------|
| Gateway crash | 30s | `./scripts/start-open-source-llm-gateway.sh` |
| Ollama crash | 1m | `ollama serve &` → gateway tự reconnect |
| Model corrupted | 5m | `ollama rm <model> && ollama pull <model>` |
| GPU tunnel drop | 30s | `ssh -L 8081:localhost:8081 user@ip -N &` |
| Full reboot | 3m | SOP-L01 từ đầu |
| Config mất | 1m | `git checkout config/` |

### Docker Backup (Client-Hosted)
```bash
docker compose down
tar czf openclaw-backup-$(date +%Y%m%d).tar.gz data/ config/ .env
docker compose up -d
```

---

## SOP-L07: Bảo Mật

### Network Isolation
```bash
# macOS (pfctl):
echo "block in on en0 proto tcp to port 9191" | sudo pfctl -ef -

# Linux (iptables):
iptables -A INPUT -p tcp --dport 9191 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 9191 -j DROP
iptables -A INPUT -p tcp --dport 11434 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 11434 -j DROP
```

### API Key Rules
```bash
# Production: set master key
export LITELLM_MASTER_KEY="$(openssl rand -hex 32)"

# Cloud keys từ .env, KHÔNG hardcode
export ANTHROPIC_API_KEY="sk-ant-..."
export GOOGLE_API_KEY="..."

# Verify: 0 keys trong code
grep -r "sk-ant\|AIza" config/ src/ --include="*.ts" --include="*.js" --include="*.yaml"
```

### Model Supply Chain
```bash
# Ollama tự verify SHA256 khi pull — safe by default
# Manual: sha256sum model.safetensors → compare HuggingFace hash
```

---

## SOP-L08: Troubleshooting

### Gateway Không Start
```bash
lsof -i:9191                    # Port conflict?
kill $(lsof -ti:9191)           # Free port
pip show litellm                # Installed?
python3 -c "import yaml; yaml.safe_load(open('config/litellm-open-source-gateway-config.yaml'))"  # Config valid?
litellm --config config/litellm-open-source-gateway-config.yaml --port 9191 --detailed_debug  # Debug mode
```

### Ollama Không Respond
```bash
pgrep -f ollama                  # Process alive?
ollama serve &                   # Restart nếu dead
top -l 1 | head -10              # RAM hết?
ollama stop <model> && ollama run <model> "test"  # Model stuck?
```

### Latency Cao (>20s)
```bash
# Nguyên nhân #1: Model unloaded sau 5m idle
export OLLAMA_KEEP_ALIVE=30m     # Fix: giữ loaded lâu hơn
# Nguyên nhân #2: Model quá lớn cho RAM
ollama list                      # Check size vs available RAM
# Nguyên nhân #3: CPU throttling (M1 thermal)
pmset -g therm                   # Check thermal state
```

### Fallback Quá Nhiều (local fail → cloud)
```bash
ollama ps                        # Model loaded?
ollama run qwen2.5-coder:7b "test" > /dev/null  # Warm up
tail -50 ~/litellm-gateway.log | grep "fallback\|error"  # Check logs
grep model_group_alias config/litellm-open-source-gateway-config.yaml  # Alias đúng model name?
```

### Tôm Hùm Không Nhận Response
```bash
curl http://localhost:9191/health                    # Gateway alive?
tail -50 ~/tom_hum_cto.log | grep "error\|timeout"  # Tôm Hùm logs
# Test bypass Tôm Hùm:
curl http://localhost:9191/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer openclaw-local" \
  -d '{"model":"local-coder","messages":[{"role":"user","content":"hello"}]}'
```

---

## SOP-L09: Chi Phí

### So Sánh (20M tokens/tháng)

| Phương án | $/tháng | Tiết kiệm |
|-----------|---------|-----------|
| Claude Opus API | $300 | baseline |
| Claude Sonnet API | $60 | 80% |
| **Hybrid Local+GPU** | **$45** | **85%** |
| Mac M1 local only | $30 | 90% |

### Tối Ưu
1. `OLLAMA_KEEP_ALIVE=30m` → giảm cold start → ít fallback → ít cloud cost
2. Model nhỏ cho task đơn giản (Phi-4 cho health check)
3. Tắt GPU ngoài giờ trading
4. Monitor fallback rate: >10%/ngày → debug local model

---

## SOP-L10: Upgrade

### LiteLLM
```bash
pip install --upgrade litellm[proxy]
kill $(lsof -ti:9191) && ./scripts/start-open-source-llm-gateway.sh
```

### Ollama
```bash
curl -fsSL https://ollama.com/install.sh | sh  # Update
ollama pull qwen2.5-coder:7b-instruct-q4_K_M   # Re-verify models
```

### Đổi Model (vd: Qwen3 ra mắt)
```bash
ollama pull qwen3-coder:7b                       # 1. Pull mới
# 2. Sửa config: model: "ollama/qwen3-coder:7b"
# 3. Restart gateway
# 4. Test: curl localhost:9191/v1/chat/completions ...
ollama rm qwen2.5-coder:7b                       # 5. Xóa cũ
```

---

## SOP-L11: Client Self-Hosted

### 1-Command Deploy
```bash
git clone <repo> && cd openclaw
cp config/.env.example .env    # Sửa: API keys, trading config
docker compose -f docker-compose.client.yml up -d
# → 26 roles auto-trading chạy ngay
```

### 4 Profiles

| Profile | Yêu cầu | Chi phí |
|---------|---------|---------|
| A: Cloud API | 2 vCPU, 2GB RAM | $5 VPS + $20-60 API |
| B: Hybrid | 4 vCPU, 8GB RAM | $10-20 VPS + $5-15 API |
| C: Air-Gapped | GPU server riêng | $20-50 infra |
| D: Mac Desktop | Mac M1+ 16GB | $0 (điện) |

---

## SOP-L12: Checklist Vận Hành

### Daily (2 phút)
```
□ curl localhost:9191/health
□ ollama list (≥2 models)
□ df -h (>10% free disk)
□ Fallback count <5
```

### Weekly (15 phút)
```
□ Review ~/litellm-gateway.log
□ Cloud API usage (chi phí)
□ GPU tunnel stable (nếu Tier 2)
□ Backup config
```

### Monthly (1 giờ)
```
□ Update LiteLLM + Ollama
□ Review model selection
□ Cost analysis
□ Rotate API keys
□ Test DR (stop → restart gateway)
```

---

## Quick Reference

| Tình huống | Lệnh |
|-----------|-------|
| Start gateway | `./scripts/start-open-source-llm-gateway.sh` |
| Health check | `curl http://localhost:9191/health` |
| List models | `ollama list` |
| Pull model | `ollama pull <name>` |
| Test inference | `curl localhost:9191/v1/chat/completions -d '...'` |
| View logs | `tail -f ~/litellm-gateway.log` |
| Restart gateway | `kill $(lsof -ti:9191) && ./scripts/start-...` |
| Start Ollama | `ollama serve &` |
| GPU tunnel | `ssh -L 8081:localhost:8081 user@gpu-ip -N &` |
| Local-only | `./scripts/start-open-source-llm-gateway.sh --local-only` |
| Config | `config/litellm-open-source-gateway-config.yaml` |

---

*SOPs v1.0 — 2026-03-03*
*OpenClaw × LiteLLM × Ollama — Kiến Trúc Nguồn Mở*
*Ref: openclaw-open-source-llm-deployment-architecture.md | client-self-hosted-trading-company-deployment-architecture.md*
