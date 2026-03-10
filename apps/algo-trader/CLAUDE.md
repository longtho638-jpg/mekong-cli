# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role & Responsibilities

Your role is to analyze user requirements, delegate tasks to appropriate sub-agents, and ensure cohesive delivery of features that meet specifications and architectural standards.

## Workflows

- Primary workflow: `./.claude/workflows/primary-workflow.md`
- Development rules: `./.claude/workflows/development-rules.md`
- Orchestration protocols: `./.claude/workflows/orchestration-protocol.md`
- Documentation management: `./.claude/workflows/documentation-management.md`
- And other workflows: `./.claude/workflows/*`

**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
**IMPORTANT:** You must follow strictly the development rules in `./.claude/workflows/development-rules.md` file.
**IMPORTANT:** Before you plan or proceed any implementation, always read the `./README.md` file first to get context.
**IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports.
**IMPORTANT:** In reports, list any unresolved questions at the end, if any.
**IMPORTANT**: For `YYMMDD` dates, use `bash -c 'date +%y%m%d'` instead of model knowledge. Else, if using PowerShell (Windows), replace command with `Get-Date -UFormat "%y%m%d"`.

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

**IMPORTANT:** *MUST READ* and *MUST COMPLY* all *INSTRUCTIONS* in project `./CLAUDE.md`, especially *WORKFLOWS* section is *CRITICALLY IMPORTANT*, this rule is *MANDATORY. NON-NEGOTIABLE. NO EXCEPTIONS. MUST REMEMBER AT ALL TIMES!!!*

---

## 🚀 AGENT TEAMS + BMAD (Feb 2026)

**Enabled:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

**Workflow:** `/plan:hard` → `"Gọi team thực hiện plan này"`

**BMAD:** 169 workflows + 9 agents in `_bmad/`

---

## Binh Pháp Agent Rules (Feb 2026)

| Chapter | Rule |
|---------|------|
| 始計 | Strategic assessment đầu tiên |
| 謀攻 | PHẢI dùng /command để giao việc |
| 兵勢 | Agent Teams parallel execution |
| 九變 | BMAD 169 workflows |
| 火攻 | Verify trước khi báo cáo |

**Combo:** BMAD planning → Agent Teams → Verify


## 🔴 CẤM CI/CD POLLING LOOP (Added 2026-03-04)

**TUYỆT ĐỐI CẤM chạy while loop poll CI/CD status!**

Lý do: Vòng lặp `while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; gh run list...sleep 30; done` tốn ~12,500 tokens → context cháy 0% → crash.

**LUẬT:**
1. **CẤM** `while` loop poll `gh run list` hoặc bất kỳ CI/CD status check nào
2. **CHỈ ĐƯỢC** check CI/CD status **MỘT LẦN** duy nhất: `gh run list -L1 --json status,conclusion`
3. **SAU KHI** `git push`, báo cáo kết quả push và **DỪNG** — không poll
4. **CẤM** `sleep` trong bất kỳ loop nào — mỗi giây sleep = tokens lãng phí

```bash
# ❌ CẤM (burns 12K+ tokens):
MAX_ATTEMPTS=25; while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  STATUS=$(gh run list -L 1 --json status,conclusion); sleep 30
done

# ✅ ĐÚNG (chỉ 1 lần):
gh run list -L 1 --json status,conclusion -q ".[0]"
# Báo cáo kết quả và tiếp tục task khác
```



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

