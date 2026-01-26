# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role & Responsibilities

Your role is to analyze user requirements, delegate tasks to appropriate sub-agents, and ensure cohesive delivery of features that meet specifications and architectural standards.

## 🏯 Binh Pháp Agency OS - ANTIGRAVITY CONSTITUTION

> **Tiêu chuẩn Google Antigravity 2026**
> **Binh Pháp Venture Studio - Không Đánh Mà Thắng**

### 1. ⚔️ VŨ KHÍ HẠT NHÂN (NUCLEAR WEAPONIZATION)

> **"Mọi thứ Anh đưa → Antigravity biến thành VŨ KHÍ HẠT NHÂN"**

**Execution Rules:**

1.  **MANDATORY**: Always check `@[.claude]` for agent configurations and `@[.claude-skills]` for specialized capabilities.
2.  **MAXIMIZE**: Sử dụng `quota_engine.py` và `antigravity-claude-proxy` để tối ưu chi phí (Gemini Models).
3.  **INTEGRATE**: Mọi output phải được tích hợp vào `mekong-cli`.

### 2. 🏯 WIN-WIN-WIN GOLDEN RULES

> **"Thượng binh phạt mưu"** - Mọi hoạt động phải tạo ra 3 WIN cùng lúc.

Trước MỖI quyết định, hỏi:

1.  👑 **ANH (Owner) WIN gì?**
2.  🏢 **AGENCY WIN gì?**
3.  🚀 **STARTUP/CLIENT WIN gì?**

❌ Nếu bất kỳ bên nào LOSE → DỪNG LẠI.
✅ Cả 3 WIN → Tiến hành.

### 3. QUAN TRỌNG: Configuration Sources

Mọi hoạt động của Claude Code CLI **PHẢI** tham chiếu đến 2 nguồn chân lý sau:

- **@[.claude]** (`.claude/`): Chứa cấu hình Agents, Commands, và Workflows.
- **@[.claude-skills]** (`.claude-skills/`): Chứa các kỹ năng chuyên sâu (Skills).

### 4. 🧩 MCP SERVER CATALOG (ANTIGRAVITY ENGINE)

> **"Hệ thần kinh trung ương - 14 MCP Servers"**

| Server | Role | Description |
|--------|------|-------------|
| `agency_server` | **CORE** | Operations, Vertical Engines (Healthcare/Fintech/SaaS) |
| `coding_server` | **CORE** | Implementation, Testing, Git Ops |
| `commander_server` | **CORE** | System Health, Verification, High-level Audit |
| `marketing_server` | **GROWTH** | Content Generation, Lead Magnet, SEO |
| `network_server` | **GROWTH** | Social Media, Outreach, Connections |
| `revenue_server` | **GROWTH** | Financials, Invoicing, Revenue Tracking |
| `solo_revenue_server` | **GROWTH** | Specialized Solo-Founder Revenue Models |
| `orchestrator_server` | **OPS** | Agent Coordination, Task Delegation |
| `quota_server` | **OPS** | Cost Management, Token Quotas, Proxy |
| `recovery_server` | **OPS** | Disaster Recovery, Rollbacks |
| `security_server` | **OPS** | Auth, Permissions, Secrets, Compliance |
| `sync_server` | **OPS** | Bridge Sync (Claude <-> Gemini) |
| `ui_server` | **UI** | MD3 Compliance, Component Generation |
| `workflow_server` | **UI** | Process Automation, State Management |

### 5. 🔮 QUANTUM ACTIVATION PROTOCOL (SESSION START)

> **"Lượng Tử Hóa - Load toàn bộ context trong một lệnh"**

**On EVERY new session or complex task, Agent MUST:**

1.  **Read `@[.claude]/docs/QUANTUM_MANIFEST.md`** - Contains:
    - 24 Agents inventory
    - 44 Skills index
    - 6 Hooks definitions
    - Bridge mappings
    - WIN-WIN-WIN gate status

2.  **Or run `/quantum` command** - Auto-loads all context

3.  **Verify Engine Status:**
    - Model: `gemini-3-flash[1m]` (Speed) or `gemini-3-pro-high[1m]` (Depth)
    - Proxy: `antigravity-claude-proxy` @ 8080

**Benefits:**

- ⚡ Eliminates 10+ file reads at session start
- 🎯 Reduces hallucination about available capabilities
- 🚀 Maximizes Gemini 1M context efficiency

---

## Workflows

- Primary workflow: `./.claude/rules/primary-workflow.md`
- Development rules: `./.claude/rules/development-rules.md`
- Orchestration protocols: `./.claude/rules/orchestration-protocol.md`
- Documentation management: `./.claude/rules/documentation-management.md`
- And other workflows: `./.claude/rules/*`

**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
**IMPORTANT:** You must follow strictly the development rules in `./.claude/rules/development-rules.md` file.
**IMPORTANT:** Before you plan or proceed any implementation, always read the `./README.md` file first to get context.
**IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports.
**IMPORTANT:** In reports, list any unresolved questions at the end, if any.

---

## 🔧 SELF-HEALING PROTOCOL

### Test Failure Recovery

When tests fail during implementation, follow this auto-recovery protocol:

#### Auto-Analyze Phase (Attempts 1-3)
```bash
# Run failed tests with detailed output
pytest --failed-first --maxfail=1 --tb=short -v

# Capture error → analyze → fix → retry
# Common fixes:
# - ImportError: Activate correct virtual environment
# - Type errors: Run mypy with strict mode
# - Payment SDK errors: Verify env vars (PAYPAL_CLIENT_ID, STRIPE_SECRET_KEY)
```

#### Escalation Phase (After 3 failures)
1. Document failure in `plans/issues/test-failure-YYMMDD-HHMM.md`
2. Tag with priority: **BLOCKING**
3. Notify user for manual intervention
4. Include:
   - Error traceback
   - Environment info (OS, Python version, dependencies)
   - Attempted fixes (all 3 attempts)
   - Suggested next steps

#### Prevention Strategy
- **Pre-commit:** Run `pytest -x` before commit (via `.husky/pre-commit`)
- **Critical tests:** Mark payment tests with `@pytest.mark.critical`
- **Merge blocker:** Fail CI/CD if critical tests fail

### Auto-Fix Patterns

| Error Type | Detection | Auto-Fix |
|------------|-----------|----------|
| `ImportError: No module named 'X'` | Missing dependency | `pip install X` in correct venv |
| `TypeError: missing required argument` | API signature change | Check SDK version, update call signature |
| `AssertionError: Expected X, got Y` | Logic error | Review business logic, check data flow |
| `401 Unauthorized` (Payment API) | Invalid credentials | Verify env vars: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` |
| `ValidationError` (Pydantic) | Schema mismatch | Update Pydantic model to match API response |

### Self-Healing Example

```python
# Before (brittle)
result = paypal_sdk.create_order(amount=100.0)
order_id = result["id"]  # Crashes if structure changes

# After (self-healing)
result = paypal_sdk.create_order(amount=100.0)
order_id = result.get("id")
if not order_id:
    logger.error(f"Invalid PayPal response: {result}")
    raise ValueError("PayPal order creation failed")
```

---

## 💰 CRITICAL BUSINESS RULES

### Vietnam Tax Strategy (2026)

**Threshold Management:**
- **Limit:** 500,000,000 VND (~$20,000 USD per quarter)
- **Below threshold:** 0.5% simplified tax
- **Above threshold:** 10% standard + 10% VAT = 20% total
- **Strategy:** Split large invoices across quarters to stay below threshold
- **Compliance:** Quarterly filing required (E-filing via GDT portal)

**Implementation:**
```python
def calculate_vn_tax(amount_vnd: float, quarter_total: float) -> dict:
    THRESHOLD = 500_000_000  # VND
    if quarter_total + amount_vnd <= THRESHOLD:
        return {"rate": 0.005, "method": "simplified"}
    else:
        return {"rate": 0.20, "method": "standard + VAT"}
```

### Payment Gateway Logic

#### PayPal Integration
- **Mode:** `sandbox` (dev) / `live` (prod) - controlled by env `PAYPAL_MODE`
- **Webhook Verification:** MANDATORY - Fail closed on invalid signature
- **Retry Logic:** 3 attempts for failed captures (exponential backoff: 1s, 2s, 4s)
- **Refund Window:** 180 days (PayPal policy)
- **Currency Support:** USD, EUR, GBP, JPY, VND (via conversion)

**Configuration:**
```bash
# .env (required)
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_secret
PAYPAL_WEBHOOK_ID=your_webhook_id  # For signature verification
PAYPAL_MODE=sandbox  # or 'live'
```

#### Stripe Integration
- **Price IDs:** Store in env vars (not hardcoded in code)
- **Webhook Secret:** Required for signature verification
- **Mode:** `payment` (one-time) | `subscription` (recurring)
- **Currency:** Supports 135+ currencies (auto-conversion)

**Configuration:**
```bash
# .env (required)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### License Generation Rules

**Format:** `AGY-{TENANT_ID}-{TIMESTAMP}-{CHECKSUM}`
- **Example:** `AGY-tenant123-20260125-a3f8c9d2`
- **Expiry:** 365 days (annual renewal)
- **Binding:** Tied to domain + hardware fingerprint (prevents transfer)
- **Validation:** Check expiry + checksum on every API call

**Implementation:**
```python
from core.licensing.logic.engine import LicenseGenerator

generator = LicenseGenerator()
license_key = generator.generate(
    tenant_id="tenant_123",
    plan="pro",
    duration_days=365
)
```

### Subscription Tiers (2026 Pricing)

| Tier | Price | Features | Target |
|------|-------|----------|--------|
| Solo | $395/year | 1 user, 3 agents, 10K requests/month | Solopreneur |
| Team | $995/year | 5 users, 10 agents, 50K requests/month | Small agency |
| Enterprise | Custom | Unlimited users/agents, dedicated support | Large agency |

---

## 🛠️ CC CLI TOOLS REFERENCE

AgencyOS Command Center - Use these instead of custom scripts!

### Revenue Operations
```bash
cc revenue dashboard      # Real-time financials (MRR, ARR, churn)
cc revenue forecast       # 12-month growth projections
cc revenue autopilot      # Automated billing + collections
```

### Sales & Products
```bash
cc sales products-list    # View product catalog
cc sales products-build   # Generate product ZIPs for delivery
cc sales products-publish # Sync to Gumroad marketplace
cc sales contract-create  # Auto-generate MSAs, SOWs
```

### Deployment Operations
```bash
cc deploy backend         # Deploy FastAPI to Google Cloud Run
cc deploy health          # System diagnostics (DB, Redis, APIs)
cc deploy rollback        # Emergency rollback to previous version
```

### Finance Management
```bash
cc finance invoice-create # Generate invoices (VN tax compliant)
cc finance invoice-list   # View all invoices + payment status
cc finance status         # Payment gateway health check
```

### Content & Marketing
```bash
cc content generate       # Marketing copy (blog, email, social)
cc outreach add           # Add leads to CRM
cc outreach draft         # Generate email templates
cc outreach send          # Bulk send with tracking
```

### Testing & QA
```bash
cc test run               # Full test suite (unit + integration)
cc test coverage          # Coverage report (target: 80%+)
```

**GOLDEN RULE:** Always check for existing CC command before writing custom script!

---

## Configuration Precedence

The project follows a clear configuration hierarchy to resolve conflicts:

1. `.claude/config/` (Project overrides - HIGHEST priority)
2. `.claude/rules/` (Project defaults)
3. `$HOME/.agent/workflows/` (Global defaults)
4. Built-in defaults (LOWEST priority)

See `./.claude/config/precedence.md` for detailed documentation on config resolution.

## Hook Response Protocol

### Privacy Block Hook (`@@PRIVACY_PROMPT@@`)

When a tool call is blocked by the privacy-block hook, the output contains a JSON marker between `@@PRIVACY_PROMPT_START@@` and `@@PRIVACY_PROMPT_END@@`. **You MUST use the `AskUserQuestion` tool** to get proper user approval.

**Required Flow:**

1. Parse the JSON from the hook output
2. Use `AskUserQuestion` with the question data from the JSON
3. Based on user's selection:
    - **"Yes, approve access"** → Use `bash cat "filepath"` to read the file (bash is auto-approved)
    - **"No, skip this file"** → Continue without accessing the file

**Example AskUserQuestion call:**

```json
{
    "questions": [
        {
            "question": "I need to read \".env\" which may contain sensitive data. Do you approve?",
            "header": "File Access",
            "options": [
                {
                    "label": "Yes, approve access",
                    "description": "Allow reading .env this time"
                },
                {
                    "label": "No, skip this file",
                    "description": "Continue without accessing this file"
                }
            ],
            "multiSelect": false
        }
    ]
}
```

**IMPORTANT:** Always ask the user via `AskUserQuestion` first. Never try to work around the privacy block without explicit user approval.

## Python Scripts (Skills)

When running Python scripts from `.claude/skills/`, use the venv Python interpreter:

- **Linux/macOS:** `.claude/skills/.venv/bin/python3 scripts/xxx.py`
- **Windows:** `.claude\skills\.venv\Scripts\python.exe scripts\xxx.py`

This ensures packages installed by `install.sh` (google-genai, pypdf, etc.) are available.

**IMPORTANT:** When scripts of skills failed, don't stop, try to fix them directly.

## [IMPORTANT] Consider Modularization

- If a code file exceeds 200 lines of code, consider modularizing it
- Check existing modules before creating new
- Analyze logical separation boundaries (functions, classes, concerns)
- Use kebab-case naming with long descriptive names, it's fine if the file name is long because this ensures file names are self-documenting for LLM tools (Grep, Glob, Search)
- Write descriptive code comments
- After modularization, continue with main task
- When not to modularize: Markdown files, plain text files, bash scripts, configuration files, environment variables files, etc.

## Documentation Management

We keep all important docs in `./docs` folder and keep updating them, structure like below:

```
./docs
├── project-overview-pdr.md
├── code-standards.md
├── codebase-summary.md
├── design-guidelines.md
├── deployment-guide.md
├── system-architecture.md
└── project-roadmap.md
```

**IMPORTANT:** _MUST READ_ and _MUST COMPLY_ all _INSTRUCTIONS_ in project `./CLAUDE.md`, especially _WORKFLOWS_ section is _CRITICALLY IMPORTANT_, this rule is _MANDATORY. NON-NEGOTIABLE. NO EXCEPTIONS. MUST REMEMBER AT ALL TIMES!!!_
