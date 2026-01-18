---
description: Add entry to changelog following Keep a Changelog format
---

// turbo

# /add-changelog - Changelog Entry

Add new entry to CHANGELOG.md following Keep a Changelog format.

## Usage

```
/add-changelog [type] [description]
```

## Types

- `added` - New features
- `changed` - Changes to existing functionality
- `deprecated` - Features to be removed
- `removed` - Removed features
- `fixed` - Bug fixes
- `security` - Security fixes

## Claude Prompt Template

```
Changelog workflow:

1. Read current CHANGELOG.md
2. Find or create [Unreleased] section
3. Find or create appropriate category (Added/Changed/Fixed/etc)
4. Add entry with format: "- {description}"
5. Maintain chronological order (newest first)
6. Save file

If no CHANGELOG.md exists, create with proper header.
```

## Example Output

```
📝 Changelog Updated

Added to [Unreleased] → Fixed:
- Resolve login timeout on slow connections

CHANGELOG.md updated ✅
```
