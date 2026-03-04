---
description: 🔵 Blue-Green Deployment — Zero-Downtime Switching, Instant Rollback
argument-hint: [service] [action: switch|verify|cleanup]
---

**Think harder** để blue-green deploy: <service>$ARGUMENTS</service>

**IMPORTANT:** Zero-downtime yêu cầu 2 môi trường song song — switch instant khi green healthy.

## Blue-Green Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                        │
│              (ALB / NGINX / Istio GW)                   │
└─────────────────────┬───────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   Blue (v1)     │     │   Green (v2)    │
│   - Active ✅   │     │   - Standby     │
│   - 100% traffic│     │   - 0% traffic  │
│   - 3 pods      │     │   - 3 pods      │
└─────────────────┘     └─────────────────┘
```

## Switch States

| State | Blue | Green | Traffic | Action |
|-------|------|-------|---------|--------|
| Initial | v1 ✅ | v1 | 100% → Blue | Deploy to Green |
| Ready | v1 ✅ | v2 ✅ | 100% → Blue | Verify Green |
| Switching | v1 ✅ | v2 ✅ | 100% → Green | Update LB |
| Complete | v1 | v2 ✅ | 100% → Green | Cleanup Blue |

## Pre-Switch Checklist

```bash
# 1. Both environments running
kubectl get deployments | grep -E "app-(blue|green)"

# 2. Green healthy
curl -sI http://app-green/health | head -3

# 3. Tests passed on Green
kubectl exec -it deployment/app-green -- npm test

# 4. Database migrations applied
kubectl exec -it deployment/app-green -- npx prisma migrate deploy
```

## Kubernetes Blue-Green

```bash
# === Step 1: Deploy Green ===
# 1. Scale up Green (new version)
kubectl scale deployment/app-green --replicas=3
kubectl set image deployment/app-green app=agencyos/app:v2.0.0

# 2. Wait for ready
kubectl wait --for=condition=available deployment/app-green --timeout=180s

# 3. Verify Green pods
kubectl get pods -l app=app,track=green -w
```

```yaml
# k8s/blue-green/green-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-green
  labels:
    app: app
    track: green
    version: v2.0.0
spec:
  replicas: 3
  selector:
    matchLabels:
      app: app
      track: green
  template:
    metadata:
      labels:
        app: app
        track: green
    spec:
      containers:
      - name: app
        image: agencyos/app:v2.0.0
        ports:
        - containerPort: 3000
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 20
```

```bash
# === Step 2: Verify Green ===
# Health check
for i in {1..10}; do
  echo "Check $i:"
  curl -s http://app-green:3000/health | jq .
  sleep 2
done

# Load test (optional)
kubectl run load-test --image=loadimpact/loadk6 --rm -it --restart=Never \
  -- k6 run - <<EOF
import http from 'k6/http';
export let options = { vus: 10, duration: '30s' };
export default function() {
  http.get('http://app-green:3000/');
}
EOF
```

```bash
# === Step 3: Switch Traffic ===
# Update service selector to Green
kubectl patch service app -p '{"spec":{"selector":{"track":"green"}}}'

# Or update ingress
kubectl patch ingress app -p '{"spec":{"rules":[{"http":{"paths":[{"backend":{"service":{"name":"app-green"}}}]}}]}}'

# Verify switch
kubectl get service app -o jsonpath='{.spec.selector.track}'
echo "Traffic now going to: $(kubectl get service app -o jsonpath='{.spec.selector.track}')"
```

```yaml
# k8s/blue-green/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: app
spec:
  selector:
    app: app
    track: green  # Switch from 'blue' to 'green'
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

```bash
# === Step 4: Post-Switch Verification ===
# 1. Check production
PROD_URL="https://app.agencyos.network"
curl -sI "$PROD_URL" | head -3

# 2. Health endpoint
curl -s "$PROD_URL/api/health" | jq .

# 3. Functional tests
curl -s "$PROD_URL/api/v1/users" | jq '.[0]'

# 4. Error check
kubectl logs -l app=app,track=green --tail=100 | grep -i error | wc -l
```

```bash
# === Step 5: Cleanup Blue ===
# Scale down Blue (keep for quick rollback)
kubectl scale deployment/app-blue --replicas=0

# Or delete after 24h confirmation
kubectl delete deployment app-blue
kubectl delete service app-blue
```

## AWS ALB Blue-Green

```bash
# === Step 1: Create Green Target Group ===
aws elbv2 create-target-group \
  --name app-green-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --health-check-path /health \
  --health-check-interval-seconds 10 \
  --healthy-threshold-count 2

# Get target group ARN
GREEN_TG_ARN=$(aws elbv2 describe-target-groups \
  --names app-green-tg \
  --query 'TargetGroups[0].TargetGroupArn' --output text)
```

```bash
# === Step 2: Register Green Instances ===
# Get instance IDs
INSTANCE_IDS=$(aws ecs list-tasks --cluster production --service-name app-green \
  --query 'taskArns[*]' --output text)

# Register to target group
aws elbv2 register-targets \
  --target-group-arn $GREEN_TG_ARN \
  --targets Id=$INSTANCE_IDS
```

```bash
# === Step 3: Wait for Healthy ===
aws elbv2 wait target-healthy \
  --target-group-arn $GREEN_TG_ARN

# Verify health
aws elbv2 describe-target-health \
  --target-group-arn $GREEN_TG_ARN
```

```bash
# === Step 4: Switch Listener ===
# Get current listener
LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:xxx:loadbalancer/app/alb/xxx \
  --query 'Listeners[0].ListenerArn' --output text)

# Update to Green
aws elbv2 modify-listener \
  --listener-arn $LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=$GREEN_TG_ARN
```

```bash
# === Step 5: Verify Switch ===
curl -sI https://app.agencyos.network | head -3

# Check target group
aws elbv2 describe-target-health \
  --target-group-arn $GREEN_TG_ARN
```

## Istio Blue-Green

```yaml
# k8s/blue-green/virtual-service.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: app
spec:
  hosts:
  - app.agencyos.network
  http:
  - route:
    - destination:
        host: app
        subset: green  # Switch from 'blue' to 'green'
    weight: 100
```

```bash
# Apply switch
kubectl apply -f k8s/blue-green/virtual-service.yaml

# Verify
istioctl analyze
```

## Blue-Green Switch Script

```bash
#!/bin/bash
# blue-green-switch.sh

set -e

SERVICE="${1:-app}"
NEW_VERSION="${2:-v2.0.0}"
ENVIRONMENT="${3:-production}"

echo "🔵🟢 Blue-Green Deployment Switch"
echo "Service: $SERVICE"
echo "New Version: $NEW_VERSION"
echo "Environment: $ENVIRONMENT"
echo "Time: $(date)"

# Determine current active
ACTIVE=$(kubectl get service $SERVICE -o jsonpath='{.spec.selector.track}')
INACTIVE=$([ "$ACTIVE" = "blue" ] && echo "green" || echo "blue")

echo ""
echo "Current Active: $ACTIVE"
echo "Target (Inactive): $INACTIVE → $NEW_VERSION"

# Step 1: Update inactive to new version
echo ""
echo "=== Step 1: Deploy $NEW_VERSION to $INACTIVE ==="
kubectl set image deployment/${SERVICE}-${INACTIVE} app=agencyos/app:$NEW_VERSION
kubectl rollout status deployment/${SERVICE}-${INACTIVE} --timeout=180s

# Step 2: Verify new version
echo ""
echo "=== Step 2: Verifying $INACTIVE ==="
for i in {1..5}; do
  echo "Health check $i:"
  kubectl exec -it deployment/${SERVICE}-${INACTIVE} -- curl -s localhost:3000/health | jq .
  sleep 2
done

# Step 3: Switch traffic
echo ""
echo "=== Step 3: Switching Traffic ==="
kubectl patch service $SERVICE -p "{\"spec\":{\"selector\":{\"track\":\"$INACTIVE\"}}}"
echo "Traffic switched to: $INACTIVE"

# Step 4: Verify production
echo ""
echo "=== Step 4: Production Verification ==="
sleep 5  # Wait for LB to update
curl -sI https://${SERVICE}.agencyos.network | head -3

# Step 5: Scale down old
echo ""
echo "=== Step 5: Scaling Down $ACTIVE ==="
kubectl scale deployment/${SERVICE}-${ACTIVE} --replicas=0

echo ""
echo "🎉 Blue-Green Switch Complete!"
echo "Active: $INACTIVE ($NEW_VERSION)"
echo "Standby: $ACTIVE (scaled down)"
```

## Rollback (Instant Switch Back)

```bash
# Emergency rollback to Blue
kubectl patch service app -p '{"spec":{"selector":{"track":"blue"}}}'

# Verify
kubectl get service app -o jsonpath='{.spec.selector.track}'
```

## Related Commands

- `/deploy` — Deployment orchestration
- `/rollback` — Rollback procedures
- `/canary` — Canary deployment management
- `/environment-sync` — Environment synchronization
- `/health-check` — System health monitoring
