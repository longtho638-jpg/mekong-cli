---
description: Deployment pipeline and infrastructure management
---

# 🚀 Deployment Workflow

> **Binh Pháp:** "Thiên thời địa lợi nhân hòa" - Right time, right place, right execution

## ⚙️ Core Engine
- **Implementation**: `antigravity/core/ops_engine.py`
- **Infrastructure**: `antigravity/core/infrastructure.py`
- **Config**: `.mekong/deployment.json`

## 🚀 Trigger Commands

- `mekong deploy` - Standard production deployment
- `mekong deploy --stage staging` - Deploy to staging
- `mekong deploy rollback` - Revert to previous stable version

## 🔄 Workflow Steps

### 1. 🔍 Pre-Flight Checks (OpsEngine)
The `OpsEngine` validates the environment before any action.

**Checks:**
- git status (clean tree required)
- CI/CD pipeline status (must be green)
- `tests/` pass rate (100% required)
- Security scan (no critical CVEs)

### 2. 📦 Build & Package
Uses `infrastructure.py` to manage build artifacts.

```python
# antigravity/core/ops_engine.py
def build_artifacts():
    # 1. Run build scripts (pnpm build, etc.)
    # 2. Optimize assets (tree-shaking, minification)
    # 3. Generate Docker images (if applicable)
```

### 3. 🎯 Deployment Execution
Deploys based on configured targets in `.mekong/config.json`.

| Target   | Handler (infrastructure.py) | Status |
| -------- | --------------------------- | ------ |
| Vercel   | `VercelAdapter`             | ✅     |
| Cloudflare| `CloudflareAdapter`        | ✅     |
| Docker   | `DockerAdapter`             | ✅     |

### 4. 📊 Post-Deploy Verification
- Smoke tests execution
- Health endpoint check (`/health`)
- Notification to team (Discord/Slack via `NotificationHook`)

## 🛠 Configuration

```json
{
  "deployment": {
    "provider": "vercel",
    "environments": {
      "production": {
        "branch": "main",
        "url": "https://example.com"
      },
      "staging": {
        "branch": "develop",
        "url": "https://staging.example.com"
      }
    },
    "checks": {
      "require_clean_git": true,
      "require_tests_pass": true
    }
  }
}
```

## 🔗 Related Components
- `antigravity/core/code_guardian.py` - Code quality gates
- `cli/commands/deploy.py` - CLI entry point
- `scripts/ci/` - CI/CD scripts
