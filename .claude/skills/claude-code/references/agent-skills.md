# Agent Skills

Create, manage, and share Skills to extend Claude's capabilities in Claude Code.

## What Are Agent Skills?

Agent Skills are modular capabilities that extend Claude's functionality. Each Skill packages:
- Instructions and procedural knowledge
- Metadata (name, description)
- Optional resources (scripts, templates, references)

Skills are automatically discovered and used by Claude when relevant to the task using progressive disclosure principle.

## Skill Structure

### Basic Structure
```
.claude/skills/
└── my-skill/
    └── SKILL.md       # Uppercase filename, Metadata, instructions (required)
```

### With Resources
```
.claude/skills/
└── my-skill/
    ├── SKILL.md       # Uppercase filename, Metadata, instructions (required)
    ├── scripts/       # Executable code
    ├── references/    # Documentation
    └── assets/        # Templates, images
```

## Creating Skills

### SKILL.md
Metadata and configuration:

**Metadata's fields:**
- `name`: Unique identifier (kebab-case)
- `description`: When Claude should activate this skill
- `version`: Semantic version
- `author`: Creator name or org

Main instructions for Claude:

```markdown
---
name: my-skill
description: Brief description of when to use this skill
version: 1.0.0
---

# Skill Name

Description of what this skill does.

## When to Use This Skill

Specific scenarios when Claude should activate this skill.

## Instructions

Step-by-step instructions for Claude to follow.

## Examples

Concrete examples of skill usage.
```

## Best Practices

### Clear Activation Criteria
Define exactly when the skill should be used:

**Good:**
```
Use when creating React components with TypeScript and Tailwind CSS.
```

**Bad:**
```
Use for frontend development.
```

### Concise Instructions
Focus on essential information, avoid duplication:

**Good:**
```
1. Create component file in src/components/
2. Use TypeScript interfaces for props
3. Apply Tailwind classes for styling
```

**Bad:**
```
First you need to think about creating a component,
then maybe you should consider...
```

### Actionable Guidance
Provide clear steps Claude can follow:

**Good:**
```
Run `npm test` to validate implementation.
```

**Bad:**
```
You might want to test things.
```

### Include Examples
Show concrete input/output examples:

```markdown
## Examples

Input: "Create button component"
Output: Creates src/components/Button.tsx with props interface
```

### Scope Limitation
Keep skills focused on specific domains:

**Good:**
- `api-testing` - Testing REST APIs
- `db-migrations` - Database schema changes

**Bad:**
- `general-development` - Everything

## Resource Types

### Scripts (`scripts/`)
Executable code for deterministic tasks:

```
scripts/
├── format-code.py
├── generate-types.js
└── run-tests.sh
```

**When to use:**
- Repeated code generation
- Deterministic transformations
- External tool integrations

### References (`references/`)
Documentation loaded into context as needed:

```
references/
├── api-docs.md
├── schemas.md
└── workflows.md
```

**When to use:**
- API documentation
- Database schemas
- Domain knowledge
- Detailed workflows

### Assets (`assets/`)
Files used in output:

```
assets/
├── templates/
│   └── component-template.tsx
├── icons/
└── configs/
```

**When to use:**
- Templates
- Boilerplate code
- Images, icons
- Configuration files

## Using Skills via API

**Required beta headers:**
- `code-execution-2025-08-25` (enables code execution)
- `skills-2025-10-02` (enables Skills API)
- `files-api-2025-04-14` (file upload/download)

### Python Example
```python
response = client.beta.messages.create(
    model="claude-sonnet-4-5-20250929",
    betas=["code-execution-2025-08-25", "skills-2025-10-02"],
    container={
        "skills": [
            {"type": "anthropic", "skill_id": "pptx", "version": "latest"},
            {"type": "custom", "skill_id": "skill_01AbCd...", "version": "latest"}
        ]
    },
    messages=[{"role": "user", "content": "..."}],
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}]
)
```

### Skill Types

| Type | Config | Description |
|------|--------|-------------|
| Anthropic | `type: "anthropic"` | Pre-built: pptx, xlsx, docx, pdf |
| Custom | `type: "custom"` | Generated IDs, workspace-scoped |

### Skills Management API

```python
# Create skill (8MB max upload)
skill = client.beta.skills.create(display_title="My Skill", files=...)

# List skills
skills = client.beta.skills.list(source="anthropic"|"custom")

# Retrieve skill
skill = client.beta.skills.retrieve(skill_id="...")

# Create version
version = client.beta.skills.versions.create(skill_id="...")

# Delete (must delete all versions first)
client.beta.skills.delete(skill_id="...")
```

### File Handling

```python
# Extract file_id from response
file_id = response.content[0].file_id

# Download via Files API
content = client.beta.files.download(file_id=file_id)

# Get metadata
metadata = client.beta.files.retrieve_metadata(file_id=file_id)
```

## Skill Discovery

Claude automatically discovers skills:

1. **Global skills**: `~/.claude/skills/`
2. **Project skills**: `.claude/skills/`
3. **Plugin skills**: From installed plugins

Skills are activated when:
- Task matches skill description
- User explicitly invokes skill
- Context suggests skill is relevant

## Managing Skills

### List Skills
```bash
claude skills list
```

### Test Skill
```bash
claude --skill my-skill "test task"
```

### Share Skill
```bash
# Package skill
cd .claude/skills/my-skill
tar -czf my-skill.tar.gz .

# Or create plugin
# See references/hooks-and-plugins.md
```

### Install Skill
```bash
# Manual installation
cd .claude/skills/
tar -xzf my-skill.tar.gz
```

## Example Skills

### API Testing Skill

**SKILL.md:**
```markdown
---
name: api-testing
description: Test REST APIs with automated requests
version: 1.0.0
---
# API Testing

Test REST APIs with comprehensive validation.

## When to Use

Use when testing API endpoints, validating responses, or
creating API test suites.

## Instructions

1. Read API documentation from references/api-docs.md
2. Use scripts/test-api.py for making requests
3. Validate response status, headers, body
4. Generate test report

## Examples

Request: "Test the /users endpoint"
Actions:
- Read references/api-docs.md for endpoint spec
- Run scripts/test-api.py --endpoint /users
- Validate response matches schema
- Report results
```

### Database Migration Skill

**SKILL.md:**
```markdown
---
name: db-migrations
description: Create and manage database migrations
version: 1.0.0
---

# Database Migrations

Create safe, reversible database schema changes.

## When to Use

Use when modifying database schema, adding tables,
or changing column definitions.

## Instructions

1. Review current schema in references/schema.md
2. Create migration file in migrations/
3. Include both up and down migrations
4. Test migration on development database
5. Update references/schema.md

## Migration Template

See assets/migration-template.sql for standard format.
```

## Progressive Disclosure

Three-level token optimization:

| Level | When Loaded | Token Budget | Content |
|-------|-------------|--------------|---------|
| Level 1 (Metadata) | Always | ~100 tokens/skill | name, description from frontmatter |
| Level 2 (Instructions) | When triggered | <5K tokens | Main SKILL.md body |
| Level 3+ (Resources) | On-demand | Unlimited | References, scripts, assets |

Keep `SKILL.md` concise (<500 lines) by:

1. **Core instructions** in `SKILL.md`
2. **Detailed docs** in references/
3. **Executable code** in scripts/ (executed, not loaded into context)
4. **Templates** in assets/

**Key advantage**: Scripts execute without loading code into context—only output matters.

Example structure:
```markdown
# My Skill

Brief overview.

## When to Use

Clear activation criteria.

## Instructions

High-level steps that reference:
- references/detailed-workflow.md
- scripts/automation.py
- assets/template.tsx
```

## Troubleshooting

### Skill Not Activating
- Check description specificity
- Ensure `SKILL.md` has clear activation criteria

### Resource Not Found
- Verify file paths in `SKILL.md`
- Check directory structure
- Use relative paths from skill root

### Conflicting Skills
- Make descriptions more specific
- Use unique names
- Scope skills narrowly

## See Also

- Skill creation guide: https://docs.claude.com/claude-code/skills
- Best practices: https://docs.claude.com/agents-and-tools/agent-skills/best-practices
- API usage: `references/api-reference.md`
- Plugin system: `references/hooks-and-plugins.md`
