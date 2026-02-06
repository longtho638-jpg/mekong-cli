# 📜 MEKONG-CLI BINH PHÁP RULES

> **RaaS Agency Operating System** - Powered by ClaudeKit DNA + Binh Pháp Framework

---

## 第一篇 始計 (Shi Ji) - PROJECT FOUNDATION

> "Binh giả, quốc chi đại sự" - Architecture is a matter of vital importance

### Language & Framework

| Component      | Technology             |
| -------------- | ---------------------- |
| **Language**   | Python 3.11+           |
| **CLI**        | Typer (Commands)       |
| **UI**         | Rich (Terminal UI)     |
| **Validation** | Pydantic (Type Safety) |

### Architecture Pattern

```
src/
├── core/           # 心 Heart - Orchestrator logic
├── commands/       # 手 Hands - CLI commands
└── agents/         # 技 Skills - RaaS modules
```

- **Modular Agents:** Mỗi agent là 1 folder riêng trong `/agents`
- **DNA:** Luôn tuân thủ logic **Plan-Execute-Verify** của ClaudeKit

---

## 第三篇 謀攻 (Mou Gong) - CODE STANDARDS

> "Thượng binh phạt mưu" - Excellence through planning first

### Quality Requirements

- ✅ Type hinting required cho tất cả functions
- ✅ Docstring cho mọi class và public method
- ✅ Test cho mọi module trong `/tests`

### Execution Flow (Plan-Execute-Verify)

```
1. PLAN    → Đọc Recipe (.md) → Parse thành Task List
2. EXECUTE → Chạy từng Task qua OpenClaw/Claude
3. VERIFY  → Validate output, retry nếu fail
```

---

## 第六篇 虛實 (Xu Shi) - OPEN CORE STRATEGY

> "Tỵ thực nhi kích hư" - Public strengths, hide weaknesses

### What's Open vs Private

```
PUBLIC (Open Source):
├── src/core/           # Engine code
├── _bmad/              # 169 workflows
├── CLAUDE.md           # Agent rules
└── packages/vibe-*/    # SDK packages

PRIVATE (.gitignore):
├── plans/internal/
├── dna/pricing/
└── apps/dashboard-internal/
```

---

## 第七篇 軍爭 (Jun Zheng) - MANEUVERING

> "Binh quý thắng, bất quý cửu" - Speed is the essence

### Two-Call Mandate (CC CLI)

```
Bước 1: Gửi command (KHÔNG có \n ở cuối)
Bước 2: Gửi Enter riêng (\n)
```

### Workflow Chuẩn

```
1. /plan:hard "task"  ← Strategy
2. /cook <plan>       ← Execute
3. npm run build      ← Verify
4. Browser check      ← Visual confirm
```

---

## 第五篇 兵勢 (Bing Shi) - AGENT TEAMS

> "Thế như hoãn huyệt" - Parallel power execution

### Configuration

```bash
# Setting: ~/.claude/settings.json
"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
```

### Team Workflow

```
1. Create plan: /plan:hard "task"
2. Execute: "Gọi team thực hiện plan này"
3. CC CLI auto-spawns: FE + BE + Debug + Review
4. Agents sync via Shared Task List
```

---

## 第九篇 九變 (Jiu Bian) - BMAD INTEGRATION

> "Tướng thông cửu biến" - Adapt with 169 workflows

### BMAD Location: `_bmad/`

| Component | Count                                       |
| --------- | ------------------------------------------- |
| Workflows | 169                                         |
| Agents    | 9 (PM, Architect, Dev, QA, Analyst, SM, UX) |
| Teams     | 2                                           |

### Key Workflows

| Command                | Purpose           |
| ---------------------- | ----------------- |
| `/product-brief`       | Define scope      |
| `/create-prd`          | Full requirements |
| `/create-architecture` | System design     |
| `/dev-story`           | Implement with QA |

**Combo:** BMAD planning → Agent Teams parallel execution

---

## 第十一篇 九地 (Jiu Di) - CC CLI OPERATIONS

> "Tứ địa tắc hợp" - On intersecting ground, join with allies

### CC CLI Proxy Rule

- CC CLI dùng Antigravity Proxy, KHÔNG phải API hãng
- Khi context compact 0% → gửi Enter ngay để kick tiếp
- `RESOURCE_EXHAUSTED` (429/400) → `/proxy:reset`
- CLI bị treo → `./scripts/proxy-recovery.sh`

### Verification Rule

**KHÔNG TIN BÁO CÁO - PHẢI XÁC THỰC!**

- Khi agent báo cáo "hoàn thành" → verify bằng browser/tools
- Kiểm tra production site trực tiếp
- Xác thực visual/functional trước khi ship

---

## 第十二篇 火攻 (Huo Gong) - COMMIT CONVENTION

> "Phát hỏa hữu thời" - Execute at the right time

### Git Standards

```
feat: [module] - Add new feature
fix: [module] - Fix bug
refactor: [module] - Code improvement
docs: Update documentation
```

---

## 第十三篇 用間 (Yong Jian) - INTELLIGENCE SYNC

> "Minh quân hiền tướng" - Knowledge prevails

### Knowledge Sources

| Source    | Path                               |
| --------- | ---------------------------------- |
| Brain     | `~/.gemini/antigravity/brain/`     |
| Knowledge | `~/.gemini/antigravity/knowledge/` |
| BMAD      | `_bmad/bmm/workflows/`             |
| Skills    | `.claude/skills/`                  |

---

_Genesis: 2026-02-06 | ClaudeKit DNA v2.9.1+ | Agent Teams + BMAD + Binh Pháp_
