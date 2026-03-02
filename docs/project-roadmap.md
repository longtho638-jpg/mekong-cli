# Mekong CLI Roadmap

**Current Version:** v3.0.0 (Stable)
**Last Updated:** 2026-03-02
**Status:** Open Source, Community-Driven

## Vision

Mekong CLI is building the **de facto standard for AI-powered agent orchestration**. Our roadmap focuses on:

1. **Reliability** — Zero silent failures, comprehensive audit trails
2. **Extensibility** — Easy plugin ecosystem for agents & providers
3. **Monetization** — Credit-based billing for RaaS platforms
4. **Community** — Open governance, transparent development

---

## v3.0.0 (Current) — Foundation Release

**Status:** ✅ Shipped | **Release Date:** 2026-03-02

### Delivered

- ✅ Plan-Execute-Verify (PEV) orchestration engine
- ✅ AgentProtocol for pluggable agents
- ✅ DAG scheduler with parallel execution
- ✅ Built-in agents (Git, File, Shell, RecipeCrawler)
- ✅ LLM provider abstraction (OpenAI, Gemini, offline)
- ✅ Multi-tenant credit system (SQLite)
- ✅ Python SDK for mission submission
- ✅ FastAPI server with WebSocket streaming
- ✅ Automatic rollback on verification failure
- ✅ RaaS API Bootstrap (Phase 1-6) ← **NEW**
- ✅ 102+ unit tests (>85% coverage) ← **UPDATED**

### RaaS Bootstrap Details (Phase 1-6 Complete)

**Phase 1:** RaaS Core API (router, task store, models)
**Phase 2:** Dashboard upgrade (tenant views, credit tracking)
**Phase 3:** Landing page (pricing tiers, feature matrix)
**Phase 4:** API Gateway upgrade (edge auth + KV limiter)
**Phase 5:** Billing MCU metering (complexity-based pricing)
**Phase 6:** Testing (40+ RaaS tests, all passing ✅)

**Key Features:**
- Production REST API (`/api/v1/missions`, `/api/v1/tasks`)
- JWT auth middleware + tenant isolation
- Credit reservation & quota enforcement
- MCU (Mission Complexity Unit) pricing model
- Cloudflare Workers edge gateway
- Polar.sh webhook integration
- Rate limiting with Cloudflare KV
- Audit trail for all operations

### Quality Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Type Safety | 100% | 100% (zero `any` types) |
| Test Coverage | >80% | 84% |
| CLI Startup | <1s | 0.8s |
| Task Execution | <30s typical | ~15s avg |
| API Response | <500ms | ~200ms |

---

## v3.1 (Next) — Plugin Ecosystem & Templates

**Target:** Q2 2026 | **Status:** Planning

### Goals

- **Plugin Marketplace** — Curated list of community agents/providers
- **Recipe Templates** — Pre-built automation recipes (deployment, testing, CI/CD)
- **Agent Starter Kit** — Boilerplate for building custom agents
- **Better Error Messages** — Actionable debugging for failed tasks

### Features

- [ ] Plugin registry & discovery service
- [ ] Agent templates (web scraper, email, database, API client)
- [ ] Provider templates (custom LLM, local model, fallback chain)
- [ ] Interactive agent builder CLI (`mekong agent new`)
- [ ] Recipe marketplace (GitHub-based registry)

### Success Criteria

- 10+ community plugins published
- Plugin installation <1 minute
- Documentation with working examples

---

## v3.2 — Dashboard & Web UI

**Target:** Q3 2026 | **Status:** Backlog

### Goals

- **Open-source Dashboard** — Monitor missions, manage credits, view audit logs
- **Recipe Editor** — Visual workflow designer (DAG-based)
- **Admin Panel** — Tenant management, credit allocation, webhook logs
- **Mobile App** — Submit missions, check status (React Native)

### Features

- [ ] Next.js-based dashboard (open source)
- [ ] Drag-and-drop recipe builder
- [ ] Real-time WebSocket updates
- [ ] Dark mode support
- [ ] Role-based access control (RBAC)

### Success Criteria

- Usable dashboard for non-technical users
- Zero JavaScript errors in production
- Mobile-responsive design

---

## v4.0 — Enterprise Features

**Target:** Q4 2026 | **Status:** Planning

### Goals

- **Audit Logging** — Complete action trail for compliance
- **RBAC** — Fine-grained permissions (admin, operator, viewer)
- **SLA Tracking** — Task SLO metrics and reporting
- **Advanced Analytics** — Cost optimization, success rates, latency patterns
- **Backup/DR** — Automated backups, disaster recovery plan

### Features

- [ ] Immutable audit log (no deletions)
- [ ] API rate limiting per role
- [ ] SLA violation alerts
- [ ] Cost optimization recommendations
- [ ] Multi-region deployment support
- [ ] High availability (load balancing)

### Success Criteria

- SOC 2 Type II compliance ready
- 99.99% uptime SLA achievable
- Recovery time < 5 minutes

---

## Long-term Vision (v5.0+)

### Community & Ecosystem

- **Marketplace** — Monetize community-built agents/providers
- **Standards** — RFC process for new features
- **Governance** — Community steering committee
- **Certifications** — Partner program for verified plugins

### Research Track

- **Advanced Scheduling** — ML-based task prioritization
- **Self-Healing** — Automatic error recovery with ML feedback loops
- **Distributed Execution** — Multi-node agent orchestration
- **Cost Optimization** — Automatic provider selection based on cost/latency

---

## How to Contribute

We welcome contributions for:

1. **Plugins** — Build agents or providers, publish to PyPI
2. **Bug Fixes** — File issues, submit PRs
3. **Documentation** — Improve guides, add examples
4. **Testing** — Add test coverage, find edge cases
5. **Roadmap Feedback** — Comment on GitHub discussions

### Quick Start

```bash
# Clone repo
git clone https://github.com/yourusername/mekong-cli.git
cd mekong-cli

# Install dev dependencies
pip install poetry && poetry install

# Run tests
python3 -m pytest tests/ -v

# Build custom agent
cp -r examples/agent-template/ ~/.mekong/plugins/my_agent/
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for full workflow.

---

## Breaking Changes & Deprecations

| Version | Change | Migration |
|---------|--------|-----------|
| v3.1 | Recipe format updated (backward compatible) | Auto-conversion script provided |
| v4.0 | RBAC required for API access | Default "admin" role if unset |

---

## Feedback & Feature Requests

- **GitHub Issues**: Bug reports & feature requests
- **Discussions**: Ideas, questions, feedback
- **Discord**: Real-time community chat (coming Q2 2026)
- **RFC Process**: Major features require RFC approval

**Let's build the future of AI orchestration together!**
