---
description: 🦀 Canary Deployment — Traffic Shifting, Gradual Rollout, Metrics-Based
argument-hint: [service] [traffic-%: 10|25|50|100]
---

**Think harder** để canary deploy: <service>$ARGUMENTS</service>

**IMPORTANT:** Metrics PHẢI xanh trước khi tăng traffic — error rate < 1%, latency p99 < 500ms.

## Canary Phases

| Phase | Traffic % | Duration | Success Criteria | Go/No-Go |
|-------|-----------|----------|------------------|----------|
| 1 | 10% | 5-10 min | Error rate < 1%, p99 < 500ms | ✅ Go |
| 2 | 25% | 10-15 min | Error rate < 1%, p99 < 400ms | ✅ Go |
| 3 | 50% | 15-30 min | Error rate < 0.5%, p99 < 300ms | ✅ Go |
| 4 | 100% | Complete | Full rollout | ✅ Done |

## Pre-Canary Checklist

```bash
# 1. Canary deployment ready
kubectl get deployment app-canary
kubectl get pods -l app=app,track=canary

# 2. Metrics dashboard ready
open https://grafana.agencyos.network/d/canary-metrics

# 3. Alert rules configured
kubectl get prometheusrule canary-alerts

# 4. Rollback plan ready
echo "Rollback: kubectl rollout undo deployment/app-canary"
```

## Istio Service Mesh Canary

```bash
# === Step 1: Deploy Canary ===
# 1. Apply canary deployment
kubectl apply -f k8s/canary/deployment.yaml
kubectl apply -f k8s/canary/service.yaml

# 2. Wait for ready
kubectl wait --for=condition=available deployment/app-canary --timeout=120s

# 3. Verify pods
kubectl get pods -l app=app,track=canary
```

```yaml
# k8s/canary/virtual-service-10.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: app-canary
spec:
  hosts:
  - app.agencyos.network
  http:
  - route:
    - destination:
        host: app-stable
        subset: v1
      weight: 90
    - destination:
        host: app-canary
        subset: v2
      weight: 10
    timeout: 30s
    retries:
      attempts: 3
      perTryTimeout: 10s
```

```bash
# === Step 2: Apply 10% Traffic ===
kubectl apply -f k8s/canary/virtual-service-10.yaml

# Verify traffic split
istioctl analyze
```

```bash
# === Step 3: Monitor Metrics (5-10 min) ===
# Error rate
curl -s "http://prometheus:9090/api/v1/query?query=rate(istio_requests_total{destination_service='app-canary',response_code!~'5.*'}[5m])" \
  | jq '.data.result[0].value[1]'

# Latency p99
curl -s "http://prometheus:9090/api/v1/query?query=histogram_quantile(0.99,rate(istio_request_duration_milliseconds_bucket{destination_service='app-canary'}[5m]))" \
  | jq '.data.result[0].value[1]'

# Success rate
curl -s "http://prometheus:9090/api/v1/query?query=sum(rate(istio_requests_total{destination_service='app-canary',response_code!~'5.*'}[5m]))/sum(rate(istio_requests_total{destination_service='app-canary'}[5m]))*100" \
  | jq '.data.result[0].value[1]'

# Grafana dashboard
open https://grafana.agencyos.network/d/canary-metrics
```

```bash
# === Step 4: Increase to 25% ===
kubectl apply -f k8s/canary/virtual-service-25.yaml

# Wait and monitor
sleep 600  # 10 minutes
```

```yaml
# k8s/canary/virtual-service-25.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: app-canary
spec:
  hosts:
  - app.agencyos.network
  http:
  - route:
    - destination:
        host: app-stable
        subset: v1
      weight: 75
    - destination:
        host: app-canary
        subset: v2
      weight: 25
```

```bash
# === Step 5: Increase to 50% ===
kubectl apply -f k8s/canary/virtual-service-50.yaml

# Monitor closely
watch kubectl top pods -l app=app,track=canary
```

```bash
# === Step 6: Full Rollout (100%) ===
kubectl apply -f k8s/canary/virtual-service-100.yaml

# Promote canary to stable
kubectl label deployment/app-canary track=stable --overwrite
kubectl set image deployment/app-stable app=agencyos/app:v2.0.0

# Clean up old canary
kubectl delete deployment/app-canary
```

## NGINX Ingress Canary

```bash
# === NGINX Canary Annotations ===
# 1. Deploy canary service
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-canary
spec:
  replicas: 1
  selector:
    matchLabels:
      app: app
      track: canary
  template:
    metadata:
      labels:
        app: app
        track: canary
    spec:
      containers:
      - name: app
        image: agencyos/app:v2.0.0
        ports:
        - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: app-canary
spec:
  selector:
    app: app
    track: canary
  ports:
  - port: 80
    targetPort: 3000
EOF

# 2. Create canary ingress
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-canary
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"
spec:
  rules:
  - host: app.agencyos.network
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-canary
            port:
              number: 80
EOF
```

## Flagger + Prometheus Canary

```yaml
# k8s/canary/flagger.yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: app
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app
  progressionSchedule: "linear"
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
    - name: request-duration
      thresholdRange:
        max: 500
      interval: 1m
    webhooks:
    - name: conformance-test
      type: pre-rollout
      url: http://flagger-loadtester.flagger/
      timeout: 15s
      metadata:
        type: "bash"
        cmd: "curl -sI http://app-canary/health | grep 200"
  alert:
    name: "Slack"
    providerRef:
      name: slack
    channel: "#deployments"
```

```bash
# Deploy Flagger
helm upgrade -i flagger flagger \
  --namespace flagger-system \
  --repo https://flagger.app \
  --set prometheus.install=false \
  --set meshProvider=istio

# Apply canary
kubectl apply -f k8s/canary/flagger.yaml

# Monitor progression
watch kubectl describe canary app
```

## Manual Traffic Shifting Script

```bash
#!/bin/bash
# canary-rollout.sh

set -e

SERVICE="${1:-app}"
CANARY_VERSION="${2:-v2.0.0}"
STEPS="10 25 50 100"
MONITOR_DURATION=300  # 5 minutes per step

echo "🦀 Starting Canary Rollout"
echo "Service: $SERVICE"
echo "Version: $CANARY_VERSION"
echo "Date: $(date)"

for PERCENT in $STEPS; do
  echo ""
  echo "=== Phase: ${PERCENT}% Traffic ==="

  # Apply traffic split
  echo "Applying ${PERCENT}% traffic to canary..."
  cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ${SERVICE}-canary
spec:
  hosts:
  - ${SERVICE}.agencyos.network
  http:
  - route:
    - destination:
        host: ${SERVICE}-stable
        subset: v1
      weight: $((100 - PERCENT))
    - destination:
        host: ${SERVICE}-canary
        subset: v2
      weight: ${PERCENT}
EOF

  # Monitor
  echo "Monitoring for ${MONITOR_DURATION}s..."
  for i in $(seq 1 $((MONITOR_DURATION / 30))); do
    ERROR_RATE=$(curl -s "http://prometheus:9090/api/v1/query?query=sum(rate(istio_requests_total{destination_service='${SERVICE}-canary',response_code~'5.*'}[1m]))/sum(rate(istio_requests_total{destination_service='${SERVICE}-canary'}[1m]))*100" \
      | jq -r '.data.result[0].value[1] // 0')

    LATENCY_P99=$(curl -s "http://prometheus:9090/api/v1/query?query=histogram_quantile(0.99,rate(istio_request_duration_milliseconds_bucket{destination_service='${SERVICE}-canary'}[1m]))" \
      | jq -r '.data.result[0].value[1] // 0')

    echo "  [$((i * 30))s] Error: ${ERROR_RATE}% | p99: ${LATENCY_P99}ms"

    # Check thresholds
    if (( $(echo "$ERROR_RATE > 1" | bc -l) )); then
      echo "❌ Error rate > 1% - ABORTING"
      kubectl rollout undo deployment/${SERVICE}-canary
      exit 1
    fi

    if (( $(echo "$LATENCY_P99 > 500" | bc -l) )); then
      echo "❌ Latency p99 > 500ms - ABORTING"
      kubectl rollout undo deployment/${SERVICE}-canary
      exit 1
    fi

    sleep 30
  done

  echo "✅ Phase ${PERCENT}% PASSED"
done

echo ""
echo "🎉 Canary Rollout Complete!"
echo "Full traffic shifted to $CANARY_VERSION"
```

## Rollback Triggers

```yaml
# AlertManager canary rollback rules
groups:
- name: canary-alerts
  rules:
  - alert: CanaryHighErrorRate
    expr: |
      sum(rate(istio_requests_total{track="canary",response_code~"5.*"}[5m]))
      / sum(rate(istio_requests_total{track="canary"}[5m])) * 100 > 1
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Canary error rate > 1%"
      action: "kubectl rollout undo deployment/app-canary"

  - alert: CanaryHighLatency
    expr: |
      histogram_quantile(0.99, rate(istio_request_duration_milliseconds_bucket{track="canary"}[5m])) > 500
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Canary p99 latency > 500ms"
      action: "Consider rollback"
```

## Related Commands

- `/deploy` — Deployment orchestration
- `/rollback` — Rollback procedures
- `/blue-green` — Blue-green deployment switching
- `/environment-sync` — Environment synchronization
- `/monitor` — Metrics & APM dashboard
- `/alert` — Alert configuration
