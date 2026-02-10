---
name: skill-seekers
description: Convert documentation sites, GitHub repos, and PDFs into production-ready CC CLI skills. Use when you need to create skills from external docs, scrape framework documentation, analyze codebases for skill extraction, or package skills for upload.
---

# Skill Seekers — Universal Skill Factory

Convert any documentation, GitHub repo, or PDF into CC CLI skills automatically.

## Installation

- **Venv**: `/Users/macbookprom1/mekong-cli/.skill-seekers-venv/`
- **CLI**: `.skill-seekers-venv/bin/skill-seekers`
- **Version**: 3.0.0 (Python 3.12)
- **MCP**: Configured in `.claude/mcp.json` (stdio transport)

## CLI Commands

```bash
SEEKERS="/Users/macbookprom1/mekong-cli/.skill-seekers-venv/bin/skill-seekers"

# Scrape documentation site → skill
$SEEKERS scrape --config configs/react.json

# Scrape GitHub repo → skill
$SEEKERS github --repo facebook/react

# Extract from PDF → skill
$SEEKERS pdf --file docs/spec.pdf

# Unified multi-source (docs + GitHub + PDF)
$SEEKERS unified --config my-config.json

# Estimate pages before scraping
$SEEKERS estimate --config configs/django.json

# Package for Claude upload
$SEEKERS package output/react --target claude

# Upload to Claude
$SEEKERS upload output/react.zip

# Install skill end-to-end (fetch → scrape → enhance → package → upload)
$SEEKERS install --config configs/react.json

# Analyze local codebase
$SEEKERS analyze --directory ./src --enhance

# AI enhancement (local, no API key)
$SEEKERS enhance output/react/

# Quality scoring
$SEEKERS quality output/react/SKILL.md
```

## MCP Tools (17 available via skill-seeker server)

| Category | Tools |
|----------|-------|
| Config | generate_config, list_configs, validate_config |
| Scraping | estimate_pages, scrape_docs, scrape_github, scrape_pdf |
| Packaging | package_skill, upload_skill, install_skill |
| Splitting | split_config, generate_router |
| Config Sources | fetch_config, submit_config, add/list/remove_config_source |

## Workflow: Create a Skill from Docs

```bash
# 1. Generate config for target docs site
# (via MCP or manually create JSON)

# 2. Estimate scope
$SEEKERS estimate --config configs/my-framework.json

# 3. Scrape
$SEEKERS scrape --config configs/my-framework.json

# 4. Enhance with AI
$SEEKERS enhance output/my-framework/

# 5. Package for Claude
$SEEKERS package output/my-framework --target claude

# 6. Install to .claude/skills/
$SEEKERS install-agent --skill output/my-framework
```

## Preset Configs

24+ built-in configs in `configs/` directory: React, Django, FastAPI, Vue, Godot, etc.
