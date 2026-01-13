---
title: AGENCYOS.md
description: "Primary configuration file for AgencyOS CLI"
section: docs
category: configuration
order: 2
published: true
ai_executable: true
---

# AGENCYOS.md

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/configuration/agencyos-md
```



The `AGENCYOS.md` file is the primary configuration file that provides guidance to AgencyOS CLI when working with your codebase. Understanding this file is crucial for effective use of AgencyOS.

## What is AGENCYOS.md?

`AGENCYOS.md` serves as the entry point for AgencyOS CLI's understanding of your project. It contains:

- Role and responsibilities definitions
- Links to detailed workflow documentation
- References to development rules
- Documentation management guidelines

## File Structure

A typical `AGENCYOS.md` file looks like this:

```markdown
# AGENCYOS.md

This file provides guidance to AgencyOS CLI when working with code in this repository.

## Role & Responsibilities

Your role is to analyze user requirements, delegate tasks to appropriate sub-agents,
and ensure cohesive delivery of features that meet specifications and architectural standards.

## Workflows

- Primary workflow: `./.agencyos/workflows/primary-workflow.md`
- Development rules: `./.agencyos/workflows/development-rules.md`
- Orchestration protocols: `./.agencyos/workflows/orchestration-protocol.md`
- Documentation management: `./.agencyos/workflows/documentation-management.md`

## Documentation Management

We keep all important docs in `./docs` folder and keep updating them.
```

## Why File System As Context?

AgencyOS follows Manus's approach to Context Engineering: **Use File System As Context**.

### Benefits

1. **Token Efficiency**: AGENCYOS.md contains just a few lines with links to detailed files
2. **On-Demand Loading**: Detailed instructions are loaded only when needed
3. **Better Organization**: Related documentation is grouped in logical directories
4. **Easier Maintenance**: Update specific files without touching AGENCYOS.md

### Example

Instead of putting all development rules in AGENCYOS.md:

```markdown
❌ Bad Approach (All in AGENCYOS.md)
# AGENCYOS.md
## Development Rules
1. Always write tests
2. Follow TypeScript strict mode
3. Use conventional commits
... (hundreds of lines)
```

AgencyOS uses references:

```markdown
✅ Good Approach (File System As Context)
# AGENCYOS.md
## Workflows
- Development rules: `./.agencyos/workflows/development-rules.md`
```

This keeps AGENCYOS.md lightweight while maintaining access to detailed guidelines.

## Important: Do Not Modify

**[Important]** You should not modify `AGENCYOS.md` directly, as it will be overwritten each time you update AgencyOS using `python main.py init`.

### Why?

- AgencyOS updates may include improvements to workflows and rules
- Manual changes will be lost during updates
- Consistency across AgencyOS projects

### What if I need to customize?

If you want to modify `AGENCYOS.md` without it being overwritten:

```bash
# Use the exclude flag during updates
python main.py init --exclude AGENCYOS.md
```

**Better approach**: Instead of modifying AGENCYOS.md, customize the referenced files in `.agencyos/workflows/` which are less likely to change during updates.

## Structure Overview

AGENCYOS.md links to several key directories:

### `.agencyos/workflows/`

Contains detailed workflow instructions:

- `development-rules.md` - Code quality standards, subagent orchestration, pre-commit procedures
- `documentation-management.md` - Documentation standards and practices
- `orchestration-protocol.md` - Agent orchestration methods
- `primary-workflow.md` - Development workflow from code to deployment

### `docs/`

Project-specific documentation:

```
docs/
├── project-overview-pdr.md
├── code-standards.md
├── codebase-summary.md
├── design-guidelines.md
├── deployment-guide.md
├── system-architecture.md
└── project-roadmap.md
```

These files help AgencyOS CLI:
- Avoid hallucinations
- Prevent creating redundant code
- Understand project-specific patterns
- Follow established conventions

## How AgencyOS CLI Uses AGENCYOS.md

### Initial Load

1. AgencyOS CLI reads `AGENCYOS.md` when started
2. Understands the project's role and structure
3. Knows where to find detailed instructions

### During Tasks

When performing specific tasks, AgencyOS CLI:

1. References linked workflow files
2. Reads relevant documentation from `docs/`
3. Follows established patterns and rules
4. Updates documentation as needed

### Example Flow

```
User: "Add user authentication"
  ↓
Claude reads AGENCYOS.md
  ↓
Loads development-rules.md
  ↓
Checks code-standards.md
  ↓
Reviews system-architecture.md
  ↓
Implements following patterns
  ↓
Updates documentation
```

## Best Practices

### Do's

✅ Keep AGENCYOS.md concise with links to detailed docs
✅ Update workflow files in `.agencyos/workflows/` as needed
✅ Maintain project docs in `docs/` directory
✅ Use `python main.py init --exclude AGENCYOS.md` if you must customize

### Don'ts

❌ Don't put all documentation in AGENCYOS.md
❌ Don't modify AGENCYOS.md without understanding update implications
❌ Don't ignore the linked workflow files
❌ Don't skip documentation management

## Token Consumption

Using File System As Context significantly reduces token usage:

**Without File System As Context:**
- Initial load: ~5000 tokens (everything in AGENCYOS.md)
- Every task: Same 5000 tokens loaded

**With File System As Context (AgencyOS approach):**
- Initial load: ~500 tokens (just AGENCYOS.md)
- Specific task: +1000 tokens (only relevant file)
- Total: 1500 tokens vs 5000 tokens (70% savings)

## Validation

Ensure your AGENCYOS.md is properly configured:

```bash
# Check if AGENCYOS.md exists
cat AGENCYOS.md

# Verify linked files exist
ls .agencyos/workflows/

# Check documentation structure
ls docs/
```

## Next Steps

Now that you understand AGENCYOS.md:

- [Workflows](/docs/docs/configuration/workflows) - Learn about workflow files
- [Agents](/docs/agents/) - Understand the agent system
- [Commands](/docs/commands/) - Explore available commands

---

**Key Takeaway**: AGENCYOS.md is a lightweight entry point that uses the file system as context, making AgencyOS efficient and maintainable.

---

## 🏯 Binh Pháp Alignment

> **法篇** (Pháp) - Organization - Project constitution

### Zero-Effort Commands

| Gõ lệnh | Auto-execute |
|---------|--------------|
| `/init` | Tự setup AgencyOS |
| `/setup-mcp` | Tự cấu hình MCP |

📖 [Xem tất cả Commands](/docs/commands)
