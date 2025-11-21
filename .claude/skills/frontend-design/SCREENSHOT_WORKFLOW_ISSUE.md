# Screenshot-to-Code Workflow Issue Analysis

## Problem Statement

When user provides a screenshot and asks Claude Code to create a landing page using the frontend-design skill, Claude creates HTML/CSS/JS directly WITHOUT following the design extraction and analysis workflows documented in the skill references.

## Evidence

Demo output in `demo-landing-page/`:
- ✅ Created functional HTML/CSS/JS
- ✅ Used distinctive fonts (Volkhov, Poppins)
- ✅ Applied animations with anime.js
- ❌ Did NOT extract design guidelines from screenshot first
- ❌ Did NOT use `design-extraction-overview.md` workflow
- ❌ Did NOT use `visual-analysis-overview.md` to verify
- ❌ Did NOT follow the documented multimodal workflows

## Root Causes

### 1. Missing Activation Context in Description

**Current description**:
```yaml
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
```

**Problem**: Doesn't mention screenshots, images, design references, or inspiration as input types.

**Impact**: When user says "create landing page from this screenshot", Claude doesn't recognize this as requiring design extraction workflow.

### 2. No Primary Workflow for Screenshot Inputs

**Current SKILL.md structure**:
1. Design Thinking (for creating from scratch)
2. Frontend Aesthetics Guidelines
3. Visual Asset Generation (for generating images)

**Problem**: No section for "Screenshot/Image Input Workflow" as a PRIMARY use case.

**Impact**: Claude defaults to "Design Thinking" (create from scratch) instead of "Extract from screenshot then implement".

### 3. Design Extraction Positioned as Secondary/Optional

**Current text**:
```markdown
## Visual Asset Generation

When you need hero images, backgrounds, textures, or decorative elements...
```

**Problem**: The word "When you need" makes this sound optional. The section is about GENERATING assets, not ANALYZING provided screenshots.

**Impact**: Claude interprets this as "if I need to generate images" not "if user provides images/screenshots to analyze".

### 4. No Procedural Workflow for Screenshot→Code

**Missing from SKILL.md**:
- Step 1: If user provides screenshot/image, FIRST extract design guidelines
- Step 2: Analyze extracted colors, typography, spacing, layout
- Step 3: Implement code following extracted guidelines
- Step 4: Verify implementation matches screenshot

**Impact**: Even if Claude reads the skill, there's no clear instruction to follow the extraction workflow BEFORE coding.

## Insights from Agent Skills Documentation

From https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview:

> **Skills activate based on relevance matching**. Claude loads the skill's instructions when your request matches the `description` field from the YAML frontmatter.

From https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills:

> **Within a triggered skill**, Claude reads SKILL.md and **determines which referenced materials to access** based on task relevance.

**Key Insight**:
1. Description determines IF skill triggers
2. SKILL.md structure determines WHICH workflow Claude follows
3. Without explicit procedural instructions, Claude makes assumptions based on context

## Solutions

### Solution 1: Update Skill Description

Add screenshot/image/design reference contexts:

```yaml
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications, OR when they provide screenshots/images/designs to replicate or draw inspiration from. For screenshot inputs, extracts design guidelines first using ai-multimodal analysis, then implements code following those guidelines. Generates creative, polished code that avoids generic AI aesthetics.
```

### Solution 2: Add "Screenshot-to-Code Workflow" Section

Add BEFORE "Design Thinking" section:

```markdown
## Input Types

### When User Provides Screenshot/Image/Design Reference

**MANDATORY workflow for screenshot inputs**:

1. **Extract Design Guidelines** using `./references/design-extraction-overview.md`:
   - Analyze screenshot with ai-multimodal skill
   - Extract: colors (hex codes), typography (fonts, sizes), spacing scale, layout patterns
   - Document in project `docs/design-guidelines/`

2. **Implement Code** following extracted guidelines:
   - Use exact colors from extraction
   - Match typography specifications
   - Replicate layout and spacing
   - Maintain visual hierarchy

3. **Verify Quality** using `./references/visual-analysis-overview.md`:
   - Compare implementation to original screenshot
   - Check color accuracy, spacing consistency
   - Ensure all design elements preserved

See `./references/design-extraction-overview.md` for detailed extraction workflows.

### When Building from Scratch

Follow "Design Thinking" section below...
```

### Solution 3: Restructure Visual Asset Generation Section

Clarify distinction between analyzing PROVIDED images vs. generating NEW images:

```markdown
## Working with Visual Assets

### Analyzing Provided Screenshots/Images
When user provides screenshots, photos, or design references to analyze or replicate, use `./references/design-extraction-overview.md` to extract design guidelines BEFORE implementation.

### Generating New Visual Assets
When you need to GENERATE hero images, backgrounds, textures, or decorative elements that match the design aesthetic, use the `ai-multimodal` skill via `./references/asset-generation.md`.
```

### Solution 4: Add Clear Conditional Logic

Make it impossible to miss:

```markdown
## Workflow Decision Tree

**User provides screenshot/image/design?**
→ YES: Follow `design-extraction-overview.md` → Extract guidelines → Implement code
→ NO: Follow "Design Thinking" process → Create from scratch
```

## Recommended Implementation Priority

1. **High Priority**: Add "Screenshot-to-Code Workflow" section with mandatory steps
2. **High Priority**: Update skill description to include screenshot/image contexts
3. **Medium Priority**: Restructure "Visual Asset Generation" to clarify analyze vs. generate
4. **Low Priority**: Add decision tree (nice to have, but procedural instructions sufficient)

## Testing Strategy

After fixes:
1. Provide screenshot to Claude Code
2. Activate frontend-design skill
3. Verify Claude follows extraction workflow BEFORE coding
4. Check that design guidelines are documented
5. Confirm implementation matches extracted specifications
