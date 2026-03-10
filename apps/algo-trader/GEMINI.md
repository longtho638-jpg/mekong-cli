# GEMINI.md — Antigravity Agent Config

## 🔒 IRON RULE: CLAUDEKIT BẮT BUỘC (Chairman Decree 2026-02-17)

**ANTIGRAVITY HAY QUÊN NHẤT — CHỦ TỊCH CẤM QUÊN:**

Khi giao việc cho CC CLI (trực tiếp hoặc qua CTO task-watcher):
1. **MỌI task PHẢI dùng ClaudeKit command** — `/cook`, `/plan:hard`, `/debug`, `/plan:parallel`
2. **ĐA LUỒNG BẮT BUỘC** — 10+ subagents parallel (Commander Rule 13)
3. **DEEP 10x THINKING BẮT BUỘC** — Extended thinking budget
4. **CẤM gửi raw text** — Vi phạm = PHẢN QUÂN

### Command Map:
| Task Type  | Command |
|:-----------|:--------|
| Simple     | `/cook "task" --auto` |
| Complex    | `/plan:hard "task"` |
| Strategic  | `/plan:parallel "task"` |
| Debug      | `/debug "issue"` |
| Review     | `/review "target"` |

### Two-Call Mandate (tmux input):
1. Lệnh 1: Text (KHÔNG `\n`)
2. Lệnh 2: Enter riêng (`tmux send-keys Enter`)

### Dispatch via CTO:
- Tạo task file trong `/tasks/HIGH_*.txt` hoặc `/tasks/CRITICAL_*.txt`
- CTO (task-watcher) tự dispatch qua `mission-dispatcher.js`
- `mission-dispatcher.js` đã có `claudekitEnforcement` inject tự động

### 🔒 IRON RULE #2: CHỈ GIAO VIỆC QUA CTO (Chairman Decree 2026-02-17)
- **CẤM Antigravity gửi lệnh trực tiếp vào CC CLI** (tmux send-keys)
- **CHỈ ĐƯỢC tạo task file** → CTO tự dispatch
- **NGOẠI LỆ DUY NHẤT:** Chủ Tịch nói rõ "cho phép đè CC CLI"
- Vi phạm = Bất tuân quân lệnh

---

## Proxy Config
- Adapter: port 11436 (dual-Ultra rotation)
- AG Ultra 1: port 9191 (billwill)
- AG Ultra 2: port 9192 (cashback)
- Phoenix Failover: 9191↔9192 auto-retry

---

---

---

---

---

---

---

---

---

---

---

---

---

## Config

<!-- CLEO:START -->

# Task Management

Use `cleo` CLI for task ops. Full docs: `~/.cleo/docs/TODO_Task_Management.md`

<!-- CLEO:END -->

# GEMINI.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role & Responsibilities

Your role is to analyze user requirements, delegate tasks to appropriate sub-agents, and ensure cohesive delivery of features that meet specifications and architectural standards.

## Workflows

- Primary workflow: `$HOME/.claude/workflows/primary-workflow.md`
- Development rules: `$HOME/.claude/workflows/development-rules.md`
- Orchestration protocols: `$HOME/.claude/workflows/orchestration-protocol.md`
- Documentation management: `$HOME/.claude/workflows/documentation-management.md`
- And other workflows: `$HOME/.claude/workflows/*`

## Binh Pháp Strategic Rules (BMAD-Inspired)

@~/GEMINI.md
@~/GEMINI.md
@~/GEMINI.md
@~/GEMINI.md
@~/GEMINI.md

**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
**IMPORTANT:** You must follow strictly the development rules in `$HOME/.claude/workflows/development-rules.md` file.
**IMPORTANT:** Before you plan or proceed any implementation, always read the `./README.md` file first to get context.
**IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports.
**IMPORTANT:** In reports, list any unresolved questions at the end, if any.
**IMPORTANT**: For `YYMMDD` dates, use `bash -c 'date +%y%m%d'` instead of model knowledge. Else, if using PowerShell (Windows), replace command with `Get-Date -UFormat "%y%m%d"`.

## Documentation Management

We keep all important docs in `.` folder and keep updating them, structure like below:

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

<!-- CLAUDE-MEM QUICK REFERENCE -->

## 🧠 Memory System Quick Reference

### Search Your Memories (SIMPLE & POWERFUL)

- **Semantic search is king**: `mcp__claude-mem__chroma_query_documents(["search terms"])`
- **🔒 ALWAYS include project name in query**: `["claude-mem feature authentication"]` not just `["feature authentication"]`
- **Include dates for temporal search**: `["project-name 2025-09-09 bug fix"]` finds memories from that date
- **Get specific memory**: `mcp__claude-mem__chroma_get_documents(ids: ["document_id"])`

### Search Tips That Actually Work

- **Project isolation**: Always prefix queries with project name to avoid cross-contamination
- **Temporal search**: Include dates (YYYY-MM-DD) in query text to find memories from specific times
- **Intent-based**: "implementing oauth" > "oauth implementation code function"
- **Multiple queries**: Search with different phrasings for better coverage
- **Session-specific**: Include session ID in query when you know it

### What Doesn't Work (Don't Do This!)

- ❌ Complex where filters with $and/$or - they cause errors
- ❌ Timestamp comparisons ($gte/$lt) - Chroma stores timestamps as strings
- ❌ Mixing project filters in where clause - causes "Error finding id"

### Storage

- Collection: "claude_memories"
- Archives: ~/.claude-mem/archives/
<!-- /CLAUDE-MEM QUICK REFERENCE -->

## 🚨 CRITICAL RULES (KHÔNG ĐƯỢC QUÊN)

### Rule 1: send_command_input PHẢI là 2 LỆNH RIÊNG BIỆT

**LUÔN LUÔN** gửi 2 lệnh riêng biệt khi giao tiếp với CLI:

```xml
❌ SAI (chỉ 1 lệnh):
<invoke name="send_command_input">
<parameter name="Input">/scout show products</parameter>
</invoke>

✅ ĐÚNG (2 lệnh riêng biệt):
<!-- LỆNH 1: Gửi command -->
<invoke name="send_command_input">
<parameter name="Input">/scout show products
</parameter>
</invoke>

<!-- LỆNH 2: Gửi ENTER (empty với newline) -->
<invoke name="send_command_input">
<parameter name="Input">
</parameter>
</invoke>
```

**LÝ DO:** CLI cần ENTER riêng mới thực thi command.

### Rule 2: Quy Trình Giám Sát Command (BẮT BUỘC)

**4 BƯỚC KHÔNG ĐƯỢC BỎ QUA:**

1. **GỬI** - `send_command_input` với lệnh
2. **ENTER** - Đảm bảo có `\n` cuối Input (dòng trống sau text)
3. **GIÁM SÁT** - Dùng `command_status` chờ đến khi output hiện DONE
4. **CHUYỂN TASK** - Chỉ khi bước 3 confirm done mới chuyển sang task khác

```
❌ SAI: Gửi lệnh → Làm task khác ngay
✅ ĐÚNG: Gửi lệnh → Enter → Chờ done → Chuyển task
```

**KHÔNG BAO GIỜ** chuyển task khi chưa confirm command đã done.

### Rule 3: LUÔN DÙNG  COMMAND KHI DELEGATE — BẮT BUỘC

> **🚨 MỌI task gửi cho CC CLI PHẢI bắt đầu bằng ``!**
> Gửi raw text = NGHIÊM CẤM. Vi phạm = task bị reject.

**MỌI TÌNH HUỐNG** phải ánh xạ đến `.gemini/commands/` để chọn command phù hợp:

#### ❌ NGHIÊM CẤM (Raw Text Pattern):

```bash
# ❌ SAI - KHÔNG BAO GIỜ gửi raw text:
send_command_input: "Fix broken routes and sync prices..."
send_command_input: "Sophia 100/100 FINAL PUSH — Complete all..."

# ❌ SAI - Quên prefix /cook:
send_command_input: "Audit codebase and fix all issues"
```

#### ✅ BẮT BUỘC (Command Pattern):

```bash
# ✅ ĐÚNG - LUÔN LUÔN dùng /cook:
send_command_input: "/cook Fix broken routes, sync prices, verify production GREEN"
send_command_input: "/cook Sophia 100/100 — add /dashboard/support page, api-docs page, verify GREEN PRODUCTION"

# ✅ ĐÚNG - Hoặc dùng command phù hợp:
send_command_input: "/plan:hard Add OAuth2 authentication"
send_command_input: "/debug Login redirect failing on Safari"
send_command_input: "/review codebase security audit"
send_command_input: "/scout show all pricing components"
```

#### Command Map (chọn đúng command):

| Situation               | Command                    |
| ----------------------- | -------------------------- |
| Implement/build feature | ` "description"`      |
| Plan complex task       | ` "description"` |
| Quick plan              | ` "description"` |
| Debug issue             | ` "description"`     |
| Code review             | ``                  |
| Scan codebase           | ` "what to find"`    |
| Run tests               | ``                    |
| Commit                  | ``        |

**KHÔNG BAO GIỜ** gõ lệnh tự do khi có command sẵn trong claudekit.

#### Global Commands (~/.gemini/commands/)

```
/ask          - Hỏi đáp nhanh
/bootstrap    - Khởi tạo project
/brainstorm   - Brainstorm ý tưởng
/code         - Viết code
/cook         - Build/implement feature
/debug        - Debug lỗi
/design       - Design system/UI
/docs         - Generate documentation
/fix          - Fix bugs/issues
/git          - Git operations
/integrate    - Integration tasks
/journal      - Log công việc
/kanban       - Task management
/marketing    - Bootstrap marketing (HIẾN PHÁP MARKETING)
/marketing-ads    - Paid advertising bundle (Ch.2 作戰)
/marketing-copy   - Copywriting bundle (Ch.5 勢)
/marketing-cro    - CRO bundle (Ch.4 形勢)
/marketing-growth - Growth engineering bundle (Ch.12 火攻)
/marketing-local  - Local business bundle (Ch.10 地形)
/marketing-seo    - SEO bundle (Ch.3 謀攻)
/plan         - Lập kế hoạch
/preview      - Preview changes
/remember     - Lưu memory
/review       - Code review
/save         - Save state
/scout        - Scan codebase
/skill        - Skill operations
/test         - Run tests
/worktree     - Git worktree
```

#### Project Commands (/mekong-cli/.claude/commands/)

```
/antibridge   - AntiBridge setup
/antigravity  - Antigravity operations
/approve      - Approve actions
/binh-phap    - Binh Pháp analysis
/bridge       - Bridge operations
/build        - Build project
/claude-flow-* - Claude Flow CLI
/cloudflare   - Cloudflare operations
/commander    - Commander mode
/daemon       - Daemon control
/daily        - Daily ops
/delegate     - Delegate tasks
/gemini       - Gemini agent
/model-status - Check model status
/quantum      - Quantum operations
/quick-start  - Quick start guide
/recover      - Recover state
/revenue      - Revenue operations
/scaffold     - Scaffold new components
/ship         - Deploy to production
/sync         - Sync operations
/ui-check     - UI validation
```

**KHÔNG BAO GIỜ** gõ lệnh tự do khi có command sẵn trong claudekit.

### Rule 4: Allow List Terminal Commands (Auto-Run)

Commands an toàn để auto-run (thêm vào Settings → Agent → Allow List):

```
ls
cat
echo
head
tail
grep
find
pwd
which
npm run
npm test
npm run dev
python -m pytest
git status
git log
git diff
```

### Rule 5: GREEN PRODUCTION RULE — TUYỆT ĐỐI BẮT BUỘC

> **🚨 KHÔNG ĐƯỢC BÁO CÁO "DONE" KHI CHƯA VERIFY PRODUCTION GREEN!**
> Push xong rồi nói "Done" = THẤT BẠI. Vi phạm = task bị reject.

**SAU MỖI `git push`, PHẢI chạy ĐỦ 3 bước:**

```bash
# Bước 1: CI/CD Status (poll cho đến GREEN hoặc timeout 5 phút)
MAX_ATTEMPTS=10; ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))
  STATUS=$(gh run list -L 1 --json status,conclusion -q '.[0]' 2>/dev/null)
  echo "CI/CD: $STATUS"
  echo "$STATUS" | grep -q '"conclusion":"success"' && echo "✅ GREEN!" && break
  echo "$STATUS" | grep -q '"conclusion":"failure"' && echo "❌ FAILED - FIX NOW!" && break
  sleep 30
done

# Bước 2: Production HTTP Check
curl -sI "https://[PROD_URL]" | head -3  # PHẢI thấy HTTP 200

# Bước 3: Report (BẮT BUỘC format này)
echo "Build: ✅/❌ | Tests: ✅/❌ | CI/CD: ✅/❌ | Production: ✅/❌ HTTP [code]"
```

**❌ NGHIÊM CẤM (Push-and-Done Pattern):**

- ❌ `git push` → "Done. Pushed successfully."
- ❌ `git push` → Summary → End
- ❌ Báo cáo thành công mà chưa verify live site
- ❌ Dùng `vercel --prod` / `vercel deploy` (BANNED - chỉ dùng git push)

**✅ BẮT BUỘC:**

- ✅ `git push` → Poll CI/CD → Curl production → Report format → Done

### Rule 6: Input PHẢI CÓ `\n` (NHẮC LẠI VÌ HAY QUÊN)

**MỌI `send_command_input`** phải có `\n` ở cuối:

```json
// ❌ SAI - COMMAND SẼ TREO:
{"Input": "yes, commit please"}
{"Input": "2"}
{"Input": ""}

// ✅ ĐÚNG - COMMAND SẼ CHẠY:
{"Input": "yes, commit please\n"}
{"Input": "2\n"}
{"Input": "\n"}
```

**NẾU QUÊN `\n` → COMMAND TREO → WORKFLOW HỎNG → MẤT THỜI GIAN**

### Rule 7: CC CLI PHẢI CÓ BYPASS FLAG (ĐIỀU 50)

**MỌI lệnh khởi động CC CLI mới** PHẢI có `--dangerously-skip-permissions`:

```bash
# ❌ SAI - SẼ BỊ HỎI LIÊN TỤC:
cd /path/to/project && claude

# ✅ ĐÚNG - BYPASS TẤT CẢ PROMPTS:
cd /path/to/project && claude --dangerously-skip-permissions

# HOẶC với continue:
cd /path/to/project && claude --dangerously-skip-permissions --continue
```

**LÝ DO:**

- Không cần approve từng command
- Tiết kiệm thời gian
- Tự động chạy hết task đến khi xong
- Theo ĐIỀU 50: Mission success là ưu tiên tối thượng

**KHI KHÔNG CÓ FLAG:**

- CLI hỏi permission mỗi command
- Phải input "1" hoặc "2" liên tục
- Workflow bị ngắt quãng
- Mất thời gian chờ

### Rule 8: i18n SYNC PROTOCOL (Added 2026-02-03)

**Khi thêm/sửa bất kỳ t('key') nào trong code:**

1. **PHẢI** kiểm tra key đó tồn tại trong TẤT CẢ translation files (vi.ts, en.ts, etc.)
2. **PHẢI** đảm bảo key path CHÍNH XÁC giữa code và translation files
3. **PHẢI** grep toàn bộ codebase tìm t() calls VÀ so sánh với locales
4. **KHÔNG ĐƯỢC** để hardcoded strings trong JSX - tất cả phải dùng t()
5. **SAU KHI FIX** - phải build + verify browser để confirm không còn raw keys

**Ví dụ BUG đã xảy ra (WellNexus 2026-02-03):**

- Code dùng `t('landing.roadmap.stages.metropolis.name')`
- Nhưng `vi.ts` có `empire` thay vì `metropolis`
- → Raw key hiện trên production! Site broken!

**VERIFICATION STEPS:**

```bash
# 1. Grep all t() calls
grep -roh "t('[^']*')" src/ | sort -u > /tmp/used_keys.txt

# 2. Check each key exists in translation file
for key in $(cat /tmp/used_keys.txt); do
  grep -q "$key" src/locales/vi.ts || echo "MISSING: $key"
done
```

### Rule 9: PRODUCTION VERIFICATION PROTOCOL (Added 2026-02-03)

**KHÔNG TIN BÁO CÁO - PHẢI XÁC THỰC!**

1. Sau mỗi deploy, **PHẢI** verify bằng browser thực tế
2. Check Console errors, Network tab, Visual rendering
3. Chỉ báo "DONE" khi đã **XÁC THỰC** bằng screenshot/video
4. Nếu CC CLI báo "success" nhưng site broken → **FIX NGAY**, không tin report

**CONTEXT:** CC CLI đã báo cáo "PRODUCTION READY" nhưng site hiện màn hình đen!

### Rule 10: SKILL ACTIVATION PROTOCOL

**PHẢI** activate skills từ `.gemini/skills/` trước khi implement:

```bash
# Check available skills
ls .gemini/skills/

# Read skill before using
cat .gemini/skills/<skill-name>/SKILL.md
```

**KHÔNG ĐƯỢC** implement mà không kiểm tra có skill phù hợp hay không.

### Rule 11: SUPABASE AGENT SKILLS (Added 2026-02-03)

**LUÔN LUÔN** install và sử dụng Supabase Agent Skills khi làm việc với Supabase:

```bash
# Install via npx (recommended)
npx skills add supabase/agent-skills

# Hoặc install via Claude Code Plugin
/plugin marketplace add supabase/agent-skills
/plugin install postgres-best-practices@supabase-agent-skills
```

**Available Skills:**

- **postgres-best-practices**: Query optimization, schema design, RLS, connection management
- Auto-activated when tasks involve Supabase/Postgres

**Use Cases:**

- Quản lý Supabase Auth users (confirm email, create admin, etc.)
- Optimize SQL queries and schemas
- Configure Row-Level Security (RLS)
- Connection pooling và scaling

**Reference:** https://github.com/supabase/agent-skills

**QUAN TRỌNG:** Sau khi install, skills tự động available. Agent sẽ sử dụng khi detect relevant tasks.

### Rule 12: SUPABASE CLI PROGRAMMATIC SQL EXECUTION (Added 2026-02-05)

**Khi cần execute SQL file lên Supabase remote project:**

#### Option 1: Supabase CLI (Recommended)

```bash
# 1. Login (nếu MCP plugin shows "needs-auth")
npx supabase login

# 2. Link project
npx supabase link --project-ref <project-ref>

# 3. Execute SQL file
psql "$(npx supabase db url)" -f <sql-file>

# Hoặc dùng db push cho migrations
npx supabase db push
```

#### Option 2: Dashboard Manual (Fallback)

```bash
# Copy SQL to clipboard
cat docs/your-sql-file.sql | pbcopy

# Open dashboard
open "https://supabase.com/dashboard/project/<project-ref>/sql/new"

# Paste (Cmd+V) and Run (Cmd+Enter)
```

#### Verification Queries

```sql
-- Check functions
SELECT proname FROM pg_proc WHERE proname = 'your_function_name';

-- Check tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check triggers
SELECT tgname FROM pg_trigger WHERE tgrelid = 'your_table'::regclass;
```

**KHÔNG BAO GIỜ:**

- ❌ Retry nhiều lần khi access denied - login lại ngay
- ❌ Dùng Gemini CLI để execute SQL (complexity overkill)
- ❌ Chờ indefinitely khi MCP plugin needs-auth

**LƯU Ý:** Nếu `supabase link` fails với access denied, có thể do:

1. Chưa login đúng account (chạy `npx supabase login`)
2. Account không có access vào project (check Supabase dashboard permissions)
3. Project ref sai (verify ở dashboard URL)
---

### Rule 13: BROWSER DISCIPLINE — M1 PROTECTION + CHECKOUT VERIFICATION (Added 2026-02-09)

> **🚨 2 LUẬT SONG SONG — CẤM NHẦM LẪN!**

**LUẬT A: GEMINI (Antigravity Agent) — CẤM BROWSER SPAM**

MacBook M1 16GB — browser_subagent tốn ~2GB RAM. Mở liên tục = TREO MÁY.

1. **CẤM** Gemini mở browser để quản lý dashboards (Polar, Vercel, Stripe, GCP)
2. **BẮT BUỘC** dùng CLI/API/curl cho mọi thao tác quản trị
3. **GIAO CC CLI** qua `` — CC CLI tự xử lý toàn bộ

```
❌ Gemini mở browser tạo/edit Polar products
❌ Gemini mở browser check Vercel deployment
❌ Gemini mở browser nhiều lần trong 1 task
✅ Gemini dùng curl/API/CLI rồi delegate CC CLI
```

**LUẬT B: CC CLI — BẮT BUỘC TEST BROWSER TRƯỚC KHI BÁO DONE**

> **🚨 CC CLI PHẢI MỞ BROWSER TEST CHECKOUT FLOW TRƯỚC KHI XONG!**
> Code deploy xong ≠ DONE. Checkout chạy được ≠ DONE.
> CC CLI phải TỰ MỞ TRÌNH DUYỆT, click checkout, verify Polar redirect hoạt động.

1. **SAU KHI** deploy + CI/CD GREEN, CC CLI **PHẢI**:
   - Mở `https://sophia.agencyos.network` trên browser
   - Click nút checkout của TỪNG tier (Starter/Growth/Premium/Master)
   - Verify redirect đến Polar checkout page thành công
   - Screenshot proof cho mỗi tier
2. **KHÔNG ĐƯỢC** báo "Done" nếu chưa verify tất cả checkout flows
3. **NẾU** checkout fail → fix ngay → test lại → cho đến khi ALL PASS

```
❌ SAI: Push → CI GREEN → "Done! Deployed successfully"
❌ SAI: Push → CI GREEN → curl production 200 → "Done!"
✅ ĐÚNG: Push → CI GREEN → Mở browser → Click checkout → Polar redirect OK → Screenshot → Done
```

**KHÔNG CÓ BƯỚC TEST BROWSER = CHƯA XONG = THẤT BẠI**
---

## 📦 ClaudeKit Reference

Full docs at `docs.claudekit.cc`. Skills auto-activate from `.claude/skills/`.
Deep reference: `knowledge/CLAUDEKIT_BRAIN_INJECTION.md`

| Type | Count | Location |
|------|-------|----------|
| Agents | 17+ | Auto-activated by commands |
| Commands | 50+ | `.gemini/commands/` |
| Skills | 80+ | `.gemini/skills/` |
- **Skills:** https://docs.claudekit.cc/docs/engineer/skills
- **Discord:** https:/
---

## Rule: actual-fullstack-audit

# Actual Full Stack Infrastructure Audit - Global Standard

> **Binh Pháp Principle**: 地形 (Terrain) - Audit ALL 10 layers, không bỏ sót layer nào!
---

## 🎯 SCORING MATRIX

| Layer            | Scope                                 | Target Score |
| ---------------- | ------------------------------------- | ------------ |
| 1. Database 🗄️   | Schema, migrations, RLS, backups      | 9/10         |
| 2. Server 🖥️     | Hosting, Edge Functions, performance  | 8/10         |
| 3. Networking 🌐 | DNS, SSL, domain, email DNS           | 8/10         |
| 4. Cloud ☁️      | Providers, scaling, cost optimization | 8/10         |
| 5. CI/CD 🔄      | Pipelines, testing, deployment        | 9/10         |
| 6. Security 🔒   | Auth, secrets, headers, protection    | 9/10         |
| 7. Monitoring 📊 | Error tracking, APM, logging          | 8/10         |
| 8. Containers 📦 | Docker, orchestration (if applicable) | 7/10\*       |
| 9. CDN 🚀        | Caching, edge, geographic             | 8/10         |
| 10. Backup 💾    | DR plan, recovery testing             | 8/10         |

**Total Target: 82/100** (Enterprise Grade)

\*Note: Containers score adjusted for serverless architecture
---

## 🔴 MANDATORY AUDIT CHECKLIST

### Layer 1: DATABASE 🗄️

```yaml
checks:
  schema:
    - [ ] Migration files versioned by date
    - [ ] RLS (Row Level Security) enabled
    - [ ] Stored procedures for critical ops
    - [ ] Indexes optimized
  backup:
    - [ ] Automated daily backups
    - [ ] Point-in-time recovery available
    - [ ] Off-site backup to external storage
  disaster_recovery:
    - [ ] RPO defined (< 24h recommended)
    - [ ] RTO defined (< 4h recommended)
    - [ ] Multi-region replication (if critical)
```

### Layer 2: SERVER 🖥️

```yaml
checks:
  hosting:
    - [ ] Serverless/Edge deployment
    - [ ] Auto-scaling configured
    - [ ] Cold start < 100ms
  api:
    - [ ] Edge Functions deployed
    - [ ] CORS properly configured
    - [ ] Webhook security (secret-based auth)
  performance:
    - [ ] Build time < 10s
    - [ ] Bundle size < 500KB (gzipped)
    - [ ] Code splitting enabled
```

### Layer 3: NETWORKING 🌐

```yaml
checks:
  dns:
    - [ ] Domain resolving correctly
    - [ ] CAA records configured
    - [ ] Email DNS: SPF, DKIM, DMARC
  ssl:
    - [ ] HTTPS enforced
    - [ ] Auto-renewal configured
    - [ ] Certificate chain valid
  headers:
    - [ ] HSTS enabled (max-age >= 1 year)
    - [ ] X-Frame-Options: DENY
    - [ ] X-Content-Type-Options: nosniff
```

### Layer 4: CLOUD INFRASTRUCTURE ☁️

```yaml
checks:
  providers:
    - [ ] Document all cloud services used
    - [ ] Identify vendor lock-in risks
    - [ ] Have failover plan for each provider
  resources:
    - [ ] Auto-scaling configured
    - [ ] Resource limits documented
    - [ ] Bottlenecks identified (e.g., email limits)
  cost:
    - [ ] Monthly cost estimated
    - [ ] Budget alerts configured
    - [ ] Cost optimization opportunities documented
```

### Layer 5: CI/CD 🔄

```yaml
checks:
  pipeline:
    - [ ] Automated on push to main
    - [ ] PR preview deployments
    - [ ] Rollback available
  testing:
    - [ ] Unit tests (> 80% coverage)
    - [ ] Integration tests
    - [ ] E2E tests (Playwright/Cypress)
    - [ ] Security scanning (npm audit/Snyk)
  deployment:
    - [ ] Build artifacts stored
    - [ ] Smoke tests post-deploy
    - [ ] Notifications (Slack/Discord)
```

### Layer 6: SECURITY 🔒

```yaml
checks:
  auth:
    - [ ] Authentication provider configured
    - [ ] MFA available (TOTP/SMS)
    - [ ] JWT token management
    - [ ] Session management
  secrets:
    - [ ] All keys in secure storage
    - [ ] No secrets in codebase
    - [ ] Rotation policy defined
  protection:
    - [ ] CSP header configured
    - [ ] Rate limiting enabled
    - [ ] XSS prevention (React auto-escape)
    - [ ] SQL injection prevention (parameterized queries)
    - [ ] CSRF protection
```

### Layer 7: MONITORING 📊 (CRITICAL!)

```yaml
checks:
  error_tracking:
    - [ ] Sentry/Rollbar/Bugsnag configured
    - [ ] Source maps uploaded
    - [ ] Error boundaries in frontend
  apm:
    - [ ] Performance monitoring enabled
    - [ ] API latency tracked
    - [ ] Database query monitoring
  logging:
    - [ ] Structured logging (JSON)
    - [ ] Log levels (debug/info/warn/error)
    - [ ] Centralized log aggregation
    - [ ] Retention >= 30 days
  alerting:
    - [ ] Error rate spike alerts
    - [ ] Performance degradation alerts
    - [ ] Uptime monitoring
```

### Layer 8: CONTAINERS 📦

```yaml
# For Serverless Architecture:
checks_serverless:
  - [ ] N/A - Serverless handles scaling
  - [ ] Edge Functions = no containers needed
  - [ ] Local dev: Supabase CLI provides containerized stack

# For Traditional Architecture:
checks_traditional:
  - [ ] Dockerfile for each service
  - [ ] docker-compose.yml for local dev
  - [ ] Container registry configured
  - [ ] Kubernetes/ECS orchestration
```

### Layer 9: CDN 🚀

```yaml
checks:
  caching:
    - [ ] Cache-Control headers configured
    - [ ] Immutable assets (content hashing)
    - [ ] Cache hit rate > 90%
  edge:
    - [ ] Global edge distribution
    - [ ] HTTP/2 enabled
    - [ ] Brotli/gzip compression
  monitoring:
    - [ ] TTFB tracking by region
    - [ ] Cache purge alerts
    - [ ] Geographic latency data
```

### Layer 10: BACKUP 💾 (CRITICAL!)

```yaml
checks:
  database:
    - [ ] Daily automated backups
    - [ ] Off-site backup copy
    - [ ] Backup verification (monthly restore test)
  code:
    - [ ] Git repository with full history
    - [ ] Branch protection on main
    - [ ] Secondary mirror (optional)
  dr_plan:
    - [ ] RTO/RPO defined
    - [ ] Recovery procedures documented
    - [ ] Quarterly DR drills
    - [ ] Team roles assigned
```
---

## 📊 SCORE CALCULATION

```
Total Score = Sum of all 10 layer scores

Verdict:
- 90-100: "Actual Full Stack" ⭐⭐⭐⭐⭐ (Enterprise Grade)
- 80-89:  "Full Stack++"        ⭐⭐⭐⭐   (Production Ready)
- 70-79:  "Full Stack+"         ⭐⭐⭐½   (Above Average)
- 60-69:  "Full Stack"          ⭐⭐⭐     (Basic)
- <60:    "Partial Stack"       ⭐⭐       (Gaps Exist)
```
---

## 🚨 CRITICAL GAPS TO ALWAYS FIX

Based on audit patterns, these gaps are **most common**:

1. **Monitoring (Layer 7)** - 90% of projects miss this
   - Fix: Add Sentry + Vercel Analytics

2. **Backup DR Plan (Layer 10)** - 80% undocumented
   - Fix: Create DR playbook with RTO/RPO

3. **Security Headers (Layer 6)** - CSP/HSTS often missing
   - Fix: Add to vercel.json/nginx config

4. **CDN Caching (Layer 9)** - Default only
   - Fix: Configure Cache-Control headers
---

## 🔧 AUDIT COMMAND TEMPLATE

```bash
# For CC CLI audit task:
/cook "ACTUAL FULL STACK AUDIT" for [PROJECT_NAME]

Create infrastructure audit covering 10 layers:
1. Database 🗄️ - Schema, migrations, RLS, backups
2. Server 🖥️ - Hosting, Edge Functions, performance
3. Networking 🌐 - DNS, SSL, email DNS
4. Cloud ☁️ - Providers, scaling, cost
5. CI/CD 🔄 - Pipelines, testing, deployment
6. Security 🔒 - Auth, secrets, headers
7. Monitoring 📊 - Error tracking, APM, logging
8. Containers 📦 - Docker (if applicable)
9. CDN 🚀 - Caching, edge, geographic
10. Backup 💾 - DR plan, recovery testing

OUTPUT: `plans/reports/actual-fullstack-audit-[DATE]-[PROJECT].md`
SCORE each layer /10, provide total X/100
```
---

## 📋 INJECTION TARGETS

This rule MUST be injected to:

- `~/.cleo/rules/actual-fullstack-audit.md` ✅
- `~/GEMINI.md`
- `~/.gemini/rules/actual-fullstack-audit.md`
- `.agent/skills/actual-fullstack/SKILL.md` (per project)
---

_Standard Version: 1.0.0_
_Created: 2026-02-02_
_Author: AgencyOS Antigravity Framework_
_Based on: Well Project Audit (Score 72/100)_
---

## Rule: agentic-search-vs-embeddings

# Agentic Search vs Embeddings - Strategic Selection Rule

> **Binh Pháp Principle**: 地形 (Terrain) - Chọn đúng công cụ cho từng địa hình dữ liệu.
---

## 🎯 QUYẾT ĐỊNH NHANH (Decision Matrix)

| Tình huống                             | Chọn           | Lý do                                     |
| -------------------------------------- | -------------- | ----------------------------------------- |
| IDE/Code assistant với LSP, grep, test | **Agentic**    | Có nhiều action hơn chỉ search text       |
| Enterprise on-prem, bảo mật cao        | **Agentic**    | Dữ liệu không rời boundary                |
| Cần debug/explain reasoning            | **Agentic**    | Dễ trace: grep X → file A → function B    |
| Docs 600+ pages, nhiều domain          | **Embeddings** | Lọc nhanh 5-20 đoạn quan trọng            |
| Contextual memory, personalization     | **Embeddings** | Truy lại "giống như lần trước" theo nghĩa |
| Đống text không có tool chuyên dụng    | **Embeddings** | Baseline mạnh khi không có grep/LSP       |
| **Phức tạp, cần cả hai**               | **Hybrid**     | Embeddings coarse → Agentic fine-grained  |
---

## 🔴 USE AGENTIC SEARCH KHI:

### 1. IDE/Dev Assistant Environment

```yaml
conditions:
  - Có môi trường code thực (chạy được grep, LSP, test, build)
  - Agent có nhiều action hơn chỉ "truy vấn text"
  - Mục tiêu: CHÍNH XÁC, AN TOÀN, CẬP NHẬT TỨC THÌ
advantages:
  - Không phụ thuộc index stale
  - Kết quả luôn current
  - Có thể verify bằng test/build
```

### 2. Bảo Mật / On-Prem / Enterprise

```yaml
conditions:
  - Không muốn index code vào vector DB chung
  - Multi-tenant managed service = NO
  - Dữ liệu PHẢI ở trong boundary rõ ràng
advantages:
  - Chạy hoàn toàn on-prem
  - Chỉ dùng tool local
  - Zero data leakage risk
```

### 3. Cần Debug & Explain Reasoning

```yaml
conditions:
  - Cần agent giải thích từng bước
  - Hạn chế "hộp đen" embeddings + ANN
  - Cần audit trail rõ ràng
output_format: |
  "Tôi grep X → mở file A → thấy function B → đọc thêm C..."
```
---

## 🟡 USE EMBEDDINGS KHI:

### 1. Global Knowledge / Docs Dài Phân Tán

```yaml
conditions:
  - Tài liệu 600+ pages
  - Nhiều repo, nhiều domain
  - User hỏi câu high-level
advantages:
  - Lọc nhanh 5-20 đoạn quan trọng đầu tiên
  - Scale tốt với dữ liệu lớn
```

### 2. Contextual Memory / Personalization

```yaml
conditions:
  - Ghi nhớ thói quen, history dài
  - Nhiều logs cần truy lại
  - Tìm tình huống "giống như lần trước" theo NGHĨA
advantages:
  - Semantic search > keyword search
  - Fuzzy matching tự nhiên
```

### 3. Ad-hoc Query Trên Dữ Liệu Không Có Tool

```yaml
conditions:
  - Không có grep/LSP/SQL
  - Chỉ có "đống text"
  - Không có tool chuyên dụng
note: Embeddings + RAG = baseline mạnh
```
---

## 🟢 HYBRID ARCHITECTURE (KHUYẾN NGHỊ)

```
┌─────────────────────────────────────────────────────────┐
│  User Query: "Fix authentication bug in user service"  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 1: EMBEDDINGS (Coarse Filter)                      │
│ - Quét toàn bộ codebase/docs                            │
│ - Trả về TOP 5-20 relevant files/chunks                 │
│ - Output: ["src/auth/", "docs/auth.md", "tests/auth/"]  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: AGENTIC SEARCH (Fine-Grained Exploration)       │
│ - Focus vào vùng dữ liệu đã filter                     │
│ - Sử dụng IDE tools: grep, LSP, AST, tests             │
│ - Execute: run tests, check git history, trace calls   │
│ - Output: Precise location + fix recommendations       │
└─────────────────────────────────────────────────────────┘
```

### Implementation Pattern:

```python
def hybrid_search(query: str, codebase: str):
    # Step 1: Embeddings để tìm vùng dữ liệu
    candidate_regions = embeddings_search(
        query=query,
        corpus=codebase,
        top_k=20
    )

    # Step 2: Agentic search trên vùng đã filter
    for region in candidate_regions:
        result = agentic_explore(
            region=region,
            tools=["grep", "lsp", "ast", "git_blame", "test_runner"],
            max_depth=5
        )
        if result.confidence > 0.9:
            return result

    return fallback_to_pure_embeddings(query)
```
---

## ⚠️ ANTI-PATTERNS (TRÁNH)

### ❌ SAI: Dùng Embeddings cho IDE khi có grep/LSP

```yaml
problem: Embeddings index có thể stale
solution: Agentic search với ripgrep + LSP = always current
```

### ❌ SAI: Dùng Agentic cho 600+ pages docs

```yaml
problem: Agent phải duyệt tuần tự = slow
solution: Embeddings để coarse filter trước
```

### ❌ SAI: "Hộp đen" không explain được

```yaml
problem: User hỏi "tại sao chọn đoạn này?"
solution: Agentic search có audit trail rõ ràng
```
---

## 📋 INJECTION TARGETS

Rule này PHẢI được inject vào:

- `GEMINI.md` (project-level)
- `.gemini/rules/` (project-level)
- `.cleo/rules/` (global)
- `.agent/skills/` (reusable pattern)
---

_Last Updated: 2026-02-02_
_Author: AgencyOS Antigravity Framework_
---

## Rule: binh-phap-cicd

# 🚨 GREEN PRODUCTION RULE — BẮT BUỘC TUYỆT ĐỐI

> **RULE #0: KHÔNG ĐƯỢC BÁO CÁO "DONE" KHI CHƯA VERIFY PRODUCTION GREEN!**
> Vi phạm rule này = toàn bộ task coi như THẤT BẠI.
---

## ❌ BANNED: "Push and Done" Pattern

```
# ❌ NGHIÊM CẤM - ĐÂY LÀ PATTERN BỊ CẤM:
git push origin main
# → "Done. Pushed successfully."  ← CẤM NÓI CÂU NÀY

# ❌ NGHIÊM CẤM - KHÔNG ĐƯỢC KẾT THÚC SAU PUSH:
# "Commit 1411bd7 pushed. Here's a summary..."  ← CẤM
```
---

## ✅ BẮT BUỘC: Full Verification Pipeline

**Sau mỗi `git push`, PHẢI chạy ĐỦ 3 bước verification SAU ĐÂY:**

### Bước 1: CI/CD Status (chờ tối đa 5 phút)

```bash
# Poll cho đến khi GitHub Actions Complete
MAX_ATTEMPTS=10
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))
  echo "=== Attempt $ATTEMPT/$MAX_ATTEMPTS ==="
  STATUS=$(gh run list -L 1 --json status,conclusion -q '.[0]' 2>/dev/null)
  echo "GitHub Actions: $STATUS"
  if echo "$STATUS" | grep -q '"conclusion":"success"'; then
    echo "✅ CI/CD GREEN!"
    break
  fi
  if echo "$STATUS" | grep -q '"conclusion":"failure"'; then
    echo "❌ CI/CD FAILED — PHẢI FIX NGAY!"
    break
  fi
  echo "⏳ Waiting 30s..."
  sleep 30
done
```

### Bước 2: Vercel Deploy Check

```bash
# Check Vercel deployment status
curl -sI "https://sophia-ai-factory.vercel.app" | head -3
# PHẢI thấy HTTP 200
```

### Bước 3: Production Smoke Test

```bash
# Verify production responds correctly
PROD_URL="https://sophia-ai-factory.vercel.app"
HTTP_STATUS=$(curl -sI "$PROD_URL" | head -1 | awk '{print $2}')
echo "Production HTTP: $HTTP_STATUS"
[ "$HTTP_STATUS" = "200" ] && echo "✅ PRODUCTION GREEN!" || echo "❌ PRODUCTION DOWN — FIX NOW!"
```
---

## ✅ BẮT BUỘC: Report Format (phải có ĐỦ)

```
## Verification Report
- Build: ✅ exit code 0
- Tests: ✅ [N] tests passed
- Git Push: ✅ [commit_hash] → main
- CI/CD: ✅ GitHub Actions [status] [conclusion]
- Deploy: ✅ Vercel [URL] [ready_state]
- Production: ✅ HTTP [status_code]
- Timestamp: [actual_time]
```

**Nếu THIẾU bất kỳ dòng nào = task CHƯA XONG.**
---

## 🚫 Direct Deploy BANNED

```bash
# ❌ FORBIDDEN - NEVER USE:
vercel --prod
vercel deploy
vercel --force

# ✅ ONLY WAY TO DEPLOY:
git push origin main
# → GitHub Actions triggers → Vercel auto-deploys
# → THEN verify using Bước 1-2-3 above
```
---

## Sophia AI Factory URLs

```
PROD_URL="https://sophia-ai-factory.vercel.app"
GITHUB_REPO="longtho638-jpg/sophia-ai-factory"
```
---

## Rule: binh-phap-core

# Binh Pháp Core Strategy

> **Công Thành Phá Trận** - Total Victory through systematic execution.

## Philosophy

Every project follows 孫子兵法 (Art of War) principles mapped to software delivery:

| Chapter | Principle            | Application                |
| ------- | -------------------- | -------------------------- |
| 始計    | Initial Calculations | Tech debt scan before work |
| 作戰    | Waging War           | Type safety as foundation  |
| 謀攻    | Attack by Stratagem  | Performance optimization   |
| 軍形    | Military Disposition | Security posture           |
| 兵勢    | Energy               | UX polish and momentum     |
| 虛實    | Weaknesses/Strengths | Documentation coverage     |

## Victory Verification (All Projects)

```bash
# MANDATORY checks before reporting success
npm run build        # 0 TS errors
npm test             # 100% pass
grep -r ": any" src  # 0 results
```

## Commit Convention

```
refactor: 10x bootstrap - [specific change]
feat: [component] - [description]
fix: [issue] - [resolution]
```

## Agent Hierarchy

1. **Chairman** - Strategic decisions, approval gates
2. **CC CLI** - Execution, parallel agents
3. **Sub-agents** - Specialized tasks (code, review, test)

## Core Mandates

1. **Build MUST pass** before any commit
2. **Tests MUST pass** before any push
3. **CI/CD MUST be GREEN** before reporting success
4. **No tech debt** left behind
---

## Rule: binh-phap-memory-practices

# Memory & Rules Best Practices

Official guidelines from Claude Code docs, enhanced with Binh Pháp patterns.
---

## Modular Rules Structure

```
~/.claude/rules/             # User-level (global)
├── binh-phap-core.md
├── binh-phap-quality.md
├── binh-phap-cicd.md
├── binh-phap-workflow.md
├── binh-phap-memory-practices.md
└── preferences.md           # Personal coding preferences

PROJECT/.claude/rules/       # Project-level
├── project-context.md
├── frontend/
│   ├── react.md
│   └── styles.md
├── backend/
│   ├── api.md
│   └── database.md
└── security.md
```
---

## Path-Specific Rules (YAML Frontmatter)

```yaml
---
paths:
  - "src/api/**/*.ts"
---
# API Development Rules
- All API endpoints must include input validation
- Use the standard error response format
- Include OpenAPI documentation comments
```

Glob pattern examples:

- `**/*.ts` - All TypeScript files
- `src/**/*` - Everything in src/
- `src/components/*.tsx` - Component files
- `src/**/*.{ts,tsx}` - TS and TSX in src/
---

## Memory Best Practices

1. **Be specific**: "Use 2-space indentation" is better than "Format code properly"
2. **Use structure**: Format as bullet points, group under headings
3. **Review periodically**: Update as project evolves
4. **Keep focused**: Each file = one topic
---

## Plan Mode Configuration

```json
// .claude/settings.json
{
  "permissions": {
    "defaultMode": "plan"
  }
}
```

Or command-line:

```bash
claude --permission-mode plan
```

When to use Plan Mode:

- Multi-step implementation (many files)
- Code exploration (research before changing)
- Interactive development (iterate with Claude)
---

## Subagents Configuration

Create custom subagents in `AGENTS.md`:

```yaml
# .claude/agents/security-reviewer.md
---
id: security-reviewer
description: Reviews code for security vulnerabilities
tools:
  - read
  - search
---
You are a security expert. Analyze code for:
  - XSS vulnerabilities
  - SQL injection
  - API key exposure
  - Auth token handling
```
---

## Git Worktrees for Parallel Sessions

```bash
# Create worktrees for parallel Claude sessions
git worktree add ../feature-auth -b feature-auth
git worktree add ../feature-payment -b feature-payment

# Each worktree = independent Claude session
cd ../feature-auth && claude
cd ../feature-payment && claude

# Manage worktrees
git worktree list
git worktree remove ../feature-auth
```

Key benefits:

- Independent file state per worktree
- Changes don't interfere between sessions
- Shared Git history and remotes
---

## Symlinks for Shared Rules

```bash
# Symlink shared rules directory
ln -s ~/shared-claude-rules .claude/rules/shared

# Symlink individual rule files
ln -s ~/company-standards/security.md .claude/rules/security.md
```
---

## Rule: binh-phap-quality

# Quality Battle Fronts

Six strategic fronts from 孫子兵法, each with verification commands.
---

## 🔴 Front 1: Tech Debt Elimination (始計 - Initial Calculations)

**Goal:** 0 tech debt items

```bash
# Verification
grep -r "console\." src --include="*.ts" --include="*.tsx" | wc -l  # = 0
grep -r "TODO\|FIXME" src | wc -l  # = 0
grep -r "@ts-ignore\|@ts-nocheck" src | wc -l  # = 0
```

**Actions:**

- Remove ALL `console.log/warn/error`
- Fix ALL `TODO/FIXME` comments
- Remove ALL `@ts-ignore` directives
---

## 🔴 Front 2: Type Safety 100% (作戰 - Waging War)

**Goal:** 0 `any` types

```bash
# Verification
grep -r ": any" src --include="*.ts" --include="*.tsx" | wc -l  # = 0
npx tsc --noEmit  # 0 errors
```

**Actions:**

- Replace ALL `any` types with proper types
- Add interfaces where missing
- Enable strict null checks
---

## 🟡 Front 3: Performance (謀攻 - Attack by Stratagem)

**Goal:** Build < 10s, LCP < 2.5s

```bash
# Verification
time npm run build  # < 10s
```

**Actions:**

- Code splitting with React.lazy
- Configure manualChunks in vite.config
- Image optimization to WebP
---

## 🟡 Front 4: Security (軍形 - Military Disposition)

**Goal:** 0 vulnerabilities

```bash
# Verification
npm audit --audit-level=high  # 0 high/critical
grep -r "API_KEY\|SECRET" src --include="*.ts" | wc -l  # = 0
```

**Actions:**

- Input validation with zod
- XSS prevention (DOMPurify)
- No secrets in client code
---

## 🟢 Front 5: UX Polish (兵勢 - Energy)

**Goal:** Seamless UX

**Actions:**

- Loading states on all async operations
- Error boundaries with fallback UI
- Empty states with illustrations
- Responsive design tested
---

## 🟢 Front 6: Documentation (虛實 - Weaknesses and Strengths)

**Goal:** Self-documenting codebase

**Actions:**

- README with deployment guide
- Inline code comments on complex logic
- Updated SOPs in docs/
- API documentation
---

## Rule: binh-phap-workflow

# BMAD-Inspired Workflow Phases

Workflow phases adapted from BMAD Method, mapped to existing .
---

## Quick Flow (Small Scope)

For bug fixes, small features, clear scope:

```
/scout → /plan → /code → /review
```

| Step         | Command            | Output                   |
| ------------ | ------------------ | ------------------------ |
| 1. Analyze   | ` codebase`  | Understanding            |
| 2. Plan      | ` feature X`  | `implementation_plan.md` |
| 3. Implement | `` or `` | Code changes             |
| 4. Validate  | ``          | Quality check            |
---

## Full Flow (Complex Projects)

For products, platforms, complex features:

### Phase 1: Analysis (Optional)

```
/brainstorm → brainstorming-report.md
/scout → codebase understanding
```

### Phase 2: Planning

```
/plan → PRD.md or implementation_plan.md
/design → architecture decisions
```

### Phase 3: Solutioning

```
/design system → architecture.md
Break into epics/stories
```

### Phase 4: Implementation

```
Per story: /cook → /code → /review → /test
Sprint tracking in task.md
```
---

## Context Management

Each phase produces context for the next:

```
PRD.md → tells architect constraints
architecture.md → tells dev patterns
story files → focused implementation context
project-context.md → universal rules
```

### Create Project Context

For brownfield projects, create `PROJECT/GEMINI.md`:

```markdown
# Project Context

## Tech Stack

- Framework: [React/Next.js/Vue]
- Language: [TypeScript]
- Database: [Supabase/PostgreSQL]

## Architecture Patterns

- [State management approach]
- [API layer structure]

## Code Standards

- [Naming conventions]
- [File structure]

## Active Sprint

- [Current focus]
```
---

## Command → Phase Mapping

| BMAD Workflow          | Our Command        | Phase          |
| ---------------------- | ------------------ | -------------- |
| ``          | ``      | Analysis       |
| ``          | ``            | Planning       |
| `` | ``          | Solutioning    |
| ``           | `` or `` | Implementation |
| ``         | ``          | Validation     |
| ``          | `` + `` | Quick Flow     |
---

## CC CLI Delegation

When delegating to CC CLI, ALWAYS include :

```bash
# ❌ SAI - ClaudeKit ignores:
"Scan all security issues and fix them"

# ✅ ĐÚNG - ClaudeKit executes:
"/review:codebase:parallel scan all security issues"
"/code fix all TypeScript errors"
"/plan create implementation for new feature"
```
---

## 🚀 Boris Cherny's 8 CC CLI Productivity Tips

> Verified by the Claude Code team for maximum reliability.

### 1. Parallel Worktrees/Sessions

```bash
# Create multiple worktrees for parallel Claude sessions
git worktree add ../feature-auth auth-branch
git worktree add ../feature-payment payment-branch
# Each worktree = independent Claude session
```

**Key insight:** This is the biggest productivity unlock - work on multiple tasks simultaneously.

### 2. Always Start with Plan Mode

- Begin every complex task in **plan mode**
- Invest in the plan → Claude delivers near one-shot implementation
- Consider using a second Claude as "staff engineer" to review plan
- When things go wrong → return to plan mode, not ad-hoc fixes

### 3. Living GEMINI.md

After every correction, update GEMINI.md:

```
"Update GEMINI.md với lesson learned này để không lặp lại lỗi"
```

Continuously refine over time.

### 4. Reusable Skills/Commands

Convert any task done >1x/day into a reusable command:

- Create `` command to scan/clean duplicated or messy code
- Commit all commands to git

### 5. Auto Bug Fixing

Let Claude self-fix most bugs:

```
"Hãy sửa các test CI đang fail"
"Fix bug từ thread Slack này" (via Slack MCP)
```

Show logs instead of micro-managing each step.

### 6. Challenge Prompts

Improve quality by challenging Claude:

- "Hỏi xoáy tôi về thay đổi này trước khi tạo PR"
- "Chứng minh mọi thứ hoạt động bằng cách so sánh main vs branch"
- After bad result: "Làm sao prompt tốt hơn?" → iterate

### 7. Terminal + Statusline

- Use good terminal (Ghostty recommended: sync render, 24-bit color, unicode)
- Custom `` showing context usage + current git branch
- Makes managing multiple sessions easier

### 8. Subagent Leverage

```
"use subagents" # Throw more compute at problem
```

- Split subtasks to subagent → keep main context clean
- Route high-risk decisions to stronger model (Opus 4.5) via hooks
---

## Rule: development-rules

# Development Rules

**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
**IMPORTANT:** You ALWAYS follow these principles: **YAGNI (You Aren't Gonna Need It) - KISS (Keep It Simple, Stupid) - DRY (Don't Repeat Yourself)**

## General
- **File Naming**: Use kebab-case for file names with a meaningful name that describes the purpose of the file, doesn't matter if the file name is long, just make sure when LLMs read the file names while using Grep or other tools, they can understand the purpose of the file right away without reading the file content.
- **File Size Management**: Keep individual code files under 200 lines for optimal context management
  - Split large files into smaller, focused components/modules
  - Use composition over inheritance for complex widgets
  - Extract utility functions into separate modules
  - Create dedicated service classes for business logic
- When looking for docs, activate `docs-seeker` skill (`context7` reference) for exploring latest docs.
- Use `gh` bash command to interact with Github features if needed
- Use `psql` bash command to query Postgres database for debugging if needed
- Use `ai-multimodal` skill for describing details of images, videos, documents, etc. if needed
- Use `ai-multimodal` skill and `imagemagick` skill for generating and editing images, videos, documents, etc. if needed
- Use `sequential-thinking` and `debug` skills for sequential thinking, analyzing code, debugging, etc. if needed
- **[IMPORTANT]** Follow the codebase structure and code standards in `.` during implementation.
- **[IMPORTANT]** Do not just simulate the implementation or mocking them, always implement the real code.

## Code Quality Guidelines
- Read and follow codebase structure and code standards in `.`
- Don't be too harsh on code linting, but **make sure there are no syntax errors and code are compilable**
- Prioritize functionality and readability over strict style enforcement and code formatting
- Use reasonable code quality standards that enhance developer productivity
- Use try catch error handling & cover security standards
- Use `code-reviewer` agent to review code after every implementation

## Pre-commit/Push Rules
- Run linting before commit
- Run tests before push (DO NOT ignore failed tests just to pass the build or github actions)
- Keep commits focused on the actual code changes
- **DO NOT** commit and push any confidential information (such as dotenv files, API keys, database credentials, etc.) to git repository!
- Create clean, professional commit messages without AI references. Use conventional commit format.

## Code Implementation
- Write clean, readable, and maintainable code
- Follow established architectural patterns
- Implement features according to specifications
- Handle edge cases and error scenarios
- **DO NOT** create new enhanced files, update to the existing files directly.
---

## Rule: documentation-management

# Project Documentation Management

### Roadmap & Changelog Maintenance
- **Project Roadmap** (`./docs/development-roadmap.md`): Living document tracking project phases, milestones, and progress
- **Project Changelog** (`./docs/project-changelog.md`): Detailed record of all significant changes, features, and fixes
- **System Architecture** (`./docs/system-architecture.md`): Detailed record of all significant changes, features, and fixes
- **Code Standards** (`./docs/code-standards.md`): Detailed record of all significant changes, features, and fixes

### Automatic Updates Required
- **After Feature Implementation**: Update roadmap progress status and changelog entries
- **After Major Milestones**: Review and adjust roadmap phases, update success metrics
- **After Bug Fixes**: Document fixes in changelog with severity and impact
- **After Security Updates**: Record security improvements and version updates
- **Weekly Reviews**: Update progress percentages and milestone statuses

### Documentation Triggers
The `project-manager` agent MUST update these documents when:
- A development phase status changes (e.g., from "In Progress" to "Complete")
- Major features are implemented or released
- Significant bugs are resolved or security patches applied
- Project timeline or scope adjustments are made
- External dependencies or breaking changes occur

### Update Protocol
1. **Before Updates**: Always read current roadmap and changelog status
2. **During Updates**: Maintain version consistency and proper formatting
3. **After Updates**: Verify links, dates, and cross-references are accurate
4. **Quality Check**: Ensure updates align with actual implementation progress

### Plans

### Plan Location
Save plans in `.` directory with timestamp and descriptive name.

**Format:** Use naming pattern from `## Naming` section injected by hooks.

**Example:** `plans/251101-1505-authentication-and-profile-implementation/`

#### File Organization

```
plans/
├── 20251101-1505-authentication-and-profile-implementation/
    ├── research/
    │   ├── researcher-XX-report.md
    │   └── ...
│   ├── reports/
│   │   ├── scout-report.md
│   │   ├── researcher-report.md
│   │   └── ...
│   ├── plan.md                                # Overview access point
│   ├── phase-01-setup-environment.md          # Setup environment
│   ├── phase-02-implement-database.md         # Database models
│   ├── phase-03-implement-api-endpoints.md    # API endpoints
│   ├── phase-04-implement-ui-components.md    # UI components
│   ├── phase-05-implement-authentication.md   # Auth & authorization
│   ├── phase-06-implement-profile.md          # Profile page
│   └── phase-07-write-tests.md                # Tests
└── ...
```

#### File Structure

##### Overview Plan (plan.md)
- Keep generic and under 80 lines
- List each phase with status/progress
- Link to detailed phase files
- Key dependencies

##### Phase Files (phase-XX-name.md)
Fully respect the `./docs/development-rules.md` file.
Each phase file should contain:

**Context Links**
- Links to related reports, files, documentation

**Overview**
- Priority
- Current status
- Brief description

**Key Insights**
- Important findings from research
- Critical considerations

**Requirements**
- Functional requirements
- Non-functional requirements

**Architecture**
- System design
- Component interactions
- Data flow

**Related Code Files**
- List of files to modify
- List of files to create
- List of files to delete

**Implementation Steps**
- Detailed, numbered steps
- Specific instructions

**Todo List**
- Checkbox list for tracking

**Success Criteria**
- Definition of done
- Validation methods

**Risk Assessment**
- Potential issues
- Mitigation strategies

**Security Considerations**
- Auth/authorization
- Data protection

**Next Steps**
- Dependencies
- Follow-up tasks
---

## Rule: orchestration-protocol

# Orchestration Protocol

## Delegation Context (MANDATORY)

When spawning subagents via subtask delegation, **ALWAYS** include in prompt:

1. **Work Context Path**: The git root of the PRIMARY files being worked on
2. **Reports Path**: `{work_context}/plans/reports/` for that project
3. **Plans Path**: `{work_context}` for that project

**Example:**
```
Task prompt: "Fix parser bug.
Work context: /path/to/project-b
Reports: /path/to/project-b/plans/reports/
Plans: /path/to/project-b/plans/"
```

**Rule:** If CWD differs from work context (editing files in different project), use the **work context paths**, not CWD paths.
---

#### Sequential Chaining
Chain subagents when tasks have dependencies or require outputs from previous steps:
- **Planning → Implementation → Simplification → Testing → Review**: Use for feature development (tests verify simplified code)
- **Research → Design → Code → Documentation**: Use for new system components
- Each agent completes fully before the next begins
- Pass context and outputs between agents in the chain

#### Parallel Execution
Spawn multiple subagents simultaneously for independent tasks:
- **Code + Tests + Docs**: When implementing separate, non-conflicting components
- **Multiple Feature Branches**: Different agents working on isolated features
- **Cross-platform Development**: iOS and Android specific implementations
- **Careful Coordination**: Ensure no file conflicts or shared resource contention
- **Merge Strategy**: Plan integration points before parallel execution begins
---

## Rule: payment-provider

# Payment Provider Rule

**ALL-IN POLAR.SH — NO PAYPAL**

- **Polar.sh** is the ONLY payment provider for all AgencyOS projects
- **PayPal** references must be removed entirely (components, SDK, dependencies)
- Any new payment integration MUST use Polar.sh Standard Webhooks
- Reference: https://docs.polar.sh

## Enforcement

When encountering PayPal code:

1. Remove all PayPal components (`PayPalSmartButton.tsx`, etc.)
2. Remove `@paypal/react-paypal-js` and related dependencies
3. Replace with Polar.sh equivalents
4. Update env vars: remove `PAYPAL_*`, ensure `POLAR_*` present
---

## Rule: primary-workflow

# Primary Workflow

**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
**IMPORTANT**: Ensure token efficiency while maintaining high quality.

#### 1. Code Implementation
- Before you start, delegate to `planner` agent to create a implementation plan with TODO tasks in `.` directory.
- When in planning phase, use multiple `researcher` agents in parallel to conduct research on different relevant technical topics and report back to `planner` agent to create implementation plan.
- Write clean, readable, and maintainable code
- Follow established architectural patterns
- Implement features according to specifications
- Handle edge cases and error scenarios
- **DO NOT** create new enhanced files, update to the existing files directly.
- **[IMPORTANT]** After creating or modifying code file, run compile command/script to check for any compile errors.

#### 2. Testing
- Delegate to `tester` agent to run tests on the **simplified code**
  - Write comprehensive unit tests
  - Ensure high code coverage
  - Test error scenarios
  - Validate performance requirements
- Tests verify the FINAL code that will be reviewed and merged
- **DO NOT** ignore failing tests just to pass the build.
- **IMPORTANT:** make sure you don't use fake data, mocks, cheats, tricks, temporary solutions, just to pass the build or github actions.
- **IMPORTANT:** Always fix failing tests follow the recommendations and delegate to `tester` agent to run tests again, only finish your session when all tests pass.

#### 3. Code Quality
- After testing passes, delegate to `code-reviewer` agent to review clean, tested code.
- Follow coding standards and conventions
- Write self-documenting code
- Add meaningful comments for complex logic
- Optimize for performance and maintainability

#### 4. Integration
- Always follow the plan given by `planner` agent
- Ensure seamless integration with existing code
- Follow API contracts precisely
- Maintain backward compatibility
- Document breaking changes
- Delegate to `docs-manager` agent to update docs in `.` directory if any.

#### 5. Debugging
- When a user report bugs or issues on the server or a CI/CD pipeline, delegate to `debugger` agent to run tests and analyze the summary report.
- Read the summary report from `debugger` agent and implement the fix.
- Delegate to `tester` agent to run tests and analyze the summary report.
- If the `tester` agent reports failed tests, fix them follow the recommendations and repeat from the **Step 3**.



## 📜 HIẾN PHÁP ROIaaS — DNA TỐI THƯỢNG (BẮT BUỘC MỌI PHIÊN)

> **R = ROI = RaaS = ROIaaS** — Mọi dòng code phải quy đổi thành ROI.
> Chi tiết: `docs/HIEN_PHAP_ROIAAS.md` | Chiến lược: `docs/BINH_PHAP_MASTER.md`

**DUAL-STREAM BẮT BUỘC:** Mọi dự án PHẢI có 2 dòng doanh thu:
1. **Engineering ROI (Dev Key):** `RAAS_LICENSE_KEY` gate premium CLI/agents/models
2. **Operational ROI (User UI):** Subscription trên Web UI cho business users

**HƯ-THỰC (Binh Pháp Ch.6):**
- HƯ (Open): Source code, base patterns → Public GitHub, viral marketing
- THỰC (Closed): AI Brain, prod keys, trained models → Gated, thu tiền

**QUÂN LỆNH:** Mission nào không phục vụ ít nhất 1 dòng ROI → **REJECT**.

