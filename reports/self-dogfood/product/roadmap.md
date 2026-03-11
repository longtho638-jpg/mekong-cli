# Product Roadmap — Mekong CLI

**Period:** April–September 2026 (6 months) | **Version:** v5.0 → v6.0

---

## North Star

By September 2026: Mekong is the default CLI for agencies and solo founders who run their entire workflow through AI. Plugin marketplace live, white-label API available, 3 paying enterprise customers.

---

## Now (April–May 2026) — Solidify Core

**Theme:** Make the existing product undeniably good for the first 10 users.

### P0: PyPI Distribution
- Publish `mekong-cli` to PyPI
- `pip install mekong-cli` → `mekong cook "hello world"` in under 2 minutes
- Onboarding wizard: detect LLM provider from env vars, suggest Ollama if none found
- **Owner:** Engineering | **ETA:** April 7

### P0: Landing Page + Checkout
- agencyos.network: hero, demo GIF, pricing table, Polar.sh checkout
- One-click Starter signup → email → API key → first mission
- **Owner:** Frontend | **ETA:** April 14

### P1: QUICKSTART Polish
- 5-minute "zero to first mission" guide
- Three paths: (1) OpenRouter API key, (2) Ollama local, (3) Hosted RaaS
- Video walkthrough embedded
- **Owner:** Docs | **ETA:** April 21

### P1: Mission Dashboard (MVP)
- Web UI at agencyos.network/dashboard
- Show mission history, credit balance, current status
- Not feature-complete — just enough to replace raw API calls
- **Owner:** Frontend | **ETA:** May 15

---

## Next (June–July 2026) — First Revenue

**Theme:** Get 10 paying customers and learn what they actually use.

### P0: VS Code Extension (v0.1)
- Submit missions from command palette
- View mission status in sidebar
- Publish to VS Code Marketplace
- **Owner:** Engineering | **ETA:** June 15
- **Strategic reason:** Cursor has 500K users. VS Code has 35M. Distribution is built in.

### P1: Plugin Marketplace (v0)
- GitHub-based: contributors submit `.claude/commands/*.md` PRs
- Curated list in README + marketplace page
- 10 community plugins to seed (reach out to 20 developers)
- **Owner:** Community | **ETA:** June 30

### P1: Agency White-Label API (v0)
- Custom domain support (`mekong.youragency.com`)
- Branded email + webhook URLs
- Flat $499/mo Enterprise + $99/mo white-label add-on
- **Owner:** Engineering | **ETA:** July 15

### P2: Slack / Discord Bot
- Submit `mekong cook` from Slack message
- Mission status updates in thread
- **Owner:** Engineering | **ETA:** July 30

---

## Later (August–September 2026) — Scale

**Theme:** Make the platform, not just the tool.

### Plugin Marketplace v1
- Search, ratings, install count
- CLI: `mekong plugin install <name>`
- Revenue share: 70% to plugin author, 30% Mekong (charges via creator MCU wallet)
- **Target:** 50 community plugins

### Enterprise Features
- SSO (SAML/OIDC) for corporate customers
- Audit logs exportable to S3/BigQuery
- SLA: 99.9% uptime guarantee + dedicated support
- Custom MCU pricing for volume deals

### GitHub Actions Native Integration
- `mekong-cli` GitHub Action for CI/CD pipelines
- Run `mekong review` on every PR automatically
- Run `mekong audit` on every deploy
- Distribution: GitHub Marketplace

### Self-Hosted Enterprise (Docker)
- `docker-compose up` → full Mekong stack
- Air-gapped operation for security-conscious enterprises
- License key based (not SaaS billing)

---

## What We Are NOT Building (Anti-roadmap)

| Item | Reason |
|------|--------|
| Mobile app | Wrong surface for developer workflows |
| Browser extension | VS Code is the right IDE entry point |
| GUI workflow builder (Zapier-like) | Fights against CLI-first positioning |
| More commands (beyond 289) | Quality > quantity. Better docs on existing commands first |
| Crypto payments | No demand signal, complexity not worth it |

---

## Dependencies + Risks

| Item | Dependency | Risk |
|------|-----------|------|
| VS Code extension | Microsoft Marketplace approval | Low (standard extension) |
| Plugin marketplace | Community contribution | Medium (cold start problem) |
| White-label | Enterprise customer interest validation | High (no signal yet) |
| GitHub Actions | Open source adoption | Low (clear use case) |

---

## Success Metrics by Phase

| Phase | Metric | Target |
|-------|--------|--------|
| Now | First paid customer | 1 |
| Next | MRR | $1,500 |
| Later | MRR | $5,000 |
| Later | Plugin count | 50 |
| Later | Agency white-label customers | 5 |
