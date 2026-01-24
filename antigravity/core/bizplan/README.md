# BizPlan Generator Module

## Overview

The BizPlan Generator is a Python module that generates comprehensive business plans using the **Agentic Business Plan 2026 Zero→IPO** framework. It reads SKILL templates from `.agencyos/Documents/` and generates markdown-formatted business plans following a 9-section structure.

## Features

- **Framework-based Generation**: Uses the MASTER framework from `.agencyos/Documents/00_MASTER-Agentic-BizPlan-OS.json`
- **25 SKILL Templates**: Loads all available SKILL templates for contextualized generation
- **Tri-Layer Approach**: Every section considers [Business], [Agentic], and [Governance] perspectives
- **9-Section Structure**: Follows the complete Zero→IPO business plan format
- **Markdown Output**: Generates clean, readable markdown documents

## 9-Section Structure

1. **Meta & Stage**: Company overview, stage identification, agentic maturity
2. **Vision, Mission & Zero→IPO Story**: Long-term vision and narrative
3. **Market & Customer**: TAM/SAM/SOM, customer personas, market trends
4. **Product & Agentic Operating System**: Product description, agent architecture
5. **Business Model & Unit Economics**: Revenue streams, LTV/CAC, margins
6. **Growth Engine (AARRR + Growth Agents)**: Acquisition, activation, retention strategies
7. **Operations, Risk & Compliance**: SLAs, risk management, compliance framework
8. **Financial Plan & IPO Roadmap**: 3-5 year projections, capital strategy
9. **Brand, Story & Psychology**: Brand positioning, customer psychology

## Usage

### Basic Usage

```python
from antigravity.core.bizplan import BizPlanGenerator

# Initialize generator
generator = BizPlanGenerator()

# Generate business plan
business_idea = "AI-powered financial planning SaaS for Vietnamese SMEs"
bizplan_markdown = generator.generate_bizplan(business_idea)

# Save to file
with open("bizplan.md", "w") as f:
    f.write(bizplan_markdown)
```

### Advanced Usage

```python
from antigravity.core.bizplan import BizPlanGenerator

# Initialize with custom documents path
generator = BizPlanGenerator(documents_path="/custom/path/.agencyos/Documents")

# List available skills
skills = generator.list_available_skills()
print(f"Loaded {len(skills)} skill templates")

# Get skill information
skill_info = generator.get_skill_info("05_SKILL-Business-Model-Patterns-and-Unit-Economics")
if skill_info:
    print(f"Skill: {skill_info.title}")
    print(f"Description: {skill_info.description}")
```

## Data Models

### BizPlanGenerator

Main class for generating business plans.

**Attributes:**
- `documents_path`: Path to `.agencyos/Documents/` directory
- `master_framework`: Loaded MASTER framework
- `skill_templates`: Dictionary of loaded SKILL templates

**Methods:**
- `generate_bizplan(business_idea: str) -> str`: Generate markdown bizplan
- `list_available_skills() -> List[str]`: List all loaded skill IDs
- `get_skill_info(skill_id: str) -> Optional[SkillTemplate]`: Get skill details

### SkillTemplate

Represents a SKILL template loaded from JSON.

**Attributes:**
- `id`: Skill identifier
- `title`: Skill title
- `description`: Skill description
- `processing_pipeline`: List of processing steps
- `output_spec`: Output specification
- `input_spec`: Input specification

### MasterFramework

Represents the MASTER framework structure.

**Attributes:**
- `title`: Framework title
- `purpose`: Framework purpose and description
- `core_principles`: Tri-layer approach, stage model, agentic maturity
- `frame_2026`: The 9-section structure definition
- `glossary`: Terminology definitions

## Requirements

- Python 3.8+
- `.agencyos/Documents/` directory with SKILL JSON files
- `00_MASTER-Agentic-BizPlan-OS.json` in documents directory

## Output Format

The generator produces markdown with:

- Framework introduction and core principles
- 9 structured sections with tri-layer breakdowns
- TODO placeholders for actual content filling
- Glossary of key terms

## Next Steps (Task 2+)

This module provides the **data model and basic generation logic only**. Future tasks will add:

- **Task 2**: AI integration for content generation
- **Task 3**: CLI interface with `mekong bizplan generate` command
- **Task 4**: Interactive prompts and refinement

## Example Output

```markdown
# MASTER – Agentic Business Plan 2026 Zero→IPO (VN/SEA)

**Version:** 1.0.0

**Business Idea:** AI-powered financial planning SaaS for Vietnamese SMEs

## 0. Meta & Stage
**Tags:** Business, Governance

### [Business]
- Tên công ty / dự án
- Ngành, mô hình (SaaS, marketplace, fintech, edtech, v.v.)
...

### [Agentic]
- Agentic maturity level (0–3)
...
```

## License

Part of the Antigravity/Mekong CLI project.
