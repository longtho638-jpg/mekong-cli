# 📜 GEMINI BINH PHÁP - 13 CHAPTERS PROTOCOL

> **Trí tuệ 2000 năm - Organized for AI Reasoning**
> _Mekong-CLI Command & Control Protocol_

---

## 第一篇 始計 (Shi Ji) - STRATEGIC ASSESSMENT

> "Binh giả, quốc chi đại sự" - War is a matter of vital importance

### Strategic Bypass Rules

- **ĐỪNG AUTO-BYPASS!** - Mỗi task đều cần đánh giá riêng biệt
- KHÔNG dùng auto-bypass rule khi khởi động CC CLI
- Let CC CLI ask questions để chọn approach phù hợp
- Example: Architecture Fork detection → let CC CLI present options

### Mission Initiation Protocol

```
始計 Assessment:
1. What is the objective? (目標)
2. What resources available? (資源)
3. What are the risks? (風險)
4. Best approach? (方案)
```

---

## 第三篇 謀攻 (Mou Gong) - ATTACK BY STRATAGEM

> "Thượng binh phạt mưu" - Supreme excellence is breaking enemy's resistance without fighting

### Slash Command Mandate

**KHÔNG /COMMAND = KHÔNG GIAO VIỆC!**

| Command      | Purpose                      |
| ------------ | ---------------------------- |
| `/plan`      | Strategic planning, research |
| `/plan:hard` | Complex task với research    |
| `/cook`      | Implementation               |
| `/fix`       | Debug, root cause analysis   |
| `/review`    | Code review                  |
| `/watzup`    | Status check                 |
| `/git`       | Git operations               |
| `/insights`  | Workflow analysis            |

**NẾU QUÊN:**

```
ERROR: Task rejected. Use a ClaudeKit /command (e.g. /plan, /cook, /review)
```

---

## 第五篇 兵勢 (Bing Shi) - ENERGY & MOMENTUM

> "Thế như hoãn huyệt, tiết như phát cơ" - Like water rushing downhill

### Agent Teams - Parallel Execution Power

**Enabled:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `~/.claude/settings.json`

**Workflow:**

```
1. /plan:hard "task description"  → Create strategy
2. "Gọi team thực hiện plan này"   → Spawn agents
3. FE + BE + Debug + Review        → Parallel execution
4. Shared Task List sync           → Convergence
```

**Lưu ý:** Đốt token nhiều hơn nhưng nhanh hơn!

---

## 第六篇 虛實 (Xu Shi) - WEAK & STRONG POINTS

> "Tỵ thực nhi kích hư" - Avoid strength, strike weakness

### Open Core Strategy

```
PUBLIC (Thực - Strength):
├── Engine code
├── BMAD workflows (169)
├── Agent Teams config
└── CLAUDE.md / GEMINI.md

PRIVATE (Hư - Hidden):
├── plans/internal/
├── dna/pricing/
├── docs/revenue-strategy/
└── apps/dashboard-internal/
```

---

## 第七篇 軍爭 (Jun Zheng) - MANEUVERING

> "Binh quý thắng, bất quý cửu" - Speed is the essence

### Two-Call Mandate Protocol

**PHẢI TÁCH 2 BƯỚC:**

```
Bước 1: Gửi command (KHÔNG có \n ở cuối)
Bước 2: Gửi Enter riêng (\n)
```

### Workflow Chuẩn ClaudeKit

```
1. /plan:hard "task"  ← Strategic planning
2. /cook <plan_dir>   ← Execute plan
3. npm run build      ← Verify build
4. Browser verify     ← Visual confirmation
```

### KHÔNG ĐƯỢC

- ❌ Gửi task dài không dùng /plan:hard
- ❌ Gửi command + Enter cùng 1 lần
- ❌ Tin báo cáo mà không verify

---

## 第九篇 九變 (Jiu Bian) - ADAPTATION

> "Tướng thông cửu biến chi lợi" - General who knows adaptation controls

### Proxy Autonomy & Recovery

**ĐỪNG ĐỂ QUOTA LÀM GIÁN ĐOẠN MISSION!**

| Situation                      | Action                          |
| ------------------------------ | ------------------------------- |
| `RESOURCE_EXHAUSTED` (429/400) | `/proxy:reset`                  |
| CLI bị treo                    | `./scripts/proxy-recovery.sh`   |
| Sonnet hết Quota               | Auto fallback → Gemini Pro High |

### CC CLI Proxy Rule

- CC CLI dùng Antigravity Proxy, KHÔNG phải API hãng
- Khi context compact 0% → gửi Enter ngay để kick tiếp
- Luôn gửi input ngay khi CC CLI dừng ở trạng thái idle

---

## 第十一篇 九地 (Jiu Di) - NINE GROUNDS

> "Tứ địa tắc hợp" - On intersecting ground, join with allies

### BMAD Integration

**Location:** `_bmad/`

| Component | Count                                       |
| --------- | ------------------------------------------- |
| Workflows | 169                                         |
| Agents    | 9 (PM, Architect, Dev, QA, Analyst, SM, UX) |
| Teams     | 2                                           |

**Key Workflows:**

- `/product-brief` → Define scope
- `/create-prd` → Full requirements
- `/create-architecture` → System design
- `/dev-story` → Implement with QA

**Combo:** BMAD planning → Agent Teams parallel execution

---

## 第十二篇 火攻 (Huo Gong) - SPECIAL OPERATIONS

> "Phát hỏa hữu thời" - There is a proper time for fire attacks

### Verification Rule

**KHÔNG TIN BÁO CÁO - PHẢI XÁC THỰC!**

- Khi agent báo cáo "hoàn thành" → PHẢI tự verify
- Kiểm tra production site trực tiếp
- Đừng bao giờ chỉ tin output text
- Xác thực visual/functional bằng browser

### Insights Command

```bash
/insights  # Xem summary mọi thứ đã làm
```

- Phân tích patterns, improve workflow
- Ánh xạ với Antigravity artifacts để sync context

---

## 第十三篇 用間 (Yong Jian) - INTELLIGENCE

> "Minh quân hiền tướng chi sở dĩ động nhi thắng nhân" - The reason enlightened rulers prevail

### Knowledge Sync Protocol

1. **Antigravity Brain:** `/Users/macbookprom1/.gemini/antigravity/brain/`
2. **Knowledge Items:** `/Users/macbookprom1/.gemini/antigravity/knowledge/`
3. **Conversation Logs:** Persist across sessions
4. **Artifact Updates:** Real-time sync

---

_Genesis: 2026-02-06 | Binh Pháp Framework | 13 Chapters Protocol_
