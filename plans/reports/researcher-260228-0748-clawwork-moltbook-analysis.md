# ClawWork & Moltbook — Phân Tích Kỹ Thuật & Chiến Lược Tích Hợp
**Researcher:** a933f6ec2a08b73f4 | **Date:** 2026-02-28 | **Status:** Complete

---

## TÓM TẮT ĐIỀU HÀNH

| Project | Type | License | Stack | Tình trạng |
|---------|------|---------|-------|------------|
| ClawWork | AI Economic Benchmark | MIT | Python 3.10+ | Stable, v1.0+ |
| Moltbook | Agent Social Network / Identity Platform | Không rõ (proprietary) | Node.js/Express + Supabase | Live, 1.6M+ agents |

**Kết luận nhanh:**
- **ClawWork** = nguồn mở, rõ cấu trúc, có thể port sang Node.js trong 1–2 tuần
- **Moltbook** = closed backend, tích hợp qua REST API, MCP package sẵn có

---

## PHẦN 1: CLAWWORK

### 1.1 Định nghĩa cốt lõi

**ClawWork** là benchmark kinh tế biến AI thành "AI coworker" phải kiếm sống thực sự.

```
Traditional Benchmark:  Input → LLM → Output → Score (abstract)
ClawWork Benchmark:     Task → Agent (balance=$10) → Complete work → Earn $$$
                                  ↓                              ↓
                             Pay tokens                   Deduct cost
                             (reads from API)             + Add income
```

Nguồn: [HKUDS/ClawWork on GitHub](https://github.com/HKUDS/ClawWork)

### 1.2 GDPVal Dataset — 220 Tasks

| Attribute | Value |
|-----------|-------|
| Tổng tasks | **220** professional tasks |
| Sectors | **44** across 4 domains |
| Starting balance | **$10** |
| Max payment per task | $200–$300 range |
| Iterations/task | 15 max |
| Evaluator | GPT-5.2 với rubric chuyên biệt theo sector |

**4 Domains:**
1. Technology & Engineering
2. Business & Finance
3. Healthcare & Social Services
4. Legal, Media & Operations

**Ví dụ flow:**
```
Task: Buyers and Purchasing Agents — Manufacturing
ID: 1b1ade2d-f9f6-4a04-baa5-aa15012b53be
Max Payment: $247.30

Iter 1/15 → decide: work → submit → Earned: $198.44
Cost: $0.03 (tokens từ API response)
Balance: $10.00 + $198.44 - $0.03 = $208.41
```

### 1.3 Multi-Model Arena

Cơ chế **TrackedProvider** wrapper bọc mọi LLM call → deduct từ balance agent.

**Models đang test (2026-02-21):**
- Qwen3-Max, Kimi-K2.5, GLM-4.7
- Claude Sonnet 4.6
- Gemini 3.1 Pro

**3 Leaderboard Dimensions:**
1. Work Quality (task completion rate + rubric score)
2. Cost Efficiency (tokens per successful task)
3. Economic Sustainability (survival time on $10 budget)

### 1.4 Repository Architecture

```
ClawWork/
├── livebench/                      # Core engine
│   ├── agent/
│   │   ├── economic_tracker.py     # Balance + cost tracking ← PORT FIRST
│   │   ├── live_agent.py           # Main agent loop
│   │   ├── agent_loop.py           # Daily decision cycle
│   │   ├── tools.py                # 8-tool set (decide/submit/learn/...)
│   │   ├── task_classifier.py      # Task → sector routing
│   │   ├── wrapup_workflow.py      # Task completion
│   │   └── artifact_tools.py       # Work artifact generation
│   ├── data/
│   │   ├── tasks/                  # 220 GDPVal tasks (JSON)
│   │   └── agent_data/             # State persistence
│   ├── configs/                    # Model configs, prompts
│   └── main.py                     # Standalone CLI
├── clawmode_integration/           # OpenClaw/Nanobot integration ← REFERENCE
│   ├── agent_loop.py               # ClawMode wrapper
│   ├── provider_wrapper.py         # TrackedProvider ← CRITICAL PATTERN
│   ├── cli.py                      # /clawwork command
│   └── task_classifier.py          # Sector routing
├── eval/rubrics/                   # 44 category rubrics
├── frontend/                       # React dashboard (WebSocket)
└── requirements.txt                # Python deps
```

### 1.5 8-Tool Interface (core API)

```python
Tools:
  decide    # Choose work or learn activity
  submit    # Submit completed work for evaluation
  learn     # Build domain knowledge
  status    # Check balance/state
  search    # Research task requirements
  create    # Generate work artifacts
  execute   # Run commands/code
  video     # Generate video content
```

### 1.6 License

**MIT License** — tự do sử dụng, fork, modify, thương mại hóa với attribution.

### 1.7 Adaptation Strategy: ClawWork → openclaw-worker

#### Phase 1: Subprocess Wrapper (2 ngày, low risk)
```
openclaw-worker/
├── lib/clawwork-integration.js    # Python subprocess IPC
├── tools/clawwork-tools.js        # 8 tools as expect-injectable
└── config/clawwork-config.js      # Sector registry, prompts

Flow: Tôm Hùm (Node) → Python subprocess → ClawWork agent
Benefit: Nhanh, validate ngay, tận dụng expect brain
Risk: Subprocess overhead, 2 process stacks
```

#### Phase 2: Node.js Full Port (1 tuần, medium)
```
openclaw-worker/lib/
├── economic-tracker.js      # Port từ economic_tracker.py
├── gdpval-loader.js         # Load 220 tasks vào memory
├── task-classifier.js       # Route task → sector (keyword matching)
└── clawwork-tools.js        # 8 tools in Node.js

openclaw-worker/eval/
└── rubric-evaluator.js      # Call LLM API for scoring

openclaw-worker/data/
├── gdpval-tasks.json        # 220 task dataset (copy từ Python repo)
└── agent-economic-state.json # Balance persistence
```

#### Phase 3: Auto-CTO Extension (3 ngày, high value)
```javascript
// auto-cto-pilot.js extension
const ECONOMIC_TASKS = [
  'clawwork_manufacturing_3tasks',   // 3 GDPVal tasks, manufacturing sector
  'clawwork_finance_earning',        // Achieve $1,000 balance on model X
  'clawwork_learn_tech_sector',      // Build domain knowledge
];
// → generates economic missions khi queue empty
// → Tôm Hùm becomes economically productive
```

**Key files để extract từ ClawWork:**
- `livebench/agent/economic_tracker.py` → port sang `economic-tracker.js`
- `clawmode_integration/provider_wrapper.py` → `tracked-provider.js` (deduct từ balance)
- `livebench/data/tasks/*.json` → copy nguyên vào `data/gdpval-tasks.json`
- `livebench/agent/tools.py` → `lib/clawwork-tools.js`

**Dependencies cần thêm vào openclaw-worker:**
```json
{
  "dependencies": {
    "uuid": "^9.0.0"
  }
}
```
(Không cần thêm nhiều — economic tracker chỉ cần JSON file I/O và HTTP calls LLM API)

---

## PHẦN 2: MOLTBOOK

### 2.1 Platform Overview

**Moltbook** = mạng xã hội Reddit-style dành riêng cho AI agents. Humans chỉ có thể browse, không thể post. Launched tháng 1/2026.

**Scale hiện tại:**
- 1.6M+ AI agents đăng ký
- 2.5M users total
- 16,100+ submolts (communities)
- 740,000+ posts, 12M+ comments
- 17,000 human accounts → điều khiển 1.5M agents (tỷ lệ 88:1)

Nguồn: [Moltbook.com](https://www.moltbook.com/) | [GitHub moltbook/api](https://github.com/moltbook/api) | [Wiz Blog Security Analysis](https://www.wiz.io/blog/exposed-moltbook-database-reveals-millions-of-api-keys)

### 2.2 Services cho Agent Registration

**3 services chính:**

| Service | Mô tả |
|---------|-------|
| **Agent Registration** | Tạo identity, nhận API key + claim URL |
| **Identity Verification** | Temporary token system — portable reputation |
| **Heartbeat Protocol** | Mỗi 4 giờ fetch instructions từ moltbook.com |

### 2.3 API Chi Tiết

**Base URL:** `https://www.moltbook.com/api/v1`

#### Agent Registration (không cần auth)
```bash
POST /agents/register
Content-Type: application/json

{
  "name": "TomHum-AGI",
  "description": "Autonomous task dispatcher — Mekong-CLI ecosystem"
}

# Response:
{
  "api_key": "moltbook_sk_xxx",
  "claim_url": "https://moltbook.com/claim/xxx",
  "verification_code": "VERIFY_CODE_123"
}
```

#### Posting Agent Updates
```bash
POST /posts
Authorization: Bearer moltbook_sk_xxx
Content-Type: application/json

{
  "title": "Mission completed: 3 GDPVal tasks",
  "content": "Balance: $208.41. Tasks: Manufacturing sector. Time: 7h.",
  "submolt": "openclaw-explorers",
  "type": "text"
}

# Rate limit: 1 post / 30 phút
```

#### Identity Token Generation + Verification
```bash
# Step 1: Generate token (agent tự gọi với API key của mình)
POST /agents/identity-token
Authorization: Bearer moltbook_sk_xxx

# Response: { "token": "moltbook_tmp_yyy", "expires_in": 3600 }

# Step 2: Third-party verify token
POST /agents/verify-identity
X-Moltbook-App-Key: YOUR_APP_KEY
Content-Type: application/json

{ "token": "moltbook_tmp_yyy" }

# Response:
{
  "valid": true,
  "agent": {
    "id": "uuid",
    "name": "TomHum-AGI",
    "karma": 245,
    "post_count": 12,
    "is_claimed": true,
    "stats": { "posts": 12, "comments": 45 }
  }
}
```

#### Profile Update
```bash
PATCH /agents/me
Authorization: Bearer moltbook_sk_xxx

{
  "description": "Updated: v29.0 — AGI-level task completion"
}
```

#### Comment (Status Update dạng comment)
```bash
POST /posts/:id/comments
Authorization: Bearer moltbook_sk_xxx

{
  "content": "Mission update: Phase 2 complete. ClawWork balance: $1,247."
}

# Rate limit: 50 comments / 1 giờ
```

### 2.4 Backend Architecture (từ security analysis)

```
Stack:
  Node.js 18+ / Express
  PostgreSQL via Supabase
  JWT authentication
  Redis (optional, rate limiting)

Database Tables:
  agents           → name, api_keys, claim_tokens, karma_scores
  owners           → user emails, X handles, identity data
  posts            → content, votes, submolt
  comments         → nested threads
  votes            → upvote/downvote tracking
  submolts         → communities
  identity_verifications
  developer_apps

API key format: moltbook_sk_[encrypted_suffix]
Claim token:    moltbook_claim_[alphanumeric]
```

### 2.5 MCP Integration (npm package)

```bash
npm install moltbook-http-mcp -g
# Hoặc stdio mode:
npx moltbook-http-mcp
```

**Tools exposed qua MCP:**
- `register_agent`, `get_agent_status`, `update_profile`
- `create_post`, `list_posts`, `delete_post`
- `create_comment`, `vote_post`
- `list_submolts`, `subscribe_submolt`
- `semantic_search`
- `send_message`, `get_conversations`

**2 modes:**
```json
// HTTP mode (standalone server, port 3003):
{ "MOLTBOOK_API_KEY": "moltbook_sk_xxx" }

// Stdio mode (MCP config trong Claude/Cursor):
{
  "mcpServers": {
    "moltbook": {
      "command": "npx",
      "args": ["moltbook-http-mcp"],
      "env": { "MOLTBOOK_API_KEY": "moltbook_sk_xxx" }
    }
  }
}
```

Nguồn: [moltbook-http-mcp](https://libraries.io/npm/moltbook-http-mcp) | [moltbook-mcp GitHub](https://github.com/terminalcraft/moltbook-mcp)

### 2.6 Heartbeat Protocol

```
Mỗi 4 giờ:
  fetch("https://moltbook.com/heartbeat.json")
  → parse instructions
  → execute (post content, vote, follow agents)

CẢNH BÁO: Centralized instruction file = attack vector
  Nếu server bị compromise → toàn bộ agents nhận malicious instructions
  → KHÔNG dùng heartbeat trong production system
  → Dùng own scheduling (setInterval) thay thế
```

### 2.7 Integration Strategy: Moltbook → openclaw-worker

#### Minimal Integration (1 ngày)
```
openclaw-worker/lib/moltbook-client.js

class MoltbookClient {
  constructor(apiKey) { this.apiKey = apiKey; }

  async registerAgent(name, description) {
    return fetch('https://www.moltbook.com/api/v1/agents/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    }).then(r => r.json());
  }

  async postUpdate(title, content, submolt = 'openclaw-explorers') {
    return fetch('https://www.moltbook.com/api/v1/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, content, submolt, type: 'text' })
    }).then(r => r.json());
  }

  async generateIdentityToken() {
    return fetch('https://www.moltbook.com/api/v1/agents/identity-token', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    }).then(r => r.json());
  }
}
```

#### Auto-CTO Integration: Mission Reports trên Moltbook
```javascript
// auto-cto-pilot.js extension
// Sau khi mission complete → post lên Moltbook
if (MOLTBOOK_API_KEY && missionSuccess) {
  await moltbookClient.postUpdate(
    `Mission: ${missionId} complete`,
    `Project: ${project} | Tasks: ${taskCount} | Time: ${elapsed}h`,
    'openclaw-explorers'
  );
}
```

**Dependencies cần thêm:**
```json
{ "dependencies": {} }  // Zero! Chỉ dùng built-in fetch (Node 18+)
```

**Env vars cần thêm vào config.js:**
```javascript
const MOLTBOOK_API_KEY = process.env.MOLTBOOK_API_KEY || null;
const MOLTBOOK_AGENT_NAME = process.env.MOLTBOOK_AGENT_NAME || 'TomHum-AGI';
const MOLTBOOK_SUBMOLT = process.env.MOLTBOOK_SUBMOLT || 'openclaw-explorers';
```

---

## PHẦN 3: SO SÁNH & QUYẾT ĐỊNH

| Dimension | ClawWork | Moltbook |
|-----------|----------|----------|
| Độ phức tạp tích hợp | Medium (Python port) | Low (REST API) |
| Thời gian minimal viable | 2 ngày (subprocess) | 1 ngày (HTTP client) |
| Dependencies thêm | Gần như 0 | 0 (dùng fetch) |
| Risk | Thấp (MIT) | Medium (proprietary, breach history) |
| Value cho Tôm Hùm | Cao — economic accountability | Medium — identity + visibility |
| Maintenance | Thấp (source control) | Cao (phụ thuộc API Moltbook) |

### Ưu tiên tích hợp đề xuất:

1. **Moltbook Minimal** (1 ngày) → Đăng ký identity Tôm Hùm, post mission reports
2. **ClawWork Phase 1 Wrapper** (2 ngày) → Validate economic tracking với 5 tasks
3. **ClawWork Phase 2 Port** (1 tuần) → Native Node.js nếu performance cần
4. **ClawWork Phase 3 Auto-CTO** (3 ngày) → Đóng vòng lặp kinh tế

---

## UNRESOLVED QUESTIONS

1. **Moltbook Rate Limits** — 1 post/30min rất hạn chế cho mission reporting. Alternative: dùng comments (50/hr) cho granular updates, chỉ dùng posts cho mission milestones.

2. **Moltbook Stability** — Platform có breach history (1.5M API keys exposed Jan 2026). API stability dài hạn chưa confirmed. Nên wrapper với circuit breaker.

3. **ClawWork Token Cost Accuracy** — Có bao gồm thinking tokens (claude-3-7-sonnet thinking) trong cost tracking? Cần verify với OpenRouter/Anthropic response headers.

4. **GDPVal Payment Calibration** — $200–$300 per task có dựa trên BLS median hourly wages không? Cần verify tier formula trước khi integrate economic tracking.

5. **Moltbook Heartbeat Security** — Có nên implement heartbeat hay dùng own scheduling? KHÔNG dùng heartbeat trong production (centralized attack vector).

6. **Moltbook License** — Không tìm thấy open-source license. Toàn bộ backend là proprietary. API integration OK nhưng không fork/embed.

---

## KEY FILES THAM KHẢO

### ClawWork (để fork/adapt)
- `livebench/agent/economic_tracker.py` — Logic balance → port này đầu tiên
- `clawmode_integration/provider_wrapper.py` — TrackedProvider pattern (critical)
- `livebench/agent/tools.py` — 8-tool interface
- `livebench/data/tasks/*.json` — GDPVal task dataset (copy as-is)

### Moltbook (không fork, chỉ dùng API)
- API base: `https://www.moltbook.com/api/v1`
- MCP package: `npm install moltbook-http-mcp -g`
- GitHub API: `github.com/moltbook/api` (reference architecture)

---

*Sources:*
- [HKUDS/ClawWork GitHub](https://github.com/HKUDS/ClawWork)
- [Moltbook Developers](https://www.moltbook.com/developers)
- [GitHub moltbook/api](https://github.com/moltbook/api)
- [APIdog: Moltbook API Guide](https://apidog.com/blog/moltbook-api-ai-agents/)
- [moltbook-http-mcp npm](https://libraries.io/npm/moltbook-http-mcp)
- [GitHub easingthemes/moltbook-http-mcp](https://github.com/easingthemes/moltbook-http-mcp)
- [NeuralTrust: Moltbook Security Analysis](https://neuraltrust.ai/blog/moltbook)
- [Wiz Blog: Moltbook Breach](https://www.wiz.io/blog/exposed-moltbook-database-reveals-millions-of-api-keys)
- [Okta: Identity Lessons from Moltbook](https://www.okta.com/newsroom/articles/agents-run-amok--identity-lessons-from-moltbook-s-ai-experiment/)
- [DigitalOcean: What is Moltbook](https://www.digitalocean.com/resources/articles/what-is-moltbook)
- [CNBC: OpenClaw & Moltbook](https://www.cnbc.com/2026/02/02/openclaw-open-source-ai-agent-rise-controversy-clawdbot-moltbot-moltbook.html)
- [moltbook-mcp GitHub](https://github.com/terminalcraft/moltbook-mcp)
