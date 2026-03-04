---
description: 📝 Release Notes — Generate Release Notes from Git Tags/Commits
argument-hint: [tag|from..to] [--output=RELEASE.md]
---

**Think harder** để release notes: <tag>$ARGUMENTS</tag>

**IMPORTANT:** Release notes PHẢI có breaking changes, features, fixes — auto từ git tags.

## GitHub CLI

```bash
# === Generate from Tags ===
gh release view v1.0.0 --json body

# === Create Release ===
gh release create v1.0.0 --generate-notes

# === With Notes ===
gh release create v1.0.0 --notes-file RELEASE.md

# === List Releases ===
gh release list

# === Latest Release ===
gh release view --json tagName,body
```

## Git Commands

```bash
# === Commits Since Tag ===
git log v1.0.0..HEAD --oneline

# === With Format ===
git log v1.0.0..HEAD --pretty=format:"* %s (%h)"

# === By Author ===
git log v1.0.0..HEAD --pretty=format:"* %s" --author="name"

# === With Files Changed ===
git log v1.0.0..HEAD --stat
```

## Release Notes Template

```markdown
# Release v{{VERSION}} - {{DATE}}

## 🚀 Breaking Changes
- #123 Changed API signature

## ✨ New Features
- #124 Added dashboard analytics
- #125 Export to CSV

## 🐛 Bug Fixes
- #126 Fixed login redirect
- #127 Memory leak in parser

## 📚 Documentation
- Updated API docs
- Added migration guide

## 🔒 Security
- Fixed XSS vulnerability
```

## Automation Script

```bash
#!/bin/bash
# scripts/generate-release.sh

VERSION=$1
PREV_TAG=$(git describe --tags --abbrev=0 HEAD^1)

echo "# Release v${VERSION}"
echo ""
echo "## Changes since ${PREV_TAG}"
echo ""

git log ${PREV_TAG}..HEAD --pretty=format:"* %s (%h)" | \
  sed 's/feat:/✨ Feature:/' | \
  sed 's/fix:/🐛 Fix:/' | \
  sed 's/breaking:/🚀 Breaking:/'
```

## Related Commands

- `/changelog-gen` — Generate changelog
- `/version-bump` — Bump version
- `/deploy` — Deploy
