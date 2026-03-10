# Client Self-Hosted — Kiến Trúc Triển Khai Tối Ưu

> Client tự host trên máy của họ. Mình cung cấp kiến trúc + Docker images.
> **1 lệnh deploy** → Trading company 26 roles chạy auto.

---

## 1. NGUYÊN TẮC THIẾT KẾ

| # | Nguyên tắc | Lý do |
|---|-----------|-------|
| 1 | **1-Command Deploy** | Client không phải biết DevOps |
| 2 | **Data Never Leaves** | Trading data, API keys ở máy client |
| 3 | **BYOK (Bring Your Own Key)** | Client tự chọn LLM provider |
| 4 | **No Vendor Lock-in** | Chạy được với bất kỳ OpenAI-compatible LLM |
| 5 | **Auto-Update** | Watchtower pull image mới tự động |
| 6 | **Minimal Resources** | Chạy được trên VPS $5/mo (2 vCPU, 4GB RAM) |

---

## 2. KIẾN TRÚC CLIENT-HOSTED

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT'S MACHINE                          │
│              (VPS / Mac / Linux / Windows WSL)               │
│                                                              │
│  docker compose up -d  ← 1 LỆNH DUY NHẤT                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 DOCKER COMPOSE STACK                      │ │
│  │                                                          │ │
│  │  ┌──────────────┐    ┌──────────────┐                   │ │
│  │  │ 🦞 OPENCLAW  │    │ 📊 DASHBOARD │                   │ │
│  │  │ Node.js      │    │ React + Vite │                   │ │
│  │  │ Port 3000    │    │ Port 8080    │                   │ │
│  │  │              │    │              │                   │ │
│  │  │ - Scheduler  │    │ - Live P&L   │                   │ │
│  │  │ - Decision   │    │ - Positions  │                   │ │
│  │  │   Engine     │    │ - Reports    │                   │ │
│  │  │ - 26 Roles   │    │ - Settings   │                   │ │
│  │  └──────┬───────┘    └──────────────┘                   │ │
│  │         │                                                │ │
│  │         ▼                                                │ │
│  │  ┌──────────────┐    ┌──────────────┐                   │ │
│  │  │ 🤖 LLM       │    │ 🗄️ POSTGRES  │                   │ │
│  │  │ GATEWAY      │    │ (or SQLite)  │                   │ │
│  │  │ LiteLLM      │    │ Port 5432    │                   │ │
│  │  │ Port 9191    │    │              │                   │ │
│  │  │              │    │ - Trades     │                   │ │
│  │  │ Routes to:   │    │ - P&L snaps  │                   │ │
│  │  │ ├ Ollama     │    │ - Reports    │                   │ │
│  │  │ ├ Claude API │    │ - Config     │                   │ │
│  │  │ └ Any OpenAI │    │              │                   │ │
│  │  └──────────────┘    └──────────────┘                   │ │
│  │                                                          │ │
│  │  ┌──────────────┐    ┌──────────────┐                   │ │
│  │  │ 🔗 OLLAMA    │    │ 📡 REDIS     │                   │ │
│  │  │ (Optional)   │    │ (Optional)   │                   │ │
│  │  │ Port 11434   │    │ Port 6379    │                   │ │
│  │  │ Local LLM    │    │ Job Queue    │                   │ │
│  │  └──────────────┘    └──────────────┘                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  📁 Volumes (persistent):                                    │
│  ├── ./data/          → trades, P&L, reports                 │
│  ├── ./config/        → .env, schedule, thresholds           │
│  └── ./models/        → Ollama model cache                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. DEPLOYMENT PROFILES

### Profile A: Cloud API Only (Simplest — VPS $5/mo)
```
Yêu cầu: 2 vCPU, 2GB RAM, 10GB disk
LLM: Claude/Gemini/OpenAI API key (BYOK)
Cost: $5/mo VPS + $20-60/mo API
```
```yaml
# docker-compose.yml
services:
  openclaw:    # Tôm Hùm daemon
  dashboard:   # Web dashboard
  litellm:     # API proxy
  postgres:    # Trade history
# Không cần Ollama, không cần GPU
```

### Profile B: Hybrid Local + API ($10-20/mo)
```
Yêu cầu: 4 vCPU, 8GB RAM, 20GB disk
LLM: Ollama local (simple tasks) + API fallback (complex)
Cost: $10/mo VPS + $10-20/mo API (giảm 60-70%)
```
```yaml
services:
  openclaw:
  dashboard:
  litellm:
  ollama:      # Local LLM (qwen2.5-coder:7b)
  postgres:
```

### Profile C: Fully Local / Air-Gapped ($20-50/mo)
```
Yêu cầu: 8 vCPU, 32GB RAM hoặc GPU server
LLM: Ollama/vLLM local only — zero internet LLM calls
Cost: $20-50/mo VPS/GPU — $0 API cost
```
```yaml
services:
  openclaw:
  dashboard:
  litellm:
  ollama:       # Large model (qwen2.5-coder:32b)
  postgres:
  redis:        # Job queue for heavy workloads
```

### Profile D: Mac Desktop (Dev/Personal)
```
Yêu cầu: Mac M1/M2/M4, 16GB+ RAM
LLM: Ollama native Metal acceleration
Cost: $0 (electricity only)
```
```bash
# Không cần Docker — chạy native
brew install ollama
ollama pull qwen2.5-coder:7b
npm install && npm start
```

---

## 4. DOCKER COMPOSE — PRODUCTION

```yaml
# docker-compose.prod.yml
version: "3.9"

services:
  # ─── 🦞 OPENCLAW DAEMON ─────────────────────────────
  openclaw:
    image: ghcr.io/mekong-cli/openclaw-trader:latest
    restart: unless-stopped
    env_file: ./config/.env
    volumes:
      - ./data:/app/data
      - ./config:/app/config:ro
    depends_on:
      - litellm
      - postgres
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health')"]
      interval: 30s
      timeout: 10s
    networks:
      - trading-net

  # ─── 📊 DASHBOARD ───────────────────────────────────
  dashboard:
    image: ghcr.io/mekong-cli/openclaw-dashboard:latest
    restart: unless-stopped
    ports:
      - "${DASHBOARD_PORT:-8080}:8080"
    env_file: ./config/.env
    depends_on:
      - openclaw
    networks:
      - trading-net

  # ─── 🤖 LLM GATEWAY ────────────────────────────────
  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:9191:9191"  # localhost only — no external access
    command: >
      --config /app/config/litellm-config.yaml
      --port 9191
    volumes:
      - ./config/litellm-config.yaml:/app/config/litellm-config.yaml:ro
    env_file: ./config/.env
    networks:
      - trading-net

  # ─── 🗄️ DATABASE ────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: openclaw
      POSTGRES_USER: openclaw
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"  # localhost only
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U openclaw"]
      interval: 10s
    networks:
      - trading-net

  # ─── 🔗 OLLAMA (Optional — Profile B/C) ─────────────
  ollama:
    image: ollama/ollama:latest
    restart: unless-stopped
    profiles: ["local-llm"]  # Only starts with --profile local-llm
    ports:
      - "127.0.0.1:11434:11434"
    volumes:
      - ollama-models:/root/.ollama
    deploy:
      resources:
        limits:
          memory: 8G
    networks:
      - trading-net

  # ─── 🔄 AUTO-UPDATE ─────────────────────────────────
  watchtower:
    image: containrrr/watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 86400 --cleanup  # Check daily
    profiles: ["auto-update"]

volumes:
  pgdata:
  ollama-models:

networks:
  trading-net:
    driver: bridge
```

---

## 5. CLIENT .ENV CONFIG

```bash
# config/.env — Client điền thông tin của họ

# ─── LLM Provider (chọn 1 hoặc nhiều) ──────────────
# Option 1: Claude API
ANTHROPIC_API_KEY=sk-ant-xxx

# Option 2: OpenAI API
OPENAI_API_KEY=sk-xxx

# Option 3: Gemini API
GOOGLE_API_KEY=AIza-xxx

# Option 4: Local Ollama (Profile B/C — no key needed)
OLLAMA_HOST=http://ollama:11434

# ─── Exchange API Keys ──────────────────────────────
BINANCE_API_KEY=
BINANCE_SECRET=
OKX_API_KEY=
OKX_SECRET=
OKX_PASSPHRASE=
BYBIT_API_KEY=
BYBIT_SECRET=

# ─── Trading Config ─────────────────────────────────
TRADING_MODE=paper          # paper | live
MAX_DAILY_LOSS_USD=100      # Emergency halt threshold
MAX_DRAWDOWN_PCT=20         # Portfolio drawdown halt
INITIAL_CAPITAL_USD=1000

# ─── System ──────────────────────────────────────────
DB_PASSWORD=secure-password-here
DASHBOARD_PORT=8080
LITELLM_MASTER_KEY=your-secret-key
TZ=Asia/Saigon              # Client's timezone
```

---

## 6. 1-COMMAND DEPLOY

```bash
# Client chạy đúng 3 lệnh:

# 1. Clone
git clone https://github.com/mekong-cli/openclaw-trader.git
cd openclaw-trader

# 2. Config
cp config/.env.example config/.env
nano config/.env  # Điền API keys

# 3. Deploy
docker compose -f docker-compose.prod.yml up -d

# Optional: Enable local LLM
docker compose -f docker-compose.prod.yml --profile local-llm up -d

# Optional: Auto-update
docker compose -f docker-compose.prod.yml --profile auto-update up -d
```

### Verify:
```bash
# Health check
curl http://localhost:3000/health    # OpenClaw daemon
curl http://localhost:8080           # Dashboard
curl http://localhost:9191/health    # LLM Gateway

# Logs
docker compose logs -f openclaw     # Trading logs
docker compose logs -f litellm      # LLM routing logs
```

---

## 7. BẢO MẬT CHO CLIENT

### 7.1 Network Isolation
```
✅ LLM Gateway (9191): localhost only — không expose
✅ Postgres (5432): localhost only — không expose
✅ Ollama (11434): localhost only — không expose
✅ Dashboard (8080): expose — client truy cập web UI
✅ Docker bridge network — containers giao tiếp nội bộ
```

### 7.2 Secrets Management
```
✅ .env file KHÔNG commit git (gitignore)
✅ Exchange API keys: read-only permissions recommended
✅ IP whitelisting trên exchange (chỉ cho VPS IP)
✅ Docker secrets cho production
```

### 7.3 Trading Safety
```
✅ Paper trading mặc định (TRADING_MODE=paper)
✅ Circuit breakers: tự halt khi drawdown > threshold
✅ Daily loss limit: emergency stop tự động
✅ Decision Engine: 3-tier AUTO/ESCALATE/HALT
✅ Client phải chủ động bật live: TRADING_MODE=live
```

---

## 8. MONITORING & ALERTS

```
Dashboard (port 8080):
├── Live P&L chart
├── Open positions
├── Trade history
├── System health (exchange connectivity, LLM status)
├── Alert rules (Telegram/Discord webhook)
└── Schedule viewer (26 roles × 7 cadences)

Alerts (client tự config):
├── Telegram Bot: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
├── Discord Webhook: DISCORD_WEBHOOK_URL
├── Email: SMTP_HOST + SMTP_USER (optional)
└── Triggers: drawdown, CB triggered, exchange down, LLM error
```

---

## 9. UPDATE & MAINTENANCE

```bash
# Auto-update (Watchtower profile)
# → Pulls new images daily, restarts containers

# Manual update
docker compose pull
docker compose up -d

# Backup
docker compose exec postgres pg_dump -U openclaw openclaw > backup.sql
cp -r data/ data-backup-$(date +%Y%m%d)/

# Restore
docker compose exec -i postgres psql -U openclaw openclaw < backup.sql
```

---

## 10. PRICING MODEL CHO CLIENT

| Tier | Bao gồm | Giá/tháng |
|------|---------|-----------|
| **Free** | Docker images, 4 strategies, paper trading | $0 |
| **Pro** | + Live trading, 12 strategies, email alerts | $29 |
| **Business** | + All 26 roles, custom strategies, priority support | $99 |
| **Enterprise** | + White-label, API access, dedicated support | Custom |

### Revenue Model:
- Docker images public (open-core)
- Pro features gated bằng license key trong .env
- `LICENSE_KEY=xxx` → OpenClaw verify on startup
- Polar.sh subscription management

---

## SO SÁNH: Trước vs Sau

| Aspect | Trước (Self-hosted) | Sau (Client-hosted) |
|--------|-------------------|-------------------|
| Ai chạy | Anh | Client tự chạy |
| Infra | Mac M1 cá nhân | Client's VPS/Mac |
| Deploy | tmux + expect + manual | `docker compose up -d` |
| LLM | Antigravity Proxy | LiteLLM (BYOK) |
| Scaling | 1 instance | Mỗi client 1 instance |
| Revenue | $0 | $29-99/client/mo |
| Support | N/A | Docs + Dashboard |

---

*Created: 2026-03-03 | Architecture v1.0*
*OpenClaw Trading Company — Client Self-Hosted Edition*
