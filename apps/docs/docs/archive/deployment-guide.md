# Deployment Guide

**Project:** Mekong Marketing Documentation
**Version:** 1.0
**Last Updated:** 2025-10-18
**Target Environment:** Production (Kubernetes)

---

## Overview

This guide covers deploying Mekong Marketing Documentation to production using Docker and Kubernetes. The deployment process includes building containerized images, configuring Kubernetes resources, and setting up SSL certificates.

**Deployment Architecture:**
- **Container Runtime:** Docker
- **Orchestration:** Kubernetes v1.24+
- **Load Balancer:** nginx-ingress-controller
- **SSL/TLS:** cert-manager + Let's Encrypt
- **Registry:** GitHub Container Registry (GHCR)

---

## Prerequisites

### Required Tools

1. **Docker** (v20.10+)
   ```bash
   docker --version
   ```

2. **kubectl** (v1.24+)
   ```bash
   kubectl version --client
   ```

3. **Git**
   ```bash
   git --version
   ```

### Required Access

1. **GitHub Account** - For container registry
2. **GitHub Personal Access Token** - With `write:packages` scope
3. **Kubernetes Cluster** - With admin access
4. **Domain Name** - DNS configured to point to cluster

### Kubernetes Cluster Requirements

**Minimum Specifications:**
- Kubernetes version: 1.24+
- Nodes: 2+ (for high availability)
- CPU: 2+ cores total
- Memory: 4GB+ total
- Storage: 10GB+ available

**Required Add-ons:**
- nginx-ingress-controller
- cert-manager (for SSL certificates)

---

## Part 1: Local Development

### 1.1 Clone Repository

```bash
git clone https://github.com/mekong/mekong-docs.git
cd mekong-docs
```

### 1.2 Install Dependencies

```bash
npm install
```

### 1.3 Run Development Server

```bash
npm run dev
```

Visit http://localhost:4321

### 1.4 Build for Production

```bash
npm run build
```

Output in `dist/` directory

### 1.5 Preview Production Build

```bash
npm run preview
```

Visit http://localhost:4321

---

## Part 2: Docker Deployment

### 2.1 Build Docker Image

```bash
# Build image
docker build -t mekong-docs:local .

# Verify image
docker images | grep mekong-docs
```

### 2.2 Run Container Locally

```bash
# Run container
docker run -d \
  --name mekong-docs \
  -p 3000:3000 \
  mekong-docs:local

# Check logs
docker logs mekong-docs

# Test
curl http://localhost:3000
```

### 2.3 Stop and Remove Container

```bash
docker stop mekong-docs
docker rm mekong-docs
```

---

## Part 3: GitHub Container Registry

### 3.1 Create Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" (classic)
3. Select scopes:
   - `write:packages`
   - `read:packages`
   - `delete:packages` (optional)
4. Generate token and copy it

### 3.2 Login to GHCR

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 3.3 Tag and Push Image

```bash
# Tag image for GHCR
docker tag mekong-docs:local ghcr.io/mekong/mekong-docs:latest
docker tag mekong-docs:local ghcr.io/mekong/mekong-docs:v1.0.0

# Push images
docker push ghcr.io/mekong/mekong-docs:latest
docker push ghcr.io/mekong/mekong-docs:v1.0.0
```

### 3.4 Verify Push

1. Go to https://github.com/orgs/mekong/packages
2. Find `mekong-docs` package
3. Verify tags exist: `latest`, `v1.0.0`

---

## Part 4: Kubernetes Setup

### 4.1 Install nginx-ingress-controller

**Using Helm:**

```bash
# Add Helm repository
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install nginx-ingress
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer
```

**Verify Installation:**

```bash
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

### 4.2 Install cert-manager

**Using kubectl:**

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Verify installation
kubectl get pods -n cert-manager
```

**Create ClusterIssuer for Let's Encrypt:**

```bash
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@mekongmarketing.com  # Change to your email
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

**Verify ClusterIssuer:**

```bash
kubectl get clusterissuer letsencrypt-prod
```

### 4.3 Create Image Pull Secret

```bash
# Create secret for GitHub Container Registry
kubectl create secret docker-registry github-registry \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN \
  --docker-email=YOUR_EMAIL

# Verify secret
kubectl get secret github-registry
```

---

## Part 5: Deploy to Kubernetes

### 5.1 Review Kubernetes Manifests

**Files in `k8s/` directory:**

1. **configmap.yaml** - Environment variables
2. **deployment.yaml** - Pod specification
3. **service.yaml** - ClusterIP service
4. **ingress.yaml** - External access + TLS

### 5.2 Deploy All Resources

```bash
# Apply all manifests at once
kubectl apply -f k8s/

# Or apply individually
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### 5.3 Verify Deployment

**Check Pods:**

```bash
# List pods
kubectl get pods -l app=mekong-docs

# Expected output:
# NAME                              READY   STATUS    RESTARTS   AGE
# mekong-docs-xxxxxxxxx-xxxxx    1/1     Running   0          30s
# mekong-docs-xxxxxxxxx-xxxxx    1/1     Running   0          30s
```

**Check Deployment:**

```bash
kubectl get deployment mekong-docs

# Expected output:
# NAME             READY   UP-TO-DATE   AVAILABLE   AGE
# mekong-docs   2/2     2            2           1m
```

**Check Service:**

```bash
kubectl get svc mekong-docs

# Expected output:
# NAME             TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
# mekong-docs   ClusterIP   10.96.xxx.xxx   <none>        80/TCP    1m
```

**Check Ingress:**

```bash
kubectl get ingress mekong-docs

# Expected output:
# NAME             CLASS   HOSTS                 ADDRESS         PORTS     AGE
# mekong-docs   nginx   docs.mekongmarketing.com     x.x.x.x         80, 443   1m
```

**Check Certificate:**

```bash
kubectl get certificate mekong-docs-tls

# Expected output:
# NAME                   READY   SECRET                 AGE
# mekong-docs-tls     True    mekong-docs-tls     2m
```

### 5.4 View Logs

```bash
# Stream logs from all pods
kubectl logs -l app=mekong-docs --follow

# Logs from specific pod
kubectl logs mekong-docs-xxxxxxxxx-xxxxx

# Previous logs (if pod restarted)
kubectl logs mekong-docs-xxxxxxxxx-xxxxx --previous
```

### 5.5 Describe Resources (Troubleshooting)

```bash
# Describe pod (shows events)
kubectl describe pod mekong-docs-xxxxxxxxx-xxxxx

# Describe deployment
kubectl describe deployment mekong-docs

# Describe ingress
kubectl describe ingress mekong-docs

# Describe certificate
kubectl describe certificate mekong-docs-tls
```

---

## Part 6: DNS Configuration

### 6.1 Get Ingress External IP

```bash
kubectl get svc -n ingress-nginx nginx-ingress-ingress-nginx-controller

# Note the EXTERNAL-IP
```

### 6.2 Update DNS Records

**Create A Record:**

```
Type: A
Name: docs
Value: <EXTERNAL-IP from above>
TTL: 300 (or your preferred value)
```

**Example (CloudFlare, Namecheap, etc.):**

```
docs.mekongmarketing.com → 203.0.113.10
```

### 6.3 Verify DNS Propagation

```bash
# Check DNS resolution
nslookup docs.mekongmarketing.com

# Or use dig
dig docs.mekongmarketing.com +short
```

### 6.4 Test HTTPS

```bash
# Test HTTP (should redirect to HTTPS)
curl -I http://docs.mekongmarketing.com

# Test HTTPS
curl -I https://docs.mekongmarketing.com

# Or visit in browser
open https://docs.mekongmarketing.com
```

---

## Part 7: Updates and Rollouts

### 7.1 Update Application Code

```bash
# 1. Make changes to code
git pull origin main

# 2. Build and push new image
docker build -t ghcr.io/mekong/mekong-docs:v1.0.1 .
docker push ghcr.io/mekong/mekong-docs:v1.0.1

# 3. Update deployment
kubectl set image deployment/mekong-docs \
  mekong-docs=ghcr.io/mekong/mekong-docs:v1.0.1

# 4. Check rollout status
kubectl rollout status deployment/mekong-docs
```

### 7.2 Rollback Deployment

```bash
# View rollout history
kubectl rollout history deployment/mekong-docs

# Rollback to previous version
kubectl rollout undo deployment/mekong-docs

# Rollback to specific revision
kubectl rollout undo deployment/mekong-docs --to-revision=2
```

### 7.3 Zero-Downtime Rolling Update

**Current configuration ensures:**
- New pods are created before old pods are terminated
- Readiness probes verify new pods are healthy
- Traffic only routed to healthy pods

**Monitor rolling update:**

```bash
# Watch pod status during update
kubectl get pods -l app=mekong-docs --watch
```

---

## Part 8: Scaling

### 8.1 Manual Scaling

```bash
# Scale to 5 replicas
kubectl scale deployment mekong-docs --replicas=5

# Verify scaling
kubectl get pods -l app=mekong-docs
```

### 8.2 Horizontal Pod Autoscaling (HPA)

**Create HPA:**

```bash
kubectl autoscale deployment mekong-docs \
  --cpu-percent=70 \
  --min=2 \
  --max=10

# Verify HPA
kubectl get hpa
```

**HPA Configuration (YAML):**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mekong-docs-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mekong-docs
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

## Part 9: Monitoring

### 9.1 Resource Usage

```bash
# Pod resource usage
kubectl top pods -l app=mekong-docs

# Node resource usage
kubectl top nodes
```

### 9.2 Health Checks

```bash
# Port-forward for local testing
kubectl port-forward svc/mekong-docs 8080:80

# Test health endpoint
curl http://localhost:8080
```

### 9.3 Event Monitoring

```bash
# Watch events in real-time
kubectl get events --watch

# Filter events for deployment
kubectl get events --field-selector involvedObject.name=mekong-docs
```

---

## Part 10: Troubleshooting

### 10.1 Pods Not Starting

**Symptoms:** Pods stuck in `Pending`, `CrashLoopBackOff`, or `Error` state

**Diagnosis:**

```bash
# Check pod status
kubectl get pods -l app=mekong-docs

# Describe pod for events
kubectl describe pod mekong-docs-xxxxxxxxx-xxxxx

# Check logs
kubectl logs mekong-docs-xxxxxxxxx-xxxxx
```

**Common Causes:**
- **ImagePullBackOff:** Invalid image or registry credentials
  ```bash
  kubectl get secret github-registry -o yaml
  ```

- **Insufficient Resources:** Not enough CPU/memory
  ```bash
  kubectl describe nodes
  ```

- **Failed Health Checks:** Liveness/readiness probes failing
  ```bash
  kubectl logs mekong-docs-xxxxxxxxx-xxxxx
  ```

### 10.2 Ingress Not Working

**Symptoms:** Cannot access site via domain

**Diagnosis:**

```bash
# Check ingress
kubectl get ingress mekong-docs
kubectl describe ingress mekong-docs

# Check nginx-ingress logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

**Common Causes:**
- **DNS Not Propagated:** Wait up to 48 hours
  ```bash
  nslookup docs.mekongmarketing.com
  ```

- **Ingress Class Mismatch:** Verify `ingressClassName: nginx`
- **Port Mismatch:** Ensure service port matches ingress backend port

### 10.3 SSL Certificate Issues

**Symptoms:** Certificate not issued, browser shows "Not Secure"

**Diagnosis:**

```bash
# Check certificate
kubectl get certificate mekong-docs-tls
kubectl describe certificate mekong-docs-tls

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager

# Check certificate request
kubectl get certificaterequest
kubectl describe certificaterequest mekong-docs-tls-xxxxx
```

**Common Causes:**
- **DNS Not Configured:** cert-manager cannot verify domain ownership
- **Rate Limiting:** Let's Encrypt has rate limits (50 certs/week per domain)
- **Firewall:** Port 80 must be accessible for HTTP-01 challenge

### 10.4 Performance Issues

**Symptoms:** Slow response times, high latency

**Diagnosis:**

```bash
# Check resource usage
kubectl top pods -l app=mekong-docs
kubectl top nodes

# Check HPA status
kubectl get hpa

# Check pod events
kubectl describe pod mekong-docs-xxxxxxxxx-xxxxx
```

**Solutions:**
- **Scale Up:** Increase replicas manually or via HPA
  ```bash
  kubectl scale deployment mekong-docs --replicas=5
  ```

- **Increase Resources:** Update `deployment.yaml` limits
  ```yaml
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 1Gi
  ```

---

## Part 11: Backup and Disaster Recovery

### 11.1 Backup Strategy

**What to Backup:**
1. **Source Code:** Already in Git repository (primary backup)
2. **Configuration:** Kubernetes manifests in `k8s/` directory
3. **Secrets:** Document secret creation commands (do NOT commit secrets)

**No Database Backups Needed:**
- Stateless architecture (no persistent data)
- All content in Git repository
- Can rebuild from source at any time

### 11.2 Disaster Recovery Steps

**Scenario: Complete Cluster Failure**

1. **Provision New Cluster:**
   ```bash
   # Use cloud provider CLI or UI to create new K8s cluster
   ```

2. **Configure kubectl:**
   ```bash
   # Point kubectl to new cluster
   kubectl config use-context new-cluster
   ```

3. **Install Dependencies:**
   ```bash
   # Install nginx-ingress
   helm install nginx-ingress ingress-nginx/ingress-nginx

   # Install cert-manager
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

4. **Restore Application:**
   ```bash
   # Clone repository
   git clone https://github.com/mekong/mekong-docs.git
   cd mekong-docs

   # Recreate secrets
   kubectl create secret docker-registry github-registry \
     --docker-server=ghcr.io \
     --docker-username=... \
     --docker-password=...

   # Deploy application
   kubectl apply -f k8s/
   ```

5. **Update DNS:**
   ```bash
   # Point domain to new ingress IP
   kubectl get svc -n ingress-nginx
   ```

**Recovery Time Objective (RTO):** ~30 minutes
**Recovery Point Objective (RPO):** 0 (no data loss, all in Git)

---

## Part 12: CI/CD Integration (Future)

### 12.1 GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Kubernetes

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Login to GHCR
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            ghcr.io/mekong/mekong-docs:latest
            ghcr.io/mekong/mekong-docs:${{ github.sha }}

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG }}

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/mekong-docs \
            mekong-docs=ghcr.io/mekong/mekong-docs:${{ github.sha }}
          kubectl rollout status deployment/mekong-docs
```

### 12.2 Required Secrets

**Add to GitHub repository settings → Secrets:**

1. **KUBE_CONFIG** - Base64-encoded kubeconfig file
   ```bash
   cat ~/.kube/config | base64
   ```

### 12.3 Trigger Deployment

```bash
# Commit and push to main branch
git add .
git commit -m "feat: add new feature"
git push origin main

# GitHub Actions automatically builds and deploys
```

---

## Part 13: Security Hardening

### 13.1 Network Policies

**Restrict pod-to-pod communication:**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: mekong-docs-netpol
spec:
  podSelector:
    matchLabels:
      app: mekong-docs
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000
```

### 13.2 Pod Security Standards

**Add security context to deployment:**

```yaml
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
        - name: mekong-docs
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
```

### 13.3 Resource Quotas

**Limit resource consumption:**

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: mekong-docs-quota
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 2Gi
    limits.cpu: "4"
    limits.memory: 4Gi
    persistentvolumeclaims: "0"
```

---

## Conclusion

You now have a production-ready Mekong Marketing Documentation deployment on Kubernetes with:

- ✅ Containerized application (Docker)
- ✅ Orchestrated deployment (Kubernetes)
- ✅ Load balancing (nginx-ingress)
- ✅ SSL/TLS certificates (Let's Encrypt)
- ✅ High availability (2 replicas)
- ✅ Health checks (liveness/readiness)
- ✅ Zero-downtime updates (rolling deployment)
- ✅ Horizontal scaling (manual/HPA)

**Next Steps:**
1. Set up monitoring (Prometheus + Grafana)
2. Configure logging (Loki + Grafana)
3. Implement CI/CD (GitHub Actions)
4. Add performance monitoring (APM)
5. Set up alerts (PagerDuty, Slack)

**Support:**
- Documentation: [System Architecture](./system-architecture.md)
- Kubernetes Docs: https://kubernetes.io/docs/
- nginx-ingress: https://kubernetes.github.io/ingress-nginx/
- cert-manager: https://cert-manager.io/docs/

---

*Last updated: 2025-10-18*
*Review this guide when deploying updates or troubleshooting production issues.*
