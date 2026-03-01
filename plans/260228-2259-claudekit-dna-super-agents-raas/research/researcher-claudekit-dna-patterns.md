# ClaudeKit DNA Patterns — Kiến trúc Super Agent

**Ngày:** 2026-02-28 | **Task:** Phân tích ClaudeKit làm DNA cho Super Agent sản phẩm

---

## 1. Tổng quan kiến trúc DNA

ClaudeKit tại `/Users/macbookprom1/mekong-cli/.claude/` gồm 3 lớp:

```
LỚPS:
├── skills/   (271 skills)  — Kiến thức chuyên biệt + hành vi
├── commands/ (50+ commands) — Entry points thực thi workflow
└── agents/   (17+ agents)  — Nhân vật chuyên biệt (ở .claude/agents/)
```

**Quan trọng:** `.claude/skills/` = kho chính (271 skills). Agents và commands là consumers.

---

## 2. Cấu trúc SKILL.md — Atom của DNA

Mỗi skill = 1 file SKILL.md với pattern nhất quán:

```yaml
# YAML Frontmatter (metadata)
---
name: autonomous-agents
description: "Mô tả ngắn, searchable, kích hoạt khi detect từ khóa"
source: vibeship-spawner-skills (Apache 2.0)
version: 2.1.1  # nếu có
---
```

**Body structure (Markdown):**
```
# [Tên Skill]
## Role Statement   — "You are X who knows Y"
## Capabilities     — Danh sách khả năng (dùng để auto-route)
## Patterns         — Code patterns + tên pattern
## Anti-Patterns    — ❌ Những gì KHÔNG làm
## Sharp Edges      — Bảng: Issue | Severity | Solution
## Related Skills   — Graph liên kết skill
```

**Ví dụ thực tế:**
- `autonomous-agents/SKILL.md` — ReAct loop, Plan-Execute, Reflection
- `ai-agents-architect/SKILL.md` — Tool Registry, multi-agent orchestration
- `agent-tool-builder/SKILL.md` — JSON Schema design, MCP tools
- `agent-memory-systems/SKILL.md` — Short/Long/Working memory, chunking
- `mcp-builder/SKILL.md` — 4-phase workflow tạo MCP server

---

## 3. Cấu trúc COMMAND — Entry Point

Command `/cook` (`skills/cook/SKILL.md`) = ví dụ điển hình:

```
Intent Detection → Research? → [Review Gate] → Plan → [Review Gate]
                → Implement → [Review Gate] → Test? → Finalize
```

**Pattern đặc trưng:**
- Flag-based mode switching: `--fast`, `--auto`, `--parallel`, `--no-test`
- Smart intent detection từ natural language input
- Review gates cho human-in-the-loop hoặc auto-approve
- TaskCreate/TaskUpdate integration cho task tracking

**Modes:**
| Mode | Research | Test | Review |
|------|---------|------|--------|
| interactive | ✓ | ✓ | Human |
| auto | ✓ | ✓ | Auto (score≥9.5) |
| fast | ✗ | ✓ | Human |
| parallel | Opt | ✓ | Human |

---

## 4. Cách Skills Compose thành Super Agent

### 4.1 Graph liên kết tự nhiên (Related Skills)

```
autonomous-agents ←→ agent-tool-builder ←→ mcp-builder
        ↕                    ↕                  ↕
agent-memory-systems ←→ ai-agents-architect ←→ rag-engineer
        ↕                    ↕
multi-agent-orchestration ←→ llm-architect
```

**Pattern:** Skills tự khai báo `Related Skills` → Auto-compose khi cần.

### 4.2 DNA Composition Formula

```
Super Agent = Role(SKILL) + Capabilities[array] + Patterns[library] + AntiPatterns[guardrails]
            + SharpEdges[risk_table] + RelatedSkills[graph]
```

### 4.3 Activation Protocol

Skills kích hoạt qua:
1. **Keyword detection** trong description (searchable prompt)
2. **Explicit call** `/skill-name`
3. **Auto-compose** khi task scope match multiple skills

---

## 5. Super Agent Products — Patterns để Productize

### Pattern A: Vertical Domain Expert (Single-Skill-Deep)

```
Skill: agent-tool-builder → Product: "MCP Tool Factory Agent"
- Input: API docs / OpenAPI spec
- Output: Production MCP server
- Price: $49/tool generated
```

### Pattern B: Horizontal Orchestrator (Multi-Skill-Compose)

```
Skills: autonomous-agents + agent-memory + agent-tool-builder
→ Product: "Autonomous Business Agent"
- Input: Business goal
- Output: Deployed agent stack
- Price: $299/agent
```

### Pattern C: Workflow-as-Agent (Command-Wrapped)

```
Command: /cook → Product: "Feature Factory SaaS"
- Input: Feature description
- Output: Tested, deployed code
- Wraps: Research→Plan→Code→Test pipeline
- Price: $0.10/feature token
```

### Pattern D: DNA-as-Service (RaaS Model)

```
ClaudeKit DNA (271 skills) → Skill Marketplace
- Developers buy individual skill packs
- Compose custom agents from skill atoms
- Revenue: $9.99/skill-pack, $99/domain-bundle
```

### 5 Super Agent Products Khả Thi Nhất

| # | Tên | Skills Cần | Giá Trị | Revenue Model |
|---|-----|-----------|---------|---------------|
| 1 | MCP Builder Pro | mcp-builder + agent-tool-builder | Build MCP trong 10 phút | $49/project |
| 2 | AutoAgent Factory | autonomous-agents + ai-agents-architect + memory | Deploy agent stack | $299/agent |
| 3 | RAG Pipeline Agent | rag-engineer + agent-memory-systems | Prod RAG in 1h | $99/pipeline |
| 4 | Research Swarm | research + multi-agent-orchestration | Parallel research | $0.05/query |
| 5 | Skill Marketplace | 271 skills as API | ClaudeKit-as-Service | $29/mo |

---

## 6. Insight Quan Trọng

**DNA Insight #1 — Skills là Atoms, Không Phải Monoliths:**
Mỗi skill nhỏ (<80 lines), focused, composable. Không có "God skill". Đây là lý do 271 skills hoạt động tốt hơn 10 mega-prompts.

**DNA Insight #2 — Anti-Patterns = Guardrails:**
Section `❌ Anti-Patterns` và `Sharp Edges` là *sản phẩm bán được* — người mua agent muốn agent KHÔNG làm những điều ngu ngốc hơn là agent làm được nhiều thứ.

**DNA Insight #3 — Related Skills Graph:**
Graph liên kết skill = *knowledge graph* có thể query. Đây là nền tảng cho Skill Marketplace.

**DNA Insight #4 — Cook Command = Product Template:**
`/cook` pattern (Intent→Research→Plan→Code→Test→Review) là SaaS product template hoàn chỉnh. Bọc vào API = RaaS.

---

## Unresolved Questions

1. `.claude/agents/` không tồn tại tại `/Users/macbookprom1/mekong-cli/.claude/agents/` — agents đang được stored ở đâu trong monorepo? (`.claude/claudekit-engineer/.claude/skills/` thấy trong git status nhưng đã bị xóa)
2. Commands directory trống (`ls .claude/commands/` = 0 files) — commands có phải đang inject từ `~/.claude/commands/` global không?
3. Vibeship-spawner-skills (source của nhiều skills) — license model cho re-packaging có cho phép commercial resale không?
4. 271 skills hiện tại: bao nhiêu % có references/ và scripts/ (complex skills) vs chỉ SKILL.md (simple)?
