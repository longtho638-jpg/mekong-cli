# 🏯 BINH PHÁP: NOTEBOOKLM DEEP RESEARCH INTEGRATION

> **"知彼知己，百戰不殆"** - Know through deep research before decisions

---

## 🎯 PURPOSE

NotebookLM MCP provides **source-grounded answers** from uploaded documents.
This eliminates hallucinations and ensures decisions are based on REAL data.

---

## 📊 BINH PHÁP MAPPING

| Binh Pháp Principle                     | NotebookLM Application           |
| --------------------------------------- | -------------------------------- |
| **Chương 13: Dụng Gián** (Intelligence) | Query documents before decisions |
| **Chương 1: Kế Hoạch** (Planning)       | Research before task execution   |
| **Điều 10: Ngũ Sự** (5 Elements Check)  | Verify with evidence             |

---

## 🔧 C-LEVEL USAGE

### CTO Division:

```bash
# Research tech decisions
python scripts/run.py ask_question.py \
  --question "What are best practices for rate limiting in our docs?"
```

### CMO Division:

```bash
# Research marketing strategy
python scripts/run.py ask_question.py \
  --question "What competitor analysis do we have for pricing?"
```

### CFO Division:

```bash
# Research financial data
python scripts/run.py ask_question.py \
  --question "What are our revenue projections based on historical data?"
```

---

## 📋 MANDATORY RESEARCH WORKFLOW

**ĐIỀU 13: TRƯỚC KHI RA QUYẾT ĐỊNH → QUERY NOTEBOOKLM**

```
┌─────────────────────────────────────────┐
│        DECISION REQUIRED                │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Step 1: Query NotebookLM               │
│  python scripts/run.py ask_question.py  │
│  --question "Research on [topic]"       │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Step 2: Analyze Sources                │
│  - Check citations                      │
│  - Verify evidence                      │
│  - Identify gaps                        │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Step 3: Follow-up Questions            │
│  - Ask clarifying questions             │
│  - Deep dive on specifics               │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Step 4: Make Evidence-Based Decision   │
│  - WIN-WIN-WIN verified                 │
│  - Source-grounded                      │
└─────────────────────────────────────────┘
```

---

## 📚 NOTEBOOK LIBRARY FOR ORGANIZATION

### Recommended Notebooks:

| Notebook               | Owner | Topics                         |
| ---------------------- | ----- | ------------------------------ |
| **Tech Stack Docs**    | CTO   | architecture, apis, coding     |
| **Market Research**    | CMO   | competitors, pricing, trends   |
| **Financial Reports**  | CFO   | revenue, costs, projections    |
| **Binh Pháp Strategy** | CEO   | decisions, principles, history |
| **Product Specs**      | CTO   | PRD, features, roadmap         |

---

## 🚀 QUICK COMMANDS

```bash
# Check auth status
cd /Users/macbookprom1/mekong-cli/.agent/skills/notebooklm
python scripts/run.py auth_manager.py status

# List notebooks
python scripts/run.py notebook_manager.py list

# Add company notebook
python scripts/run.py notebook_manager.py add \
  --url "https://notebooklm.google.com/notebook/..." \
  --name "Company Knowledge Base" \
  --description "All company documentation and research" \
  --topics "company,research,docs"

# Query before decision
python scripts/run.py ask_question.py \
  --question "What does our research say about [topic]?"
```

---

## 🏯 BINH PHÁP EXECUTION RULE

**ĐIỀU 13 ADDENDUM: DEEP RESEARCH MANDATE**

> **"用間"** - Use intelligence before action

**CẤM:**

- ❌ Ra quyết định mà không query NotebookLM
- ❌ Bỏ qua source citations
- ❌ Guess thay vì research

**BẮT BUỘC:**

- ✅ Query documents trước major decisions
- ✅ Follow-up cho đến khi đủ information
- ✅ Synthesize evidence before recommending

---

**File Location:** `.claude/memory/notebooklm-binh-phap.md`
**Created:** 2026-01-26
**Integrated:** Constitution ĐIỀU 13 Addendum
