---
title: /skill:add
description: Add reference files or executable scripts to existing skills with progressive disclosure optimization
section: docs
category: commands/skill
order: 82
published: true
ai_executable: true
---

# /skill:add

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/commands/skill/add
```



Extend existing skills with new references or executable scripts. Uses progressive disclosure to optimize token usage while expanding skill capabilities.

## Syntax

```bash
/skill:add [skill-name] [reference-or-script-prompt]
```

## When to Use

- **Adding Documentation**: Include new docs, guides, or API references
- **Adding Scripts**: Create executable tools for the skill
- **Extending Capabilities**: Add new reference materials
- **Integration**: Connect external resources to skills

## Quick Example

```bash
/skill:add better-auth https://better-auth.dev/docs/api
```

**Output**:
```
Validating skill: better-auth
Found: $HOME/.agencyos/skills/better-auth/

Analyzing reference: https://better-auth.dev/docs/api
Type: URL (documentation)

Fetching content...
Extracted: 45 API endpoints, 12 configuration options

Creating reference: references/api-docs.md
Applying progressive disclosure structure...

✓ Reference added to better-auth skill
Token impact: +2,400 tokens (loaded on-demand)
```

## Arguments

- `[skill-name]`: Target skill name (must exist in `$HOME/.agencyos/skills/`)
- `[reference-or-script-prompt]`: URL, file path, or script description

## Reference Types

### URLs

Web documentation, blog posts, GitHub repos:

```bash
# Official docs
/skill:add nextjs https://nextjs.org/docs/app/api-reference

# GitHub repo
/skill:add my-skill https://github.com/org/library

# Blog post
/skill:add react-patterns https://example.com/react-best-practices
```

Processing:
- Fetches via WebFetch
- Extracts relevant content
- Summarizes key information
- Creates reference file

### Files

Local markdown, code samples:

```bash
# Local markdown
/skill:add my-skill /path/to/reference.md

# Code sample
/skill:add my-skill /path/to/example.ts
```

Processing:
- Reads file content
- Validates format
- Integrates into skill structure

### Scripts

Executable tools (bash, python, node):

```bash
# Script from description
/skill:add my-skill "script that validates API responses against OpenAPI spec"

# Script from template
/skill:add my-skill "bash script to run database migrations"
```

Processing:
- Creates executable script
- Adds to `scripts/` directory
- Sets appropriate permissions

## What It Does

### Step 1: Validate Skill

```
Checking skill existence...
Found: $HOME/.agencyos/skills/better-auth/
├── prompt.md
├── references/
└── scripts/
```

### Step 2: Analyze Reference Type

```
Input: https://better-auth.dev/docs/api
Detected: URL
Content type: API documentation
```

### Step 3: Process Reference

**For URLs**:
```
Fetching: https://better-auth.dev/docs/api
Status: 200 OK
Content: 15KB markdown

Extracting:
- API endpoints: 45
- Configuration: 12 options
- Examples: 8 code blocks
```

**For Files**:
```
Reading: /path/to/reference.md
Size: 8KB
Format: Markdown (valid)
```

**For Scripts**:
```
Creating script: validate-api-response.sh
Language: bash
Dependencies: jq, curl
```

### Step 4: Apply Progressive Disclosure

```
Structuring for token efficiency...

Core (always loaded):
- Skill name and description
- Key capabilities summary

References (on-demand):
- api-docs.md: Loaded when API questions asked
- examples.md: Loaded when examples needed

Scripts (executed when needed):
- validate-api.sh: Called for validation tasks
```

### Step 5: Test Activation

```
Testing skill activation...
Skill: better-auth
Status: ✓ Loads correctly
New references: ✓ Accessible
```

## Progressive Disclosure

Token-efficient loading strategy:

```
┌─────────────────────────────────────┐
│ prompt.md (Core)                    │ ← Always loaded (~500 tokens)
├─────────────────────────────────────┤
│ references/                         │
│ ├── api-docs.md                     │ ← On-demand (~2,400 tokens)
│ ├── examples.md                     │ ← On-demand (~1,200 tokens)
│ └── config-guide.md                 │ ← On-demand (~800 tokens)
├─────────────────────────────────────┤
│ scripts/                            │
│ ├── validate-api.sh                 │ ← Executed when needed
│ └── generate-types.py               │ ← Executed when needed
└─────────────────────────────────────┘
```

**Benefits**:
- Core always available
- References loaded only when relevant
- Scripts executed only when needed
- Significant token savings

## Complete Example

### Scenario: Adding API Reference to Authentication Skill

```bash
/skill:add better-auth https://better-auth.dev/docs/authentication
```

**Execution**:

```
Validating skill: better-auth
Found at: $HOME/.agencyos/skills/better-auth/

Current structure:
├── prompt.md (core instructions)
├── references/
│   └── getting-started.md
└── scripts/
    └── check-config.sh

Analyzing reference...
URL: https://better-auth.dev/docs/authentication
Type: Documentation
Topic: Authentication flows

Fetching content...
Downloaded: 12KB
Processing: Extracting key sections

Creating reference file...
Path: references/authentication-flows.md
Content:
- Email/password flow
- OAuth providers setup
- Session management
- Token handling
- MFA configuration

Applying progressive disclosure...
- Added to references index
- Configured on-demand loading
- Updated skill metadata

Testing activation...
✓ Skill loads correctly
✓ New reference accessible
✓ Progressive disclosure working

Summary:
- Reference added: authentication-flows.md
- Token impact: +1,800 (on-demand only)
- Total skill size: 4,500 tokens potential
- Typical load: 500 tokens (core only)
```

## Examples

### Adding URL Reference

```bash
/skill:add prisma https://www.prisma.io/docs/reference/api-reference
```

Adds Prisma API reference for database queries.

### Adding Local File

```bash
/skill:add my-framework ./docs/internal-patterns.md
```

Integrates internal documentation into skill.

### Adding Script

```bash
/skill:add docker "script to check container health and restart if unhealthy"
```

Creates executable health check script.

## Token Efficiency

Before `/skill:add` with progressive disclosure:
```
All content loaded upfront: ~8,000 tokens
```

After progressive disclosure:
```
Core only: ~500 tokens
With one reference: ~2,900 tokens
All content: ~8,000 tokens (rare)

Average usage: ~1,500 tokens (81% reduction)
```

## Related Commands

- [/skill:create](/docs/commands/skill/create) - Create new skills
- [/skill:optimize](/docs/commands/skill/optimize) - Optimize existing skills
- [/skill:fix-logs](/docs/commands/skill/fix-logs) - Fix skills from logs

---

**Key Takeaway**: `/skill:add` extends skills with new references or scripts while using progressive disclosure to maintain token efficiency.
