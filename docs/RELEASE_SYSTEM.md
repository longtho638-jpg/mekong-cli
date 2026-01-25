# 🏯 AgencyOS Release Automation System

Production-grade automated release pipeline for version management, building, publishing, and deployment.

## 🚀 Features

1. **Version Management** - Semantic versioning with automated updates
2. **Changelog Generation** - Auto-generated from git commits
3. **Git Tagging** - Annotated tags with release metadata
4. **Docker Builds** - Multi-architecture image building
5. **Python Packaging** - PyPI-ready wheel and sdist
6. **Registry Publishing** - Docker Hub and PyPI integration
7. **Environment Deployment** - Staging and production with safety checks
8. **Rollback Support** - One-command rollback to previous versions

## 📋 Prerequisites

### Required Tools
- Python 3.9+
- Git
- Docker (for Docker builds)
- Docker Hub account (for publishing)

### Optional Tools
- `twine` - For PyPI publishing: `pip install twine`
- `kubectl` - For Kubernetes deployments
- Cloud CLI tools (AWS CLI, gcloud, etc.)

## 🎯 Quick Start

### Installation

The release tools are already included in the AgencyOS repository:

```bash
# Make scripts executable (already done)
chmod +x scripts/cc_release.py
chmod +x scripts/cc
chmod +x deploy-*.sh

# Optional: Add to PATH for easy access
export PATH="$PATH:$(pwd)/scripts"
```

### Basic Usage

```bash
# Using the Python script directly
python3 scripts/cc_release.py <command> [options]

# Or using the wrapper (shorter)
./scripts/cc release <command> [options]
```

## 📚 Commands Reference

### 1. Create Release

Create a new release with version updates, changelog, and git tag.

```bash
# Create release v1.0.0
cc release create 1.0.0

# Create without git tag
cc release create 1.0.1 --no-tag

# Create without changelog update
cc release create 1.0.2 --no-changelog
```

**What it does:**
- ✅ Updates version in `setup.py`
- ✅ Creates `VERSION` file
- ✅ Generates changelog from git commits
- ✅ Updates `CHANGELOG.md`
- ✅ Creates git commit
- ✅ Creates annotated git tag

**Changelog Categories:**
- ✨ Features - Commits with "feat" or "feature"
- 🐛 Bug Fixes - Commits with "fix" or "bug"
- 📚 Documentation - Commits with "docs" or "documentation"
- 🔧 Other Changes - All other commits

### 2. Build Artifacts

Build Docker images and Python packages.

```bash
# Build everything (Docker + Python)
cc release build

# Build Docker image only
cc release build --docker-only

# Build Python package only
cc release build --python-only

# Tag Docker image as 'latest'
cc release build --tag-latest
```

**What it does:**
- 🐳 Builds Docker image: `agencyos/mekong-cli:X.Y.Z`
- 📦 Builds Python package: `dist/mekong-cli-X.Y.Z.tar.gz` and `.whl`

### 3. Publish to Registries

Publish Docker images and Python packages to registries.

```bash
# Publish everything
cc release publish

# Publish Docker image only
cc release publish --docker-only

# Publish to PyPI only
cc release publish --pypi-only

# Test with TestPyPI first
cc release publish --test-pypi

# Push 'latest' Docker tag
cc release publish --push-latest
```

**Prerequisites:**
- Docker Hub login: `docker login`
- PyPI credentials: `~/.pypirc` or environment variables

### 4. Deploy to Environments

Deploy to staging or production with safety checks.

```bash
# Deploy to staging
cc release deploy staging

# Deploy specific version to staging
cc release deploy staging --version 1.0.0

# Deploy to production (with confirmation)
cc release deploy production
```

**Safety Features (Production):**
- 🔒 Checks working directory is clean
- ⚠️ Requires explicit confirmation
- 🔍 Runs deployment scripts with verification

**Deployment Scripts:**
- `deploy-staging.sh` - Staging deployment logic
- `deploy-production.sh` - Production deployment with blue-green strategy

### 5. Rollback

Rollback to the previous version.

```bash
# Rollback to previous release
cc release rollback
```

**What it does:**
- 📋 Lists current and previous versions
- ⚠️ Asks for confirmation
- ⏪ Checks out previous git tag
- 💡 Provides deployment instructions

## 🔄 Complete Release Workflow

### Standard Release Process

```bash
# 1. Create release
cc release create 1.0.0
# Review the generated changelog and version updates

# 2. Push to remote
git push && git push --tags

# 3. Build artifacts
cc release build --tag-latest

# 4. Test locally (optional)
docker run -p 8080:8080 agencyos/mekong-cli:1.0.0

# 5. Publish to registries
cc release publish --push-latest

# 6. Deploy to staging
cc release deploy staging

# 7. Verify staging deployment
# (Run your tests, manual verification, etc.)

# 8. Deploy to production
cc release deploy production
```

### Hotfix Release Process

```bash
# 1. Create hotfix release
cc release create 1.0.1

# 2. Build and publish
git push && git push --tags
cc release build --tag-latest
cc release publish --push-latest

# 3. Deploy to production immediately
cc release deploy production --version 1.0.1
```

### Rollback Process

```bash
# If production deployment has issues
cc release rollback

# Then redeploy
cc release deploy production
```

## 🛠️ Customization

### Deployment Scripts

Customize the deployment scripts for your infrastructure:

#### Staging (`deploy-staging.sh`)

```bash
# Example: Docker Compose
docker-compose -f docker-compose.staging.yml up -d

# Example: Kubernetes
kubectl set image deployment/agencyos agencyos=${DOCKER_IMAGE} -n staging

# Example: Cloud platforms
aws ecs update-service --cluster staging --service agencyos --force-new-deployment
```

#### Production (`deploy-production.sh`)

The production script includes:
- **Pre-deployment checks** - Health checks, database connectivity
- **Blue-green deployment** - Zero-downtime deployment strategy
- **Post-deployment verification** - Smoke tests and monitoring
- **Notification integration** - Slack, email, etc.

### Version File Locations

Update these locations in `cc_release.py` if needed:

```python
self.setup_py = project_root / "setup.py"          # Python version
self.package_json = project_root / "package.json"  # Node version
self.version_file = project_root / "VERSION"       # Version file
```

### Docker Image Name

Change the Docker image name in `cc_release.py`:

```python
image_name = "agencyos/mekong-cli"  # Change to your image name
```

## 🔐 Security Best Practices

### Secrets Management

**Don't commit secrets!** Use environment variables or secret management tools:

```bash
# PyPI credentials
export TWINE_USERNAME="__token__"
export TWINE_PASSWORD="pypi-xxx"

# Docker Hub credentials
docker login -u username -p password

# Or use secret files
~/.pypirc
~/.docker/config.json
```

### Production Safety

The production deployment includes:
1. ✅ Working directory clean check
2. ✅ Manual confirmation required
3. ✅ Health checks before switching traffic
4. ✅ Automatic rollback on failure

### Git Signing

For enhanced security, sign your release tags:

```bash
# Configure git signing
git config user.signingkey YOUR_GPG_KEY
git config commit.gpgsign true
git config tag.gpgsign true

# Tags will be automatically signed
cc release create 1.0.0
```

## 📊 CI/CD Integration

### GitHub Actions Example

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build
        run: python3 scripts/cc_release.py build --tag-latest

      - name: Publish
        env:
          DOCKER_USERNAME: ${{ secrets.DOCKER_USERNAME }}
          DOCKER_PASSWORD: ${{ secrets.DOCKER_PASSWORD }}
          TWINE_USERNAME: ${{ secrets.PYPI_USERNAME }}
          TWINE_PASSWORD: ${{ secrets.PYPI_PASSWORD }}
        run: |
          echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin
          python3 scripts/cc_release.py publish --push-latest

      - name: Deploy to Production
        run: python3 scripts/cc_release.py deploy production
```

### GitLab CI Example

```yaml
release:
  stage: deploy
  only:
    - tags
  script:
    - python3 scripts/cc_release.py build --tag-latest
    - python3 scripts/cc_release.py publish --push-latest
    - python3 scripts/cc_release.py deploy production
```

## 🐛 Troubleshooting

### Common Issues

#### "No previous tags found"
**Solution:** This is your first release. Everything is normal.

#### "Working directory is not clean"
**Solution:** Commit or stash your changes before creating a release.

```bash
git status
git add .
git commit -m "chore: prepare for release"
```

#### "Docker image not found"
**Solution:** Make sure to build before publishing.

```bash
cc release build
cc release publish
```

#### "Permission denied: docker"
**Solution:** Add your user to the docker group or use sudo.

```bash
sudo usermod -aG docker $USER
# Then log out and back in
```

#### "Twine not installed"
**Solution:** Install twine for PyPI publishing.

```bash
pip install twine
```

## 📈 Advanced Usage

### Semantic Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0) - Breaking changes
- **MINOR** (1.0.0 → 1.1.0) - New features (backward compatible)
- **PATCH** (1.0.0 → 1.0.1) - Bug fixes

### Pre-release Versions

For pre-releases, you can:

```bash
# Option 1: Use release candidate naming
cc release create 1.0.0-rc1 --no-tag

# Option 2: Publish to TestPyPI
cc release publish --test-pypi
```

### Multi-architecture Docker Builds

For ARM/x86 support:

```bash
# Enable buildx
docker buildx create --use

# Build multi-arch
docker buildx build --platform linux/amd64,linux/arm64 -t agencyos/mekong-cli:1.0.0 --push .
```

## 📞 Support

For issues or questions:
- GitHub Issues: [agencyos/mekong-cli/issues](https://github.com/longtho638-jpg/mekong-cli/issues)
- Documentation: [docs.agencyos.network](https://docs.agencyos.network)

## 📄 License

MIT License - See [LICENSE](../LICENSE) file

---

**Built with ❤️ by the AgencyOS Team**
