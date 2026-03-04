---
description: 📋 Changelog Generator — Auto-generate CHANGELOG from Git Commits
argument-hint: [--from=tag] [--to=HEAD] [--output=CHANGELOG.md]
---

**Think harder** để changelog gen: <$ARGUMENTS>

**IMPORTANT:** Changelog PHẢI theo conventional commits — đầy đủ versions.

## Conventional Commits

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
refactor: Code refactoring
test: Add tests
chore: Maintenance
```

## Commands

```bash
# === Generate Changelog ===
npx conventional-changelog -p angular -i CHANGELOG.md -s

# === From Specific Tag ===
npx conventional-changelog -p angular -i CHANGELOG.md -s -r 1

# === All Versions ===
npx conventional-changelog -p angular -i CHANGELOG.md -s -r 0

# === Dry Run ===
npx conventional-changelog -p angular

# === Custom Output ===
npx conventional-changelog -p angular -o CHANGELOG.md
```

## package.json Config

```json
{
  "scripts": {
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s",
    "changelog:all": "conventional-changelog -p angular -i CHANGELOG.md -s -r 0"
  },
  "devDependencies": {
    "conventional-changelog-cli": "^4.0.0"
  }
}
```

## CI/CD Auto-Generate

```yaml
# .github/workflows/changelog.yml
name: Update Changelog

on:
  release:
    types: [created]

jobs:
  changelog:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0

    - name: Generate Changelog
      run: npx conventional-changelog -p angular -i CHANGELOG.md -s

    - name: Commit Changelog
      uses: stefanzweifel/git-auto-commit-action@v5
      with:
        commit_message: 'docs: update changelog'
        file_pattern: CHANGELOG.md
```

## Related Commands

- `/release-notes` — Generate release notes
- `/version-bump` — Bump version
- `/git` — Git operations
