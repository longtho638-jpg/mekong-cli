---
description: 🔄 Environment Sync — Dev/Staging/Prod Synchronization, Config Management
argument-hint: [source: dev|staging|prod] [target: dev|staging|prod]
---

**Think harder** để sync environment: <source>$ARGUMENTS</source>

**IMPORTANT:** Không sync secrets giữa environments — chỉ sync config structure, không sync giá trị nhạy cảm.

## Environment Matrix

| Environment | Purpose | Data | Access | Deploy Frequency |
|-------------|---------|------|--------|------------------|
| **Dev** | Development | Mock/Sample | All devs | On every commit |
| **Staging** | Pre-production | Anonymized prod | Devs + QA | On PR merge |
| **Production** | Live | Real user data | Restricted | On release |

## Sync Scenarios

| Scenario | Command | Risk | Approval |
|----------|---------|------|----------|
| Dev → Staging | `mekong sync dev staging` | Low | Auto |
| Staging → Prod | `mekong sync staging prod` | Medium | Manual |
| Prod → Staging | `mekong sync prod staging` | Low | Auto |
| Prod → Dev | `mekong sync prod dev` | Medium | Manual + anonymize |

## Pre-Sync Checklist

```bash
# 1. Check current state
kubectl config current-context
kubectl get namespaces

# 2. Verify access
kubectl auth can-i get secrets -n staging
kubectl auth can-i get secrets -n production

# 3. Backup target
kubectl get all -n staging -o yaml > staging-backup-$(date +%Y%m%d).yaml

# 4. Notify team
echo "🔄 Syncing dev → staging" | slack-cli -c '#deployments'
```

## ConfigMap Sync

```bash
# === Export ConfigMap from Source ===
# Dev environment
kubectl get configmap app-config -n dev -o yaml > app-config-dev.yaml

# Edit values for staging
sed -i 's/localhost/staging.agencyos.network/g' app-config-dev.yaml
sed -i 's/debug:true/debug:false/g' app-config-dev.yaml
sed -i 's/LOG_LEVEL=debug/LOG_LEVEL=info/g' app-config-dev.yaml

# Remove cluster-specific metadata
yq delete -i app-config-dev.yaml metadata.namespace
yq delete -i app-config-dev.yaml metadata.creationTimestamp
yq delete -i app-config-dev.yaml metadata.resourceVersion
yq delete -i app-config-dev.yaml metadata.uid

# Apply to target
kubectl apply -f app-config-dev.yaml -n staging
```

```yaml
# k8s/config/dev-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: dev
data:
  API_URL: "http://localhost:3000"
  LOG_LEVEL: "debug"
  ENABLE_PROFILING: "true"
  DB_HOST: "localhost"
  CACHE_ENABLED: "false"
```

```yaml
# k8s/config/staging-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: staging
data:
  API_URL: "https://staging.agencyos.network"
  LOG_LEVEL: "info"
  ENABLE_PROFILING: "false"
  DB_HOST: "staging-db.internal"
  CACHE_ENABLED: "true"
```

## Secret Sync (Secure)

```bash
# === NEVER sync secrets directly ===
# Instead, recreate in each environment

# 1. List secret names (not values)
kubectl get secrets -n dev

# 2. Create new secret in staging
kubectl create secret generic app-secrets \
  --from-literal=JWT_SECRET=$(openssl rand -hex 32) \
  --from-literal=API_KEY=$(openssl rand -hex 16) \
  --namespace staging

# 3. Or use sealed-secrets (Bitnami)
kubeseal --format yaml < dev-secret.yaml > staging-secret.yaml
kubectl apply -f staging-secret.yaml -n staging
```

```yaml
# Use External Secrets Operator
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
  namespace: staging
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: app-secrets
  data:
  - secretKey: JWT_SECRET
    remoteRef:
      key: staging/app/jwt-secret
  - secretKey: API_KEY
    remoteRef:
      key: staging/app/api-key
```

## Database Sync

```bash
# === Dev → Staging (Mock Data) ===
# 1. Export schema from dev
pg_dump -h localhost -U dev_user app_dev --schema-only > schema.sql

# 2. Apply to staging
psql -h staging-db -U staging_user app_staging < schema.sql

# 3. Generate mock data
python scripts/generate-mock-data.py --env staging --records 10000
```

```bash
# === Production → Staging (Anonymized) ===
# 1. Take production snapshot
aws rds create-db-snapshot \
  --db-instance-identifier prod-db \
  --db-snapshot-identifier prod-snapshot-$(date +%Y%m%d)

# 2. Restore to staging
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier staging-db \
  --db-snapshot-identifier prod-snapshot-latest

# 3. Run anonymization script
python scripts/anonymize-data.py --env staging

# SQL anonymization example
psql -h staging-db -U staging_user app_staging << 'EOF'
-- Anonymize users
UPDATE users SET
  email = CONCAT('user_', id, '@staging.local'),
  name = CONCAT('User ', id),
  phone = CONCAT('555-', LPAD(id::text, 4, '0'));

-- Anonymize sensitive data
UPDATE customers SET
  ssn = '***-**-****',
  credit_card = '****-****-****-****';

-- Keep admin accounts intact (for testing)
UPDATE users SET active = true WHERE role = 'admin';
EOF
```

## Environment Variable Sync

```bash
# === Using dotenvx ===
# Install
npm install -g @dotenvx/dotenvx

# Pull encrypted vars
dotenvx run --env-file .env.staging

# Sync structure (not values)
dotenvx list --env-file .env.dev > .env.staging.structure
dotenvx list --env-file .env.prod > .env.staging.structure

# Fill in staging values manually
```

```yaml
# .env.example (commit to git)
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database (per-environment)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_URL=redis://localhost:6379

# Feature flags
FEATURE_NEW_DASHBOARD=false
FEATURE_BETA_API=false

# External services (per-environment)
STRIPE_SECRET_KEY=sk_xxx
SENDGRID_API_KEY=SG.xxx
```

## Kustomize Environment Sync

```yaml
# k8s/base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml

commonLabels:
  app: myapp
```

```yaml
# k8s/overlays/dev/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base

namePrefix: dev-

configMapGenerator:
- name: app-config
  literals:
  - ENV=development
  - LOG_LEVEL=debug
  - REPLICAS=1
```

```yaml
# k8s/overlays/staging/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base

namePrefix: staging-

configMapGenerator:
- name: app-config
  literals:
  - ENV=staging
  - LOG_LEVEL=info
  - REPLICAS=2
```

```yaml
# k8s/overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base

namePrefix: prod-

configMapGenerator:
- name: app-config
  literals:
  - ENV=production
  - LOG_LEVEL=warn
  - REPLICAS=5

patches:
  - replica-count.yaml
```

```bash
# Apply environment
kubectl apply -k k8s/overlays/staging
```

## Sync Script

```bash
#!/bin/bash
# sync-environment.sh

set -e

SOURCE="${1:-dev}"
TARGET="${2:-staging}"
SERVICE="${3:-app}"

echo "🔄 Environment Sync"
echo "Source: $SOURCE"
echo "Target: $TARGET"
echo "Service: $SERVICE"
echo "Time: $(date)"

# Validate environments
if [[ ! "$SOURCE" =~ ^(dev|staging|prod|production)$ ]]; then
  echo "❌ Invalid source: $SOURCE"
  exit 1
fi

if [[ ! "$TARGET" =~ ^(dev|staging|prod|production)$ ]]; then
  echo "❌ Invalid target: $TARGET"
  exit 1
fi

# Safety check for prod
if [[ "$TARGET" == "prod" || "$TARGET" == "production" ]]; then
  echo "⚠️  WARNING: Syncing to PRODUCTION!"
  read -p "Type 'confirm' to proceed: " confirm
  if [[ "$confirm" != "confirm" ]]; then
    echo "❌ Aborted"
    exit 1
  fi
fi

# Sync ConfigMap
echo ""
echo "=== Syncing ConfigMap ==="
kubectl get configmap ${SERVICE}-config -n $SOURCE -o yaml \
  | sed "s/namespace: $SOURCE/namespace: $TARGET/g" \
  | sed '/resourceVersion/d' \
  | sed '/uid/d' \
  | sed '/creationTimestamp/d' \
  | kubectl apply -f - -n $TARGET

# Sync Secrets (structure only)
echo ""
echo "=== Syncing Secret Structure ==="
echo "Note: Secret values NOT synced - recreate manually"
kubectl get secrets -n $SOURCE -o jsonpath='{.items[*].metadata.name}' \
  | tr ' ' '\n' | while read secret; do
  echo "Secret $secret exists in $SOURCE - recreate in $TARGET"
done

# Sync Database Schema (if applicable)
echo ""
echo "=== Syncing Database Schema ==="
# Implementation depends on your DB tooling

echo ""
echo "✅ Sync Complete!"
echo "Verify with: kubectl get all -n $TARGET"
```

## Verification

```bash
# === Post-Sync Verification ===
# 1. Check ConfigMap
kubectl get configmap app-config -n staging -o jsonpath='{.data}' | jq .

# 2. Check pods using new config
kubectl rollout restart deployment/app -n staging
kubectl wait --for=condition=ready pods -l app=app -n staging --timeout=120s

# 3. Smoke test
STAGING_URL="https://staging.agencyos.network"
curl -sI "$STAGING_URL" | head -3
curl -s "$STAGING_URL/api/health" | jq .

# 4. Compare environments
diff <(kubectl get configmap app-config -n dev -o yaml) \
     <(kubectl get configmap app-config -n staging -o yaml)
```

## Related Commands

- `/deploy` — Deployment orchestration
- `/rollback` — Rollback procedures
- `/blue-green` — Blue-green deployment switching
- `/canary` — Canary deployment management
- `/health-check` — System health monitoring
