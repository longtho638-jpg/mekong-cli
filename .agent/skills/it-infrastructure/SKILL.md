---
name: it-infrastructure
description: Cloud management, server ops, networking, monitoring, IAM, observability. Use for infrastructure provisioning, security hardening, incident response, capacity planning.
license: MIT
version: 1.0.0
---

# IT Infrastructure Skill

Manage cloud infrastructure, monitoring, security, and operations with modern DevOps and SRE practices.

## When to Use

- Cloud infrastructure provisioning (AWS, GCP, Azure)
- Server management and configuration
- Network architecture and security
- Monitoring, alerting, and observability setup
- Identity and Access Management (IAM)
- Incident response and on-call management
- Capacity planning and cost optimization
- Disaster recovery and backup strategy
- SSL/TLS certificate management
- DNS and domain configuration

## Tool Selection

| Need | Choose |
|------|--------|
| Infrastructure as Code | Terraform, Pulumi, OpenTofu |
| Configuration management | Ansible, Chef, Puppet |
| Cloud providers | AWS, GCP, Azure, Cloudflare |
| Monitoring (metrics) | Prometheus + Grafana, Datadog |
| Monitoring (logs) | Grafana Loki, Elasticsearch, Splunk |
| Monitoring (traces) | Jaeger, Tempo, Datadog APM |
| Uptime monitoring | UptimeRobot, Better Uptime, Checkly |
| Incident management | PagerDuty, OpsGenie, Incident.io |
| Secret management | Vault (HashiCorp), AWS Secrets Manager |
| Container orchestration | Kubernetes, Nomad, Docker Swarm |
| CDN/Edge | Cloudflare, Fastly, AWS CloudFront |

## Observability Stack

```
                    ┌──────────────────────┐
                    │    Grafana Dashboard  │ ← Unified visualization
                    └──────────┬───────────┘
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │  Prometheus   │   │ Grafana Loki │   │    Tempo      │
    │   (Metrics)   │   │   (Logs)     │   │   (Traces)    │
    └──────────────┘   └──────────────┘   └──────────────┘
           ▲                   ▲                   ▲
    ┌──────────────────────────────────────────────────────┐
    │            Application + Infrastructure               │
    │    exporters / agents / instrumentation (OTel)        │
    └──────────────────────────────────────────────────────┘
```

## Infrastructure as Code Pattern

```hcl
# Terraform: Standard module structure
module "vpc" {
  source  = "./modules/vpc"
  cidr    = "10.0.0.0/16"
  azs     = ["us-east-1a", "us-east-1b"]
}

module "eks" {
  source       = "./modules/eks"
  cluster_name = "production"
  vpc_id       = module.vpc.vpc_id
  subnet_ids   = module.vpc.private_subnet_ids
  node_groups = {
    general = { instance_type = "t3.medium", min = 2, max = 10 }
  }
}
```

## Security Hardening Checklist

```yaml
network:
  - [ ] VPC with private subnets for workloads
  - [ ] Security groups: least privilege, no 0.0.0.0/0 ingress
  - [ ] WAF rules on public endpoints
  - [ ] DDoS protection (Cloudflare, AWS Shield)

identity:
  - [ ] MFA enforced for all admin accounts
  - [ ] IAM roles (not keys) for service-to-service
  - [ ] Least privilege policies
  - [ ] Regular access reviews (quarterly)

data:
  - [ ] Encryption at rest (AES-256)
  - [ ] Encryption in transit (TLS 1.3)
  - [ ] Automated backups with tested restore
  - [ ] Secrets in Vault/Secrets Manager (never in code)

monitoring:
  - [ ] Security event logging (CloudTrail, Audit Logs)
  - [ ] Anomaly detection alerts
  - [ ] Vulnerability scanning (Trivy, Snyk)
```

## Key Best Practices (2026)

**OpenTelemetry Standard:** Use OTel for vendor-neutral instrumentation — metrics, logs, traces in one SDK
**GitOps:** Infrastructure changes via PRs — Terraform/Pulumi in CI/CD, never manual console changes
**Zero Trust:** Verify every request — no implicit trust based on network location
**Cost Optimization:** Reserved instances, spot instances, right-sizing, Kubecost for K8s
**Chaos Engineering:** Regular failure injection (Chaos Monkey, Litmus) to validate resilience

## References

- `references/cloud-infrastructure-patterns.md` - AWS, GCP, Cloudflare architecture patterns
- `references/monitoring-observability-setup.md` - Prometheus, Grafana, Datadog configuration
