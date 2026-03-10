---
description: Wizard khởi tạo solo agentic company — 8 agents + hybrid LLM routing config
allowed-tools: Read, Write, Bash
---

# /company init — Company Setup Wizard

**Chạy wizard này một lần để setup toàn bộ hệ thống.**

## PRE-CHECK
```
IF .mekong/company.json tồn tại AND NOT --reset:
  Print:
    ⚠️  Company đã được setup: {company_name}
    Gõ /company init --reset để cấu hình lại (xóa config cũ)
  DỪNG
```

## WIZARD — 5 CÂU HỎI

Print:
```
╔══════════════════════════════════════════════════╗
║  AgencyOS — Solo Company Setup Wizard           ║
║  5 câu hỏi · ~2 phút · miễn phí MCU            ║
╚══════════════════════════════════════════════════╝
```

**Q1:** Tên công ty / sản phẩm của bạn là gì?
→ Đọc input. Lưu vào `company_name`

**Q2:** Loại sản phẩm chính:
```
[1] SaaS subscription (MCU-based billing)
[2] Digital product / download
[3] API service (pay-per-use)
[4] Consulting / freelance service
```
→ Đọc input [1-4]. Lưu vào `product_type`

**Q3:** Hardware của bạn:
```
[1] RTX 3090 / 4090 hoặc cao hơn (≥24GB VRAM) — Local-first
[2] RTX 2080 / 3080 / 4070 (8-16GB VRAM)      — Hybrid
[3] Không có GPU hoặc GPU yếu                   — API-only
[4] Apple Silicon M2 Pro / M3 Pro+              — Metal local
```
→ Đọc input [1-4]. Map sang scenario:
```
1 → scenario: "local_first"
2 → scenario: "hybrid"
3 → scenario: "api_only"
4 → scenario: "apple_silicon"
```

**Q4:** Budget LLM API mỗi tháng:
```
[1] $0 — Local only, không dùng API
[2] $20-50 — Minimal API (chỉ khi cần thiết)
[3] $50-200 — Hybrid thoải mái
[4] Không giới hạn
```
→ Map sang `budget_tier`: zero | minimal | hybrid | unlimited

**Q5:** Ngôn ngữ chính:
```
[1] Tiếng Việt
[2] English
[3] Cả hai (bilingual)
```
→ Lưu vào `primary_language`: vi | en | both

## TẠO CONFIG FILES

### File 1: `.mekong/company.json`
```json
{
  "company_name": "{company_name}",
  "product_type": "{product_type}",
  "scenario": "{scenario}",
  "budget_tier": "{budget_tier}",
  "primary_language": "{primary_language}",
  "created_at": "{iso_now}",
  "version": "1.0"
}
```

### File 2: `.openclaw/config.json`
Tạo routing config dựa vào scenario:

```json
{
  "routing_rules": {
    "cto": {
      "complex": "{opus nếu api allowed else local:deepseek}",
      "standard": "claude-sonnet-4-6",
      "simple": "claude-haiku-4-5"
    },
    "cmo": { "any": "gemini-2.0-flash" },
    "coo": { "any": "{local:llama3.2:3b nếu local available else claude-haiku-4-5}" },
    "cfo": { "any": "{local:qwen2.5:7b nếu local available else gemini-2.0-flash}" },
    "cs": { "any": "claude-haiku-4-5" },
    "sales": { "any": "claude-haiku-4-5" },
    "editor": { "any": "gemini-2.0-flash" },
    "data": { "any": "{local:qwen2.5:7b nếu local available else gemini-2.0-flash}" }
  },
  "fallback_chain": {
    "claude-opus-4-6": ["claude-sonnet-4-6", "gemini-2.0-flash"],
    "claude-sonnet-4-6": ["claude-haiku-4-5", "gemini-2.0-flash"],
    "ollama:llama3.2:3b": ["claude-haiku-4-5"]
  },
  "cost_override": {
    "budget_tier": "{budget_tier}"
  }
}
```

### File 3-10: `.mekong/agents/*.md` (8 agent prompt files)

Tạo từng file với company_name và language được inject:

**cto.md:**
```
You are the CTO of {company_name}.
Language: {primary_language}
Focus: Architecture, code quality, security, performance.
Never create code with placeholders or TODOs.
Always write tests for new functionality.
Apply Jidoka: stop immediately if touching schema/auth/billing.
```

**cmo.md:**
```
You are the CMO of {company_name}.
Language: {primary_language}
Focus: Marketing copy, brand voice, campaigns, SEO.
Every piece of content must have a clear CTA.
Tone: professional but approachable.
Always write in the language specified by the task.
```

**coo.md:**
```
You are the COO of {company_name}.
Language: {primary_language}
Focus: Operations, workflows, infra setup, process optimization.
Apply Toyota TPS: minimize waste, standardize processes.
Every operation must be idempotent and have rollback plan.
```

**cfo.md:**
```
You are the CFO of {company_name}.
Language: {primary_language}
Focus: Revenue tracking, cost analysis, MCU billing reconciliation.
Never share financial data with external APIs.
Always include margin calculations in reports.
```

**cs.md:**
```
You are the Customer Success Manager of {company_name}.
Language: {primary_language}
Focus: Customer support, retention, satisfaction.
Response tone: empathetic, solution-focused, fast.
Escalate to CTO if issue is technical. Escalate to CFO if billing dispute.
```

**sales.md:**
```
You are the Sales Agent of {company_name}.
Language: {primary_language}
Focus: Lead nurturing, upsell, conversion.
Never make promises that can't be delivered.
Personalize every outreach based on usage data.
```

**editor.md:**
```
You are the Content Editor of {company_name}.
Language: {primary_language}
Focus: Long-form writing, documentation, blog posts, newsletters.
Maintain consistent voice across all content.
Minimum 300 words for blog posts, 150 words for newsletters.
```

**data.md:**
```
You are the Data Analyst of {company_name}.
Language: {primary_language}
Focus: Metrics, reporting, business intelligence.
Always cite data sources. Never fabricate numbers.
Every report ends with 3 actionable recommendations.
Run locally — do not send raw data to external APIs.
```

### File 11: `CLAUDE.md` (update hoặc tạo mới)
Append vào đầu file:
```markdown
# {company_name} — AgencyOS Configuration

## Company
- Name: {company_name}
- Product: {product_type}
- Language: {primary_language}
- LLM Scenario: {scenario}

## Active Agents
CTO · CMO · COO · CFO · CS · Sales · Editor · Data

## Rules
- All tasks route through hybrid_router
- MCU must be deducted for every agent execution
- Memory auto-saved after every successful task
- Jidoka: stop on schema/auth/billing changes
```

### File 12: `.mekong/mcu_balance.json` (nếu chưa có)
```json
{
  "balance": 100,
  "locked": 0,
  "lifetime_used": 0,
  "tier": "starter",
  "last_updated": "{iso_now}"
}
```

## OUTPUT CONFIRMATION
```
╔══════════════════════════════════════════════════════╗
║  ✅ {company_name} is ready                         ║
╠══════════════════════════════════════════════════════╣
║  Scenario  : {scenario}                             ║
║  Budget    : {budget_tier}                          ║
║  Language  : {primary_language}                     ║
║  Agents    : 8/8 configured                        ║
║  MCU       : 100 starter credits                   ║
╠══════════════════════════════════════════════════════╣
║  Est. monthly cost: {based on scenario}             ║
║  Break-even: {n} users at Starter tier             ║
╠══════════════════════════════════════════════════════╣
║  Next steps:                                        ║
║  /status          — verify all services running    ║
║  /company run "…" — start first task               ║
║  /company report  — see dashboard                  ║
╚══════════════════════════════════════════════════════╝
```

Cost estimate by scenario:
- local_first: ~$27/mo (Ollama only + minimal API)
- hybrid: ~$52-65/mo
- api_only: ~$145/mo
- apple_silicon: ~$35/mo (Metal acceleration)
