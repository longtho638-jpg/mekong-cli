---
description: Automated code review and quality assurance
---

# 👀 Code Review Workflow

> **Binh Pháp:** "Đa mưu thắng ít mưu" - More perspectives, better code

## ⚙️ Core Engine
- **Implementation**: `antigravity/core/code_guardian.py`
- **PR Manager**: `antigravity/core/ez_pr.py`
- **Static Analysis**: `antigravity/core/scout/`

## 🚀 Trigger Commands

- `mekong review` - Analyze current changes
- `mekong review --pr <id>` - Review specific PR
- `mekong audit` - Deep security audit

## 🔄 Workflow Steps

### 1. 📋 Change Analysis (CodeGuardian)
The `CodeGuardian` analyzes the diff and context.

```python
# antigravity/core/code_guardian.py
def analyze_changes(diff):
    # 1. Parse diff for changed files
    # 2. Identify language/framework context
    # 3. Run static analysis (Scout)
```

### 2. 🔍 Review Gates
Enforces quality standards before approval.

**Gates:**
- **Syntax**: TypeScript/Python parsing check
- **Security**: Secret scanning, injection pattern detection
- **Performance**: Complexity score (Cyclomatic), N+1 query detection
- **Style**: Linter compliance (ESLint/Ruff)

### 3. 💬 Feedback Generation
Generates actionable feedback using `CodeReviewer` agent logic.

```text
📝 CODE REVIEW REPORT
━━━━━━━━━━━━━━━━━━━━━
✅ 12 files reviewed
⚠️ 2 suggestions (Refactor for readability)
❌ 0 blockers
━━━━━━━━━━━━━━━━━━━━━
Verdict: APPROVE
```

### 4. 🔄 Action Execution (EzPR)
- **Approve**: Auto-approve on GitHub/GitLab
- **Request Changes**: Post comments on specific lines
- **Block**: Prevent merge if critical security issues found

## 🛠 Configuration

```json
{
  "review": {
    "auto_approve": false,
    "strict_mode": true,
    "ignore_patterns": ["*.lock", "dist/**"],
    "gates": {
      "coverage": 80,
      "complexity": 10
    }
  }
}
```

## 🔗 Related Components
- `antigravity/core/scout/` - Codebase exploration tool
- `cli/commands/review.py` - CLI entry point
- `.claude/skills/code-review/` - Skill definition
