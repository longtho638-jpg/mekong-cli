# 🚀 Release System Quick Reference

## One-Line Commands

```bash
# Create + Build + Publish + Deploy (Full pipeline)
cc release create 1.0.0 && \
git push && git push --tags && \
cc release build --tag-latest && \
cc release publish --push-latest && \
cc release deploy production

# Hotfix pipeline
cc release create 1.0.1 && \
git push --tags && \
cc release build && \
cc release publish && \
cc release deploy production

# Rollback
cc release rollback && cc release deploy production
```

## Command Cheat Sheet

| Task | Command |
|------|---------|
| Create release | `cc release create 1.0.0` |
| Build all | `cc release build` |
| Build Docker only | `cc release build --docker-only` |
| Build Python only | `cc release build --python-only` |
| Publish all | `cc release publish` |
| Publish Docker only | `cc release publish --docker-only` |
| Publish PyPI only | `cc release publish --pypi-only` |
| Test PyPI | `cc release publish --test-pypi` |
| Deploy staging | `cc release deploy staging` |
| Deploy production | `cc release deploy production` |
| Rollback | `cc release rollback` |

## Version Bumping Guide

| Change Type | Example | When to Use |
|-------------|---------|-------------|
| Patch | 1.0.0 → 1.0.1 | Bug fixes, small changes |
| Minor | 1.0.0 → 1.1.0 | New features (backward compatible) |
| Major | 1.0.0 → 2.0.0 | Breaking changes |

## Workflow Templates

### Standard Release
```bash
cc release create X.Y.Z
git push && git push --tags
cc release build --tag-latest
cc release deploy staging
# Test staging...
cc release publish --push-latest
cc release deploy production
```

### Emergency Hotfix
```bash
cc release create X.Y.Z
git push --tags
cc release build && cc release publish
cc release deploy production
```

### Staged Rollout
```bash
# Deploy to staging first
cc release deploy staging --version X.Y.Z

# After testing, deploy to production
cc release deploy production --version X.Y.Z
```

## Safety Checklist

- [ ] All tests passing
- [ ] No uncommitted changes
- [ ] Version number follows semver
- [ ] Changelog reviewed
- [ ] Docker Hub logged in
- [ ] PyPI credentials configured
- [ ] Backup plan ready

## Emergency Commands

```bash
# Quick rollback
cc release rollback

# Force rebuild
docker build --no-cache -t agencyos/mekong-cli:X.Y.Z .

# Manual tag
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z

# Delete bad tag
git tag -d vX.Y.Z
git push origin :refs/tags/vX.Y.Z
```
