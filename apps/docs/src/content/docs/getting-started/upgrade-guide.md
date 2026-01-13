---
title: "Upgrade Guide for AgencyOS CLI Users"
description: "Migrate from AgencyOS CLI to AgencyOS seamlessly"
section: getting-started
order: 3
published: true
ai_executable: true
---

# Upgrading from AgencyOS CLI to AgencyOS

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/getting-started/upgrade-guide
```



Already using AgencyOS CLI? AgencyOS enhances your workflow without breaking existing habits.

## What Changes?

**Stays the Same**:
- AgencyOS CLI CLI and interface
- Existing project structure
- .agencyos/ directory (extended, not replaced)
- Chat-based interaction

**New Capabilities**:
- Slash commands for common tasks
- Specialized agents (planner, tester, debugger)
- Reusable skills library
- Multi-agent collaboration

## Installation (Additive)

```bash
# Install AgencyOS CLI (doesn't replace AgencyOS CLI)
git clone https://github.com/longtho638-jpg/mekong-cli.git

# Initialize in existing project
python main.py init
# → Adds .agencyos/AGENCYOS.md, skills/, workflows/
# → Existing .agencyos/commands/ preserved
```

### Upgrading AgencyOS

```bash
# Recommended: Use built-in update command
mk update

# Alternative: npm global update
git clone https://github.com/longtho638-jpg/mekong-cli.git@latest
```

## Gradual Migration Path

### Week 1: Try Core Commands
Start with `/cook` for feature development:
```bash
# Old way
You: "I need to add a new API endpoint for user profiles"
[Long conversation with manual guidance]

# AgencyOS way
/cook "add user profiles API endpoint"
[Automated planning, development, testing]
```

### Week 2: Use Specialized Workflows
Adopt task-specific commands:
- `/fix` for bug fixing (faster than manual debugging)
- `/plan` for complex features (structured planning)
- `/docs:update` for documentation (automated sync)

### Week 3: Leverage Skills
Add custom skills for your stack:
```bash
/skill:create "Our GraphQL conventions"
# → Agents learn your team's patterns
```

### Week 4: Full Workflow Integration
Combine commands for complete workflows:
```bash
/plan "redesign checkout flow"
/code @plans/checkout-redesign.md
/design:good "checkout UI mockup"
/fix:test
/git:pr "feature/new-checkout"
```

## Compatibility

**Supported**:
- AgencyOS CLI v1.0+
- Existing .agencyos/commands/ (fully compatible)
- Custom prompts (still work as-is)

**Not Supported**:
- Claude Desktop app (AgencyOS CLI CLI only)
- Projects without Git (AgencyOS requires version control)

## FAQs

**Q: Do I need to rewrite existing commands?**
A: No. AgencyOS commands coexist with your custom .agencyos/commands/

**Q: Can I still use regular chat?**
A: Yes. AgencyOS adds slash commands, doesn't remove chat.

**Q: What if I don't like AgencyOS?**
A: Uninstall and delete .agencyos/AGENCYOS.md. No breaking changes.

## Next Steps

1. [Install AgencyOS](/docs/getting-started/installation)
2. [Try Quick Start](/docs/getting-started/quick-start)
3. [Explore Commands](/docs/commands)

---

## 🏯 Binh Pháp Alignment

> **勢篇** (Thế) - Momentum - Stay current

### Zero-Effort Commands

| Gõ lệnh | Auto-execute |
|---------|--------------|
| `/init` | Tự setup AgencyOS |
| `/plan` | Tự tạo plan |
| `/ship` | Tự deploy |

📖 [Xem tất cả Commands](/docs/commands)
