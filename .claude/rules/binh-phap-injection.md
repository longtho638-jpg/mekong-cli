---
description: 🏯 BINH-PHAP INJECTION - Auto-map Binh Pháp to ALL delegations
---

# Binh Pháp Auto-Injection Protocol

> **"Mọi giao việc PHẢI có Binh Pháp"** - ĐIỀU 40

## 🔴 MANDATORY RULE

When CC CLI receives ANY `/delegate`, `/cook`, `/build`, or task command:

1. **AUTO-DETECT** task type from prompt
2. **LOOKUP** matching Binh Pháp chapter
3. **INJECT** chapter reference into execution context

## Task Type → Chapter Mapping

```yaml
binh_phap_auto_inject:
    # Planning tasks
    - keywords: ["plan", "roadmap", "strategy", "design", "PRD"]
      chapter: 1
      name: "始計 Kế Hoạch"
      slug: "ke-hoach"

    # Resource/logistics tasks
    - keywords: ["budget", "cost", "allocate", "resource"]
      chapter: 2
      name: "作戰 Tác Chiến"
      slug: "tac-chien"

    # Automation/efficiency tasks
    - keywords: ["automate", "optimize", "shortcut", "script"]
      chapter: 3
      name: "謀攻 Mưu Công"
      slug: "muu-cong"

    # Architecture/structure tasks
    - keywords: ["architect", "schema", "database", "structure", "design"]
      chapter: 4
      name: "形勢 Hình Thế"
      slug: "hinh-the"

    # Growth/scaling tasks
    - keywords: ["scale", "grow", "expand", "momentum"]
      chapter: 5
      name: "勢 Thế Trận"
      slug: "the-tran"

    # Testing/security tasks
    - keywords: ["test", "verify", "audit", "security", "QA"]
      chapter: 6
      name: "虛實 Hư Thực"
      slug: "hu-thuc"

    # Speed/urgent tasks
    - keywords: ["hotfix", "urgent", "fast", "quick", "ASAP"]
      chapter: 7
      name: "軍爭 Quân Tranh"
      slug: "quan-tranh"

    # Refactor/adapt tasks
    - keywords: ["refactor", "adapt", "migrate", "flexible"]
      chapter: 8
      name: "九變 Cửu Biến"
      slug: "cuu-bien"

    # Build/execution tasks (DEFAULT)
    - keywords: ["build", "implement", "create", "add", "fix", "code"]
      chapter: 9
      name: "行軍 Hành Quân"
      slug: "hanh-quan"

    # Analysis/metrics tasks
    - keywords: ["analyze", "metrics", "performance", "report"]
      chapter: 10
      name: "地形 Địa Hình"
      slug: "dia-hinh"

    # Sequential/phased tasks
    - keywords: ["phase", "sequential", "step", "stage"]
      chapter: 11
      name: "九地 Cửu Địa"
      slug: "cuu-dia"

    # Launch/deploy tasks
    - keywords: ["launch", "deploy", "release", "ship", "production"]
      chapter: 12
      name: "火攻 Hỏa Công"
      slug: "hoa-cong"

    # Research/intelligence tasks
    - keywords: ["research", "investigate", "monitor", "intel"]
      chapter: 13
      name: "用間 Dụng Gián"
      slug: "dung-gian"
```

## Injection Template

Every delegated task MUST include:

```markdown
## Binh Pháp Alignment

**Chapter {{ chapter }}**: {{ chinese }} {{ vietnamese }}
**Slug**: /binh-phap:{{ slug }}
**Application**: {{ why_this_chapter_applies }}

**WIN-WIN-WIN Check**:

- 👑 Owner WIN: {{ owner_benefit }}
- 🏢 Agency WIN: {{ agency_benefit }}
- 🚀 Client WIN: {{ client_benefit }}
```

## Examples

### Task: "Fix PayPal types"

→ **Auto-detected**: "fix" keyword
→ **Chapter 9**: 行軍 Hành Quân (Execution)

### Task: "Deploy to production"

→ **Auto-detected**: "deploy" + "production"
→ **Chapter 12**: 火攻 Hỏa Công (Disruption Launch)

### Task: "Audit security module"

→ **Auto-detected**: "audit" + "security"
→ **Chapter 6**: 虛實 Hư Thực (Testing/Defense)

## Default Fallback

If no keyword matches: **Chapter 9 Hành Quân** (steady execution)

## Constitution Reference

See `.claude/memory/constitution.md` for complete ĐIỀU → Binh Pháp mapping.
