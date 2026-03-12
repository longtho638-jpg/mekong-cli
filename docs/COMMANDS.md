# Mekong CLI — Command Reference

319 commands (230 base + 89 super) across 5 business layers.

---

## 👑 Founder Layer (46 commands)

Strategy & fundraising. Chapter: 始計 — Initial Calculations.

| Command | Description |
|---------|-------------|
| `annual` | Annual business planning |
| `quarterly` | Quarterly review |
| `okr` | OKR goal setting |
| `goals` | Goal management |
| `goal-dashboard` | Goals overview dashboard |
| `kpi` | KPI tracking |
| `forecast` | Financial forecasting |
| `financial-report` | Generate financial report |
| `branding` | Brand strategy |
| `cofounder` | Co-founder matching |
| `credits` | Credit management |
| `launch` | Product launch planning |
| `tier-pricing` | Pricing tier matrix |
| `swot` | SWOT analysis |
| `portfolio` | Portfolio management |
| `founder-validate` | Customer discovery & PMF |
| `founder-metrics` | Key metrics dashboard |
| `founder-week` | Weekly founder review |
| `founder-brand` | Brand building |
| `founder-legal` | Legal setup |
| `unit-economics` | Unit economics analysis |
| `tam` | Total addressable market |
| `moat-audit` | Competitive moat audit |
| `founder-pitch` | Pitch deck practice |
| `founder-vc-map` | VC landscape mapping |
| `raise` | Fundraising pipeline |
| `fundraise` | Fundraising execution |
| `data-room` | Data room preparation |
| `financial-model` | Financial modeling |
| `founder-vc-cap-table` | Cap table management |
| `founder-vc-term-sheet` | Term sheet analysis |
| `founder-vc-negotiate` | VC negotiation |
| `founder-vc-bootstrap` | Bootstrap strategy |
| `dilution-sim` | Dilution simulation |
| `founder-grow` | Growth strategy |
| `founder-hire` | Hiring plan |
| `runway` | Runway calculation |
| `investor-update` | Investor update email |
| `founder-secondary` | Secondary share sales |
| `founder-ipo-pre-ipo-prep` | Pre-IPO preparation |
| `founder-ipo-s1` | S-1 filing prep |
| `founder-ipo-roadshow` | IPO roadshow |
| `founder-ipo-ipo-day` | IPO day execution |
| `founder-ipo-public-co` | Public company ops |
| `founder-ipo-insider` | Insider compliance |
| `founder-ipo-succession` | Succession planning |

### Founder Super Commands (6)

| Super Command | Steps | Description |
|---------------|-------|-------------|
| `founder:raise` | /unit-economics → /tam → /moat-audit → /financial-model → /data-room → /cap-table → /pitch → /vc-map | Full fundraising kit |
| `founder:validate` | Customer discovery + PMF sprint | Validate product-market fit |
| `founder:launch` | Launch planning pipeline | Product launch execution |
| `founder:weekly` | Weekly founder review | Metrics + blockers + priorities |
| `founder:negotiate` | VC negotiation prep | Term sheet + negotiation strategy |
| `founder:ipo` | IPO preparation pipeline | Pre-IPO through IPO day |

---

## 💼 Business Layer (72 commands)

Revenue & operations. Chapter: 作戰 — Waging War.

| Command | Description |
|---------|-------------|
| `sales` | Sales pipeline management |
| `marketing` | Marketing strategy |
| `finance` | Financial operations |
| `pipeline` | Pipeline management |
| `leadgen` | Lead generation |
| `client` | Client management |
| `crm` | CRM operations |
| `invoice` | Invoice management |
| `invoice-gen` | Invoice generation |
| `expense` | Expense tracking |
| `tax` | Tax compliance |
| `contract` | Contract management |
| `hr` | HR operations |
| `email` | Email campaigns |
| `close` | Deal closing |
| `revenue` | Revenue tracking |
| `cashflow` | Cash flow analysis |
| `ads` | Ad campaign management |
| `social` | Social media management |
| `seo` | SEO optimization |
| `content` | Content creation |
| `affiliate` | Affiliate program |
| `hr-management` | HR management |
| `customer-research` | Customer research |
| `partnerships` | Partnership management |
| `agreement` | Agreement drafting |
| `campaign` | Campaign management |
| `marketing-plan` | Marketing plan creation |
| `budget` | Budget planning |
| `schedule` | Schedule management |
| `market-analysis` | Market analysis |
| `performance-review` | Performance review |

### Business Super Commands (6)

| Super Command | Steps | Description |
|---------------|-------|-------------|
| `business:revenue-engine` | Full revenue pipeline | Revenue optimization |
| `business:quarterly-review` | Quarterly business review | Performance + goals |
| `business:hiring-sprint` | Hiring pipeline | Recruit → screen → onboard |
| `business:campaign-launch` | Campaign launch | Plan → execute → measure |
| `business:financial-close` | Monthly/quarterly close | Finance + accounting |
| `business:client-onboard` | Client onboarding | Setup → training → handoff |

### Role-Specific Super Commands (34)

| Role | Super Commands |
|------|---------------|
| **Sales Manager** | `sales:pipeline-build`, `sales:deal-close`, `sales:weekly-review` |
| **Marketing Manager** | `marketing:content-engine`, `marketing:campaign-run`, `marketing:performance-report` |
| **Finance Manager** | `finance:monthly-close`, `finance:budget-plan`, `finance:collections` |
| **HR Manager** | `hr:recruit`, `hr:performance-cycle`, `hr:onboard` |
| **Legal Manager** | `legal:contract-review`, `legal:compliance-check` |
| **SDR** | `sdr:prospect`, `sdr:outreach-blast`, `sdr:lead-qualify` |
| **Account Executive** | `ae:deal-prep`, `ae:follow-up`, `ae:close-report` |
| **Content Writer** | `writer:blog`, `writer:social-batch`, `writer:newsletter` |
| **Growth Hacker** | `growth:experiment`, `growth:channel-optimize` |
| **Accountant** | `accounting:daily`, `accounting:invoice-batch` |
| **Financial Analyst** | `analyst:report`, `analyst:forecast-update` |
| **Recruiter** | `recruiter:source`, `recruiter:screen` |
| **People Ops** | `people:onboard`, `people:offboard` |

---

## 🎯 Product Layer (27 commands)

Product management. Chapter: 謀攻 — Attack by Stratagem.

| Command | Description |
|---------|-------------|
| `plan` | Implementation planning |
| `brainstorm` | Idea brainstorming |
| `scope` | Scope definition |
| `estimate` | Effort estimation |
| `sprint` | Sprint planning |
| `proposal` | Proposal writing |
| `demo` | Demo preparation |
| `competitor` | Competitor analysis |
| `persona` | User persona creation |
| `roadmap` | Product roadmap |
| `pricing` | Pricing strategy |
| `feedback` | Feedback collection |
| `retrospective` | Sprint retrospective |
| `standup` | Daily standup |
| `handoff` | Design-to-dev handoff |
| `project-management` | Project management |
| `general-report` | General report generation |
| `ocop-analyze` | OCOP product analysis |
| `ocop-export` | OCOP data export |
| `ocop-list` | OCOP product listing |

### Product Super Commands (5)

| Super Command | Steps | Description |
|---------------|-------|-------------|
| `product:discovery` | User research + personas | Product discovery |
| `product:sprint-plan` | Sprint planning pipeline | Plan → estimate → assign |
| `product:launch-feature` | Feature launch | Build → test → ship → announce |
| `product:competitive-intel` | Competitive intelligence | Research → analyze → report |
| `product:retrospective` | Sprint retrospective | Review → learn → improve |

### Design Super Commands (4)

| Role | Super Commands |
|------|---------------|
| **Design Lead** | `design:user-research`, `design:sprint` |
| **UI Designer** | `ui:design-component`, `ui:design-review` |
| **UX Researcher** | `ux:interview`, `ux:usability` |

---

## ⚙️ Engineering Layer (67 commands)

Build & ship. Chapter: 軍爭 — Military Contention.

| Command | Description |
|---------|-------------|
| `cook` | Full PEV pipeline |
| `code` | Code implementation |
| `fix` | Bug fixing |
| `debug` | Debug issues |
| `refactor` | Code refactoring |
| `optimize` | Performance optimization |
| `test` | Run tests |
| `unit-test` | Unit testing |
| `e2e-test` | End-to-end testing |
| `integration-test` | Integration testing |
| `review` | Code review |
| `deploy` | Deployment |
| `deploy-staging` | Deploy to staging |
| `deploy-prod` | Deploy to production |
| `ship` | Ship release |
| `arch` | Architecture design |
| `docs` | Documentation |
| `docs-api` | API documentation |
| `docs-arch` | Architecture docs |
| `docs-changelog` | Changelog |
| `docs-deploy` | Deployment docs |
| `docs-onboard` | Onboarding docs |
| `docs-readme` | README generation |
| `api` | API development |
| `schema` | Schema design |
| `migrate` | Database migration |
| `seed` | Database seeding |
| `component` | Component creation |
| `vibe-code` | VIBE development workflow |
| `vibe-cook` | VIBE implementation |
| `coverage` | Test coverage |
| `lint` | Code linting |
| `typecheck` | Type checking |
| `format` | Code formatting |
| `git` | Git operations |
| `git-bisect` | Git bisect |
| `git-branch` | Branch management |
| `git-cherry` | Cherry pick |
| `git-merge` | Merge branches |
| `git-rebase` | Rebase branches |
| `git-squash` | Squash commits |
| `git-stash` | Stash changes |
| `git-tag` | Tag releases |
| `pr` | Pull request |
| `kanban` | Task board |
| `journal` | Work journal |
| `watzup` | Status check |

### Engineering Super Commands (4)

| Super Command | Steps | Description |
|---------------|-------|-------------|
| `engineering:ship` | Build → test → review → deploy | Ship feature end-to-end |
| `engineering:refactor` | Analyze → plan → refactor → test | Safe refactoring pipeline |
| `engineering:incident` | Triage → diagnose → fix → postmortem | Incident response |
| `engineering:new-service` | Scaffold → implement → deploy | New service creation |

### Role-Specific Super Commands (18)

| Role | Super Commands |
|------|---------------|
| **Engineering Manager** | `eng:sprint-execute`, `eng:tech-debt`, `eng:onboard-dev` |
| **Tech Lead** | `tech:architecture-review`, `tech:api-design`, `tech:migration` |
| **DevOps Lead** | `devops:deploy-pipeline`, `devops:rollback` |
| **Senior Dev** | `dev:feature`, `dev:bug-sprint`, `dev:pr-review` |
| **Junior Dev** | `junior:first-task`, `junior:learn` |
| **Backend Dev** | `backend:api-build`, `backend:db-task` |
| **Frontend Dev** | `frontend:ui-build`, `frontend:responsive-fix` |

---

## 🔧 Ops Layer (42 commands)

Monitor & maintain. Chapter: 九變 — Nine Variations.

| Command | Description |
|---------|-------------|
| `audit` | System audit |
| `health` | Health check |
| `status` | System status |
| `report` | Generate report |
| `benchmark` | Performance benchmark |
| `security` | Security scan |
| `env` | Environment management |
| `init` | Initialize project |
| `install` | Install dependencies |
| `setup-mcp` | MCP setup |
| `use-mcp` | Use MCP tools |
| `update` | Update system |
| `clean` | Clean artifacts |
| `rollback` | Rollback deployment |
| `smoke` | Smoke test |
| `sync-agent` | Sync agents |
| `sync-all` | Sync everything |
| `sync-providers` | Sync LLM providers |
| `sync-artifacts` | Sync build artifacts |
| `sync-browser` | Sync browser state |
| `sync-editor` | Sync editor config |
| `sync-mcp` | Sync MCP servers |
| `sync-rules` | Sync rules |
| `sync-tasks` | Sync tasks |
| `win-check` | Victory verification |
| `help` | Show help |
| `raas` | RaaS management |

### Ops Super Commands (4)

| Super Command | Steps | Description |
|---------------|-------|-------------|
| `ops:health-sweep` | Full system health check | Monitor all services |
| `ops:security-audit` | Security audit pipeline | Scan → analyze → report |
| `ops:sync-all` | Sync all configurations | Agents + rules + MCP |
| `ops:disaster-recovery` | DR execution plan | Backup → restore → verify |

### Role-Specific Super Commands (8)

| Role | Super Commands |
|------|---------------|
| **Platform Manager** | `platform:monitoring-setup`, `platform:environment-setup` |
| **Release Manager** | `release:ship`, `release:hotfix` |
| **SRE** | `sre:morning-check`, `sre:incident` |
| **Release Engineer** | `releng:pre-release`, `releng:post-release` |

---

## Summary

| Layer | Base Commands | Super Commands | Total |
|-------|--------------|----------------|-------|
| 👑 Founder | 46 | 6 | 52 |
| 💼 Business | 72 | 40 | 112 |
| 🎯 Product | 27 | 9 | 36 |
| ⚙️ Engineering | 67 | 22 | 89 |
| 🔧 Ops | 42 | 12 | 54 |
| **Total** | **254** | **89** | **343** |

32 roles from CEO to intern. 85 DAG workflow recipes.

Run `mekong help` for the full interactive command list.
