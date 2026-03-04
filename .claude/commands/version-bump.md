---
description: 🏷️ Version Bump — Semantic Versioning, npm version, Git Tags
argument-hint: [major|minor|patch|prerelease]
---

**Think harder** để version bump: <$ARGUMENTS>

**IMPORTANT:** Version PHẢI theo semver (MAJOR.MINOR.PATCH) — tag git tự động.

## Semantic Versioning

```
MAJOR.MINOR.PATCH
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)
```

## Commands

```bash
# === Bump Version ===
npm version patch    # 1.0.0 → 1.0.1
npm version minor    # 1.0.0 → 1.1.0
npm version major    # 1.0.0 → 2.0.0
npm version prerelease # 1.0.0 → 1.0.1-0

# === Specific Version ===
npm version 2.0.0

# === With Git Tag ===
npm version patch --git-tag-version true

# === Without Commit ===
npm version patch --commit-hooks false

# === View Current ===
npm version

# === View package.json ===
cat package.json | jq .version
```

## Manual Version Update

```bash
# === Update package.json ===
jq --arg v "2.0.0" '.version = $v' package.json > tmp.json && mv tmp.json package.json

# === Create Git Tag ===
git tag -a v2.0.0 -m "Release version 2.0.0"
git push origin v2.0.0
```

## CI/CD Auto Version

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Get version from tag
      id: get_version
      run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

    - name: Update package.json
      run: |
        jq --arg v "${{ steps.get_version.outputs.VERSION }}" '.version = $v' package.json > tmp.json
        mv tmp.json package.json

    - name: Create Release
      uses: softprops/action-gh-release@v1
      with:
        generate_release_notes: true
```

## Related Commands

- `/changelog-gen` — Generate changelog
- `/release-notes` — Release notes
- `/deploy` — Deploy project
