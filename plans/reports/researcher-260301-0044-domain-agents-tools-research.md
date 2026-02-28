# Research Report: Domain Agent Tools — IT Infrastructure, Legal/Compliance, Engineering Ops, Creative Studio

**Date:** 2026-03-01
**Scope:** Real tools, frameworks, APIs/CLIs for 4 agent domains — 2025-2026 state of the art

---

## 1. IT Infrastructure

### Top Tools

| Tool | URL | Role | CLI | API |
|------|-----|------|-----|-----|
| **OpenTofu** v1.8+ | https://opentofu.org | IaC (Terraform OSS fork) | `tofu` | Terraform-compatible provider APIs |
| **Pulumi** v3+ | https://pulumi.com | IaC (code-first, Python/TS) | `pulumi` | Automation API (embed IaC in apps) |
| **Crossplane** v2.0 | https://crossplane.io | Universal cloud control plane (K8s CRDs) | `kubectl` | Kubernetes CRD API |
| **Grafana Cloud** (LGTM stack) | https://grafana.com | Metrics + Logs + Traces + Profiles | `grafana-cli` | HTTP API + Alloy OTLP collector |
| **Backstage** v1.30+ | https://backstage.io | Internal Developer Portal (IDP) | `@backstage/cli` | REST API for catalog + scaffolder |
| **Teleport** v15+ | https://goteleport.com | Zero-trust SSH/K8s/DB access | `tsh`, `tctl` | gRPC + REST API |
| **Datadog** | https://datadoghq.com | APM, infra monitoring, Bits AI agent | `datadog-agent` | REST API + tracing SDKs |

### Key Frameworks & Methodologies (2025)

- **GitOps**: ArgoCD + Flux as standard — infra state in Git, continuous reconciliation
- **Policy-as-Code (PaC)**: OPA (Open Policy Agent) + Checkov in CI/CD pipelines — rejects non-compliant infra PRs
- **Platform Engineering**: "Golden Paths" via Backstage Scaffolder — pre-approved templates, devs self-serve
- **OpenTelemetry (OTel)**: Universal observability standard — all vendors now accept OTLP
- **FinOps**: Kubecost 2.0 (K8s cost) + Cloudability (multi-cloud) — shift to "cost per transaction" unit economics

### Automation Patterns

- **"Dry-Run in PR"**: `tofu plan` or `pulumi preview` auto-runs on every PR — blocks merge if drift detected
- **Continuous Reconciliation (Crossplane)**: Cloud state always matches desired CRDs — eliminates config drift without cron jobs
- **JIT Access**: Teleport issues short-lived certs via Slack approval → auto-revoke after session
- **Agentic Observability**: Grafana Assistant (AI) + Datadog Bits AI do NL query generation and automated RCA
- **AI-predicted spend**: FinOps tools forecast cost spikes, auto-shutdown idle dev environments

### Integration Points with Software Dev

```
GitHub PR → tofu plan (IaC preview)
Backstage catalog-info.yaml → auto-populates service catalog
PagerDuty + Grafana Incident → ChatOps in Slack (FireHydrant pattern)
Teleport → integrates with GitHub SSO + OIDC for ephemeral access
Crossplane → managed via same K8s manifests as app deployments
```

### DORA Metrics Tooling

- **Sleuth** (https://sleuth.io) — DORA dashboard from GitHub/Jira data
- **DX** (https://getdx.com) — DORA + SPACE + developer sentiment
- **LinearB** (https://linearb.io) — engineering metrics + cycle time analysis

---

## 2. Legal & Compliance

### Contract Management (CLM)

| Tool | URL | Best For | API | Dev Integration |
|------|-----|----------|-----|----------------|
| **Ironclad** | https://ironcladapp.com | Complex digital contracting | REST API | Slack, Salesforce, DocuSign |
| **Juro** | https://juro.com | AI-native browser-based negotiation | High-flexibility API | Slack, Greenhouse, Salesforce |
| **Contractbook** | https://contractbook.com | SMB automated client onboarding | REST API | Zapier, Slack |
| **DocuSign CLM** | https://docusign.com | Enterprise e-sign + lifecycle | REST + eSignature API | Salesforce, SAP |

### Security Compliance (SOC2 / ISO27001 / HIPAA)

| Tool | URL | Best For | GitHub Integration | Jira |
|------|-----|----------|-------------------|------|
| **Vanta** | https://vanta.com | Startups, fastest SOC2 | Yes — scans security settings | Yes — task tracking |
| **Drata** | https://drata.com | Enterprise, AI evidence collection | Yes | Yes |
| **Sprinto** | https://sprinto.com | Cloud-first SaaS, 200+ integrations | Yes | Yes |
| **Secureframe** | https://secureframe.com | Automated policy generation | Yes | Partial |

### Privacy & GDPR

| Tool | URL | Role | API |
|------|-----|------|-----|
| **Osano** | https://osano.com | Consent management, vendor privacy scoring | Programmatic cookie consent API |
| **OneTrust** | https://onetrust.com | Enterprise GRC, global regulations | REST API, 300+ connectors |
| **TrustArc** | https://trustarc.com | Data mapping + risk assessment | REST API |
| **Termly** | https://termly.io | Dev-led TOS/Privacy Policy generation | Partner API for bulk management |

### IP Protection

| Tool | URL | Role |
|------|-----|------|
| **Clarivate / CPA Global** | https://clarivate.com | Patent search, trademark docketing, litigation APIs |
| **Anaqua** | https://anaqua.com | IP lifecycle mgmt, AQX Sync API for DMS integration |
| **PatSnap** | https://patsnap.com | AI-powered R&D intelligence |

### Key Frameworks & Patterns (2025)

- **Continuous Compliance (vs. Annual Audit)**: Vanta/Drata run 24/7 — S3 bucket left open → Slack alert in minutes
- **AI Evidence Collection**: Parses logs + configs automatically → proves compliance without screenshots
- **Policy-as-Code**: OPA/Checkov enforces compliance rules IN the CI/CD pipeline (not in PDFs)
- **Predictive Risk Scoring**: Wiz/Prisma Cloud predict next compliance failure from IaC drift

### Integration with Dev Workflows

```
GitHub → Vanta scans for MFA, branch protection, secret scanning
Jira → compliance tool opens tickets for gaps, assigns to sprint
Slack → real-time alerts when controls fail
CI/CD → Ironclad/Juro API generates contracts from product signups
OPA in pipeline → rejects code that violates data handling policies
```

---

## 3. Engineering Ops (DevEx / Platform Engineering)

### Top Tools

| Tool | URL | Category | CLI/API |
|------|-----|----------|---------|
| **GitHub + Actions** | https://github.com | SDLC platform, CI/CD | `gh` CLI + REST/GraphQL API |
| **Linear** | https://linear.app | Project mgmt (gold standard for dev teams) | GraphQL API (fastest, sync-engine) |
| **Port.io** | https://port.io | Internal Developer Portal (IDP) | REST API, "Blueprint" API-as-code |
| **Snyk** | https://snyk.io | Security in IDE/CI — shift-left | `snyk` CLI + REST API |
| **Graphite** | https://graphite.dev | Stacked PRs, fast code review | `gt` CLI + API |
| **Dagger** | https://dagger.io | Portable CI pipelines (code, not YAML) | `dagger` CLI + SDK (Go/Python/TS) |
| **SonarQube** | https://sonarsource.com | Code quality + SAST | `sonar-scanner` CLI + REST API |
| **FireHydrant** | https://firehydrant.com | Incident management + runbooks | REST API + Slack/PagerDuty |
| **Cortex** | https://cortex.io | Engineering intelligence + IDP | REST API |

### CI/CD Landscape 2025

| Tool | URL | Key Differentiator |
|------|-----|--------------------|
| **GitHub Actions** | https://github.com/features/actions | Default choice; massive marketplace |
| **Buildkite** | https://buildkite.com | Self-hosted agents, 10x faster for large monorepos |
| **Dagger** | https://dagger.io | CI logic in code (no YAML lock-in), runs locally + any CI |
| **Earthly** | https://earthly.dev | Makefile + Dockerfile hybrid, reproducible builds |

### Platform Engineering Patterns (2025)

- **"Golden Path"**: Platform team provides 1-click scaffolding (Backstage/Port Scaffolder) — devs skip boilerplate
- **Platform as a Product**: Platform team = internal product team; devs = customers; NPS-tracked
- **Infrastructure-as-Software (IaSw)**: Beyond static Terraform → Crossplane continuous reconciliation
- **Self-Healing Portals**: IDP uses AI to suggest CI/CD fix inline (Port + GitHub Copilot integration)
- **Developer Control Plane**: IDP is read-write — click to provision DB, spin ephemeral env, rotate secret

### DevEx Metrics: DORA vs SPACE

**DORA (output velocity):**
- Deployment Frequency, Lead Time for Changes, Change Failure Rate, MTTR

**SPACE (holistic):**
- Satisfaction & Well-being, Performance (outcomes), Activity (PRs/commits), Communication, Efficiency/Flow

**2025 Trend**: Teams use **DX** (getdx.com) or **Jellyfish** (jellyfish.co) to combine DORA + SPACE + survey → "Flow Score"

### Code Quality / Security Stack 2025

```
Semgrep (SAST, OSS rules)        → https://semgrep.dev
Snyk (dependency vulns + SAST)   → https://snyk.io
SonarQube/SonarCloud             → https://sonarcloud.io
Trunk.io (linting orchestration) → https://trunk.io
Graphite (PR stack management)   → https://graphite.dev
```

### Incident Management Patterns

- **ChatOps**: FireHydrant or Incident.io → Slack-native incident rooms, auto-generated timelines
- **AI RCA**: PagerDuty AIOps auto-correlates alerts, surfaces root cause
- **Runbook Automation**: Rootly (https://rootly.com) auto-executes runbook steps
- **Blameless Postmortems**: Structured templates, fed back into Jira/Linear as improvement tickets

### Integration Points

```
GitHub Actions → Snyk (security), SonarQube (quality), Dagger (portable pipelines)
Linear → GitHub PR links, Slack notifications, Zapier automation
Port.io → pulls from GitHub, K8s, Datadog, PagerDuty into unified catalog
Graphite → stacked PRs, auto-merge queues, CI-aware merge ordering
FireHydrant → Slack bot, PagerDuty escalation, Jira postmortem ticket
```

---

## 4. Creative Studio

### Design Systems & Component Libraries

| Tool | URL | Role | API/CLI |
|------|-----|------|---------|
| **Figma** | https://figma.com | Industry standard UI design | REST API + Plugin API + Dev Mode |
| **Penpot** | https://penpot.app | Open-source Figma alternative (self-hostable) | REST API |
| **Storybook** | https://storybook.js.org | Component development + documentation | CLI (`storybook`) |
| **Zeroheight** | https://zeroheight.com | Design system docs + Figma sync | REST API |
| **Supernova** | https://supernova.io | Design token export + multi-platform code gen | REST API + CLI |
| **Frontify** | https://frontify.com | Brand portals + design system governance | REST API |

### Digital Asset Management (DAM)

| Tool | URL | Best For | Integration |
|------|-----|----------|-------------|
| **Bynder** | https://bynder.com | Enterprise brand governance, 130+ integrations | Figma plugin, Contentful, Adobe |
| **Cloudinary** | https://cloudinary.com | Dev-first: image/video transform + delivery CDN | REST API + CLI + SDKs (Node/Python/etc.) |
| **Brandfolder** | https://brandfolder.com | Mid-market brand asset management | REST API, Slack, Adobe Creative Cloud |
| **Canto** | https://canto.com | SMB-focused DAM with AI tagging | REST API |
| **Imgix** | https://imgix.com | Developer-focused image CDN + transforms | URL-parameter API (no SDK needed) |

### Brand Management

| Tool | URL | Role |
|------|-----|------|
| **Frontify** | https://frontify.com | Unified brand portal: guidelines + assets + components |
| **Lingo** | https://lingoapp.com | Kit-based asset organization for design teams |
| **Bynder Brand Portal** | https://bynder.com | Centralized brand hub with live-update guidelines (replaces PDFs) |

### Content Creation & CMS

| Tool | URL | Role | API |
|------|-----|------|-----|
| **Contentful** | https://contentful.com | Headless CMS, content infrastructure | REST + GraphQL API + CLI |
| **Sanity.io** | https://sanity.io | Real-time headless CMS, GROQ query language | REST + GROQ API + CLI (`sanity`) |
| **Prismic** | https://prismic.io | Slice-based headless CMS | REST + GraphQL API |
| **Canva for Teams** | https://canva.com/teams | AI-assisted design templates + brand kit | REST API (Connect) |

### Key Frameworks & Patterns (2025)

- **Design Tokens as Code**: Supernova/Style Dictionary exports tokens → auto-generated CSS/Tailwind/native vars
- **Design-to-Code Pipelines**: Figma Dev Mode + Anima/Locofy → React/Vue/Flutter code from designs
- **AI-Assisted Design**: Figma AI (Make Designs), Canva Magic Studio, Midjourney for concept art
- **Brand as Code**: Brand guidelines stored in Frontify/Bynder → instant update, no PDF versioning
- **Component Library CI**: Storybook tests + Chromatic (visual regression) run on every PR

### Automation Patterns

```
Figma API → extract design tokens → Style Dictionary → CSS/Tailwind vars → CI auto-sync
Bynder → Contentful integration → approved assets flow directly into CMS
Cloudinary → on-the-fly transforms via URL params → no manual resizing
Storybook + Chromatic → visual regression tests block PRs on UI drift
Supernova CLI → generates platform-specific code (iOS/Android/Web) from Figma tokens
```

### Integration with Dev Workflows

```
Figma REST API     → CI pulls design specs, checks token consistency
Cloudinary SDK     → Node.js/Python asset upload/transform in deploy pipelines
Sanity CLI         → content migration scripts, dataset management
Contentful CLI     → environment branching, content migration
Storybook CLI      → runs in GitHub Actions, Chromatic visual tests
Bynder API         → auto-upload brand assets from CI after approval
```

---

## Cross-Domain Integration Matrix

| Domain | Integrates With | Key Bridge |
|--------|----------------|------------|
| IT Infra | Engineering Ops | Backstage/Port pulls infra state; ArgoCD deploys |
| Legal/Compliance | Engineering Ops | OPA in CI/CD; Vanta scans GitHub; Jira remediation |
| Creative Studio | Engineering Ops | Storybook in CI; Figma tokens → code via Supernova |
| IT Infra | Creative Studio | Cloudinary CDN for asset delivery; Imgix transforms |

---

## Unresolved Questions

1. **Crossplane v2.0 stability** — released Aug 2025, production adoption still maturing; need to verify enterprise case studies
2. **Dagger vs Buildkite tradeoffs** at scale (>1000 builds/day) — limited public benchmarks available
3. **Port.io vs Backstage** for teams <50 engineers — cost/complexity threshold unclear
4. **Penpot feature parity** with Figma for complex component variants — gaps reported in community but improving rapidly
5. **Vanta vs Drata for ISO27001** specifically — both claim support, real user comparisons scarce for non-SOC2 frameworks
6. **Frontify pricing** — reported as expensive for startups; Lingo may be better sub-$500/mo alternative

---

## Sources

- Gemini research (IT Infra, Legal/Compliance, Engineering Ops) — 2026-03-01
- [Bynder DAM integrations 2025](https://www.bynder.com/en/blog/top-6-business-apps-for-dam-integration/)
- [Bynder Figma integration](https://marketplace.bynder.com/en-US/apps/450803/figma)
- [Cloudinary vs Bynder](https://cloudinary.com/guides/vs/bynder-vs-cloudinary)
- [Top DAM solutions 2025](https://www.bookmarkify.io/blog/digital-asset-management-solutions)
- [opentofu.org](https://opentofu.org) | [pulumi.com](https://pulumi.com) | [crossplane.io](https://crossplane.io)
- [backstage.io](https://backstage.io) | [goteleport.com](https://goteleport.com) | [grafana.com](https://grafana.com)
- [ironcladapp.com](https://ironcladapp.com) | [vanta.com](https://vanta.com) | [drata.com](https://drata.com)
- [port.io](https://port.io) | [linear.app](https://linear.app) | [graphite.dev](https://graphite.dev) | [dagger.io](https://dagger.io)
- [figma.com](https://figma.com) | [storybook.js.org](https://storybook.js.org) | [cloudinary.com](https://cloudinary.com) | [sanity.io](https://sanity.io)
