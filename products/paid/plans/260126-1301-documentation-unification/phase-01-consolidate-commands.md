# Phase 1: Documentation Consolidation

**Priority:** HIGH
**Status:** IN_PROGRESS
**Estimated Time:** 2-3 hours

## Context

Based on command consistency analysis (`command-consistency-analysis.md`), we have fragmented documentation across multiple files with 3 competing command paradigms.

## Requirements

### Functional Requirements
1. Consolidate all commands into single CLI_REFERENCE.md
2. Add cross-references from getting-started.md to CLI_REFERENCE.md
3. Create comprehensive command index
4. Document command equivalences (old → new)

### Non-Functional Requirements
- Maintain backward compatibility documentation
- Preserve all existing command information
- Ensure searchability and navigation
- Keep file size manageable (<2000 lines per section)

## Architecture

### Documentation Structure

```
docs/
├── getting-started.md          # Quick start (updated with references)
├── CLI_REFERENCE.md            # Single source of truth (consolidated)
├── modules/
│   ├── revenue.md              # Module-specific deep dives
│   ├── sales.md
│   ├── content.md
│   ├── agent.md
│   └── binh-phap.md           # Cultural module (Phase 3)
├── migration-guide.md          # Old → New commands (Phase 2)
└── command-index.md            # Alphabetical + category index
```

### CLI_REFERENCE.md Structure

```markdown
# CLI Reference

## Quick Reference
- Command syntax overview
- Entry point (claude vs mekong vs cc)

## Module System
- revenue
- sales
- content
- agent
- devops
- client
- release
- analytics
- monitor

## Slash Commands (Legacy)
- /cook → claude workflow implement
- /quote → claude sales quote
- /win3 → claude strategy validate-win
- /proposal → claude sales proposal
- /antigravity → claude quantum activate

## Binh Pháp Commands (Cultural)
- mekong init
- mekong setup-vibe
- mekong run-scout
```

## Related Code Files

**Existing Files to Read:**
- `/Users/macbookprom1/mekong-cli/docs/getting-started.md` - Current quick start
- `/Users/macbookprom1/mekong-cli/docs/CLI_REFERENCE.md` - Current reference (cc modules only)
- `/Users/macbookprom1/mekong-cli/products/paid/plans/260126-1245-fix-incomplete-products/command-consistency-analysis.md` - Analysis findings

**Files to Create:**
- `/Users/macbookprom1/mekong-cli/docs/command-index.md` - Command index
- `/Users/macbookprom1/mekong-cli/docs/modules/` - Module-specific docs (if needed)

**Files to Update:**
- `/Users/macbookprom1/mekong-cli/docs/getting-started.md` - Add references to CLI_REFERENCE.md
- `/Users/macbookprom1/mekong-cli/docs/CLI_REFERENCE.md` - Add slash commands and mekong commands

## Implementation Steps

### Step 1: Extract Slash Commands Documentation
1. Read `getting-started.md` to find all slash command usage
2. Create slash commands section with:
   - Command description
   - Usage examples
   - Equivalent modern command
   - Deprecation status

### Step 2: Extract Mekong Commands Documentation
1. Extract `mekong` command patterns from `getting-started.md`
2. Document each command with:
   - Purpose
   - Syntax
   - Arguments
   - Examples
   - Modern equivalent

### Step 3: Consolidate into CLI_REFERENCE.md
1. Read current `CLI_REFERENCE.md` (contains cc modules)
2. Append new sections:
   - Quick Reference (all entry points)
   - Slash Commands (Legacy)
   - Mekong Commands (Binh Pháp)
3. Add navigation links between sections
4. Create table of contents

### Step 4: Create Command Index
1. Create `command-index.md`
2. Alphabetical index of ALL commands
3. Category-based index:
   - Revenue & Finance
   - Sales & Client Management
   - Content & Marketing
   - Agent Operations
   - DevOps & Deployment
   - Analytics & Monitoring
   - Binh Pháp Strategy

### Step 5: Update Cross-References
1. Update `getting-started.md`:
   - Add "See CLI Reference for full command documentation"
   - Link to specific sections in CLI_REFERENCE.md
   - Keep quick start examples
   - Add deprecation notices

### Step 6: Verify Completeness
1. Ensure ALL commands from analysis are documented
2. Check for broken links
3. Verify examples are accurate
4. Test navigation flow

## Todo List

- [x] Step 1: Extract slash commands from getting-started.md
- [x] Step 2: Extract mekong commands from getting-started.md
- [x] Step 3: Consolidate into CLI_REFERENCE.md
- [x] Step 4: Create command-index.md
- [x] Step 5: Update getting-started.md cross-references
- [x] Step 6: Verify completeness and test

## Success Criteria

- [x] All slash commands documented in CLI_REFERENCE.md
- [x] All mekong commands documented in CLI_REFERENCE.md
- [x] Command index created (alphabetical + category)
- [x] getting-started.md links to CLI_REFERENCE.md
- [x] No broken links
- [x] All commands from analysis accounted for

## Risk Assessment

**Low Risk:**
- Documentation-only changes
- No code modifications
- Preserves all existing information

**Mitigation:**
- Backup original files
- Review changes before committing
- Test all navigation links

## Security Considerations

- None (documentation only)
- Ensure no API keys or secrets in examples

## Next Steps

After completion → Phase 2: Command Standardization
