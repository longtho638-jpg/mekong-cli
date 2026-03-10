---
description: Kiểm tra sức khỏe toàn bộ hệ thống AgencyOS/Mekong
allowed-tools: Bash, Read
---

# /status — System Health Dashboard

## BƯỚC 1 — CHECK FROM TẤT CẢ SOURCES

Chạy song song các checks sau:

```bash
# 1. Ollama
curl -s http://localhost:11434/api/tags 2>/dev/null | head -1

# 2. API keys
echo $ANTHROPIC_API_KEY | head -c 10
echo $GOOGLE_API_KEY | head -c 10

# 3. MCU balance
cat .mekong/mcu_balance.json 2>/dev/null

# 4. Company config
cat .mekong/company.json 2>/dev/null

# 5. Git status
git status --short 2>/dev/null | wc -l
```

## BƯỚC 2 — IN DASHBOARD

```
┌─────────────────────────────────────────────────────┐
│  AgencyOS / Mekong CLI — System Status              │
│  {datetime}                                         │
├─────────────────────────────────────────────────────┤
│  RUNTIME                                            │
│  Ollama      {[●] running X models | [✗] offline}  │
│  Mekong API  {[●] running | [✗] not detected}      │
├─────────────────────────────────────────────────────┤
│  CREDENTIALS                                        │
│  Claude API  {[✓] key set | [✗] missing}           │
│  Gemini API  {[✓] key set | [✗] missing}           │
├─────────────────────────────────────────────────────┤
│  BILLING                                            │
│  MCU Balance {n} available  ({n} locked)           │
│  Tier        {starter|growth|premium}              │
├─────────────────────────────────────────────────────┤
│  COMPANY                                            │
│  Name        {company_name | NOT CONFIGURED}       │
│  Agents      {n}/8 configured                      │
│  Language    {vi|en|both}                          │
├─────────────────────────────────────────────────────┤
│  CODEBASE                                           │
│  Uncommitted {n} files changed                     │
│  Last commit {hash} {message}                      │
└─────────────────────────────────────────────────────┘

{IF any [✗] found:}
⚠️  Issues detected:
  → {actionable fix for each issue}

{IF first time (no .mekong/company.json):}
💡 Chưa setup company. Chạy: /company init
```
