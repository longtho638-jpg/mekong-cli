# Grafana Advanced Patterns — Real-time, Provisioning, RBAC, Scenes

**Date:** 2026-03-01 | **Context:** Trading/AGI monitoring system (algo-trader)

---

## 1. Grafana Live — WebSocket Streaming

**Architecture:** PUB/SUB server over persistent WebSocket. All subscriptions on a page share ONE WebSocket connection (multiplexed). Default limit: 100 simultaneous connections.

**Channel naming:** `<scope>/<namespace>/<path>`
- `ds/<datasource-uid>/my-stream` — datasource plugin streams
- `plugin/<plugin-id>/...` — plugin-owned channels

**Push model:** Backend datasource plugin publishes `DataFrame` frames to a channel. Frontend panel subscribes → receives frames in real-time.

**Key API:** `POST /api/live/push/:streamId` accepts InfluxDB line protocol. Telegraf → Grafana push in <1s latency.

**Trading relevance:**
- Stream order book, P&L, position ticks without polling
- AGI inference latency streamed live to time-series panel
- Regime change events pushed as annotations instantly

**Limits to know:** WebSocket endpoint bypasses HTTP middleware (low CPU). But 100 concurrent connections cap applies — for 1000+ users need Grafana Enterprise or load-balance across instances.

---

## 2. Transformations Pipeline

**Execution model:** Ordered chain — each transform receives output of previous. Runs client-side (browser) after query results arrive.

**Key transforms for trading:**

| Transform | Use case |
|-----------|----------|
| `Join by field` | Merge OHLCV + signals on timestamp (inner/outer join) |
| `Group by` | Aggregate P&L by strategy, symbol, regime |
| `Group to nested tables` | Per-strategy breakdown with sub-rows (GA 2024) |
| `Calculate field` | Kelly fraction = win_rate * avg_win / avg_loss |
| `Filter by value` | Show only signals above confidence threshold |
| `Rename by regex` | Clean metric names from Prometheus labels |
| `Format time` | Bucket by day/week for drawdown windows |
| `Convert field type` | Cast string regime labels to enum for coloring |

**Chain example for AGI arbitrage dashboard:**
```
Query(Prometheus) → Filter(confidence > 0.7) → Join(signals + prices on timestamp)
→ GroupBy(strategy) → CalculateField(sharpe_ratio) → SortBy(sharpe_ratio desc)
```

**Limitation:** Transforms run in browser — heavy joins on >100k rows will lag. Pre-aggregate in datasource (Prometheus recording rules, TimescaleDB continuous aggregates) for large datasets.

---

## 3. Provisioning & Infrastructure-as-Code

**Directory structure (mounted at Grafana startup):**
```
provisioning/
├── dashboards/
│   ├── dashboard.yaml        # provider config
│   └── *.json                # dashboard JSON files
├── datasources/
│   └── datasources.yaml      # datasource definitions
├── alerting/
│   ├── rules.yaml
│   └── contactpoints.yaml
└── plugins/
    └── plugins.yaml
```

**Dashboard provider YAML:**
```yaml
apiVersion: 1
providers:
  - name: algo-trader
    folder: AlgoTrader
    type: file
    updateIntervalSeconds: 30
    options:
      path: /var/lib/grafana/dashboards
```
`updateIntervalSeconds: 30` — hot-reload without restart.

**Datasource example:**
```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    isDefault: true
    jsonData:
      timeInterval: "15s"
```

**GitOps toolchain options:**
- **Grizzly** — CLI tool, Kubernetes-style YAML, `grr apply`
- **Grafana Operator** — Kubernetes CRDs, ArgoCD/Flux compatible
- **Terraform provider** — `grafana/grafana`, manages dashboards/datasources/alerts as HCL
- **Crossplane provider** — Kubernetes manifests for Grafana resources

**Alerting provisioning:** Alert rules, contact points, notification policies, mute timings — all YAML-provisionable. Cannot edit provisioned resources via UI (read-only), enforcing GitOps discipline.

---

## 4. Multi-tenancy & RBAC

**Two isolation models:**

| Model | Mechanism | Isolation level |
|-------|-----------|-----------------|
| Org-level | Separate Grafana orgs | Hard — no cross-org visibility |
| Folder-level | Teams + folder permissions + RBAC | Soft — shared instance, scoped access |

**RBAC model (Enterprise + Cloud):**
- **Basic roles:** Viewer / Editor / Admin
- **Fixed roles:** Granular (e.g., `dashboards:reader`, `alerting:writer`)
- **Custom roles:** Compose discrete permissions
- **Assignment targets:** User, Team, Service Account

**Folder permission pattern for multi-team trading:**
```
/AlgoTrader-Team-A/    → Team-A: Admin, Team-B: Viewer
/AlgoTrader-Team-B/    → Team-B: Admin, Team-A: no access
/Shared/               → All teams: Editor
```

**LBAC (Label-Based Access Control, Enterprise 2024):** Data-source level — filter Loki/Prometheus data by labels per team. Team-A sees `{strategy="kelly"}`, Team-B sees `{strategy="momentum"}` — same dashboard, scoped data.

**Service accounts:** Machine identity for provisioning + API access. Prefer over API keys (rotating tokens, RBAC-assignable).

---

## 5. Scenes Framework

**What:** React library (`@grafana/scenes`) for building dashboard-like app plugins. As of Grafana 11.3 (Oct 2024), the core Grafana dashboard engine was fully migrated to Scenes.

**Scene graph pattern:**
```
SceneApp
└── SceneAppPage
    ├── SceneTimePicker
    ├── SceneVariableSet (template variables)
    └── SceneFlexLayout
        ├── VizPanel (time series — price)
        ├── VizPanel (bar gauge — P&L)
        └── EmbeddedScene (nested sub-dashboard)
```

**Key primitives:**

| Primitive | Purpose |
|-----------|---------|
| `SceneQueryRunner` | Executes queries, respects time range + variables |
| `SceneDataTransformer` | Applies transform pipeline to query results |
| `SceneVariableSet` | Manages template variables (datasource, symbol, strategy) |
| `SceneTimePicker` + `SceneTimeRange` | Linked time range across panels |
| `SceneFlexLayout` / `SceneGridLayout` | Responsive panel arrangement |
| `VizPanel` | Any Grafana visualization |
| `behaviors` | Attach side-effects (e.g., hide panel when no data) |

**AGI monitoring use case:** Build a custom Grafana app plugin with Scenes that renders:
- Regime detection timeline (dynamic variable: `?regime=trending`)
- Drill-down from portfolio view → per-strategy detail without page reload
- URL-synced state: `?strategy=kelly&timeRange=6h` bookmarkable

**Advantage over static dashboards:** Scenes panels can conditionally render, share state reactively, and embed in Next.js/React apps via `@grafana/scenes`.

---

## Application to algo-trader

| Pattern | Apply where |
|---------|------------|
| Grafana Live | Stream tick P&L, regime changes, AGI inference latency live |
| Transformations | Join signals+OHLCV, group by strategy, calc Sharpe/Kelly in-panel |
| Provisioning | Git-tracked dashboards + alert rules, deploy via CI/CD |
| RBAC + Folders | Isolate strategy dashboards per team; LBAC for data-source scoping |
| Scenes | Custom algo-trader app plugin with drill-down, bookmarkable state |

---

## Unresolved Questions

1. Grafana Live 100-connection cap — adequate for internal team? Need load test at scale.
2. Client-side transforms on large tick datasets — need benchmarking vs server-side pre-aggregation.
3. LBAC requires Enterprise license — confirm licensing tier before design.
4. Scenes app plugin complexity vs just using provisioned dashboards — worth the overhead?

---

## Sources

- [Grafana Live setup docs](https://grafana.com/docs/grafana/latest/setup-grafana/set-up-grafana-live/)
- [Grafana Scenes — Grafana 10 announcement](https://grafana.com/blog/2023/08/03/new-in-grafana-10-grafana-scenes-for-building-dynamic-dashboarding-experiences/)
- [Scenes-powered dashboards GA (Oct 2024)](https://grafana.com/blog/2024/10/31/grafana-dashboards-are-now-powered-by-scenes-big-changes-same-ui/)
- [Transform data docs](https://grafana.com/docs/grafana/latest/panels-visualizations/query-transform-data/transform-data/)
- [Transformations: 10 new ways (2024)](https://grafana.com/blog/2024/05/14/grafana-transformations-10-new-ways-to-get-more-out-of-your-data/)
- [Provision Grafana docs](https://grafana.com/docs/grafana/latest/administration/provisioning/)
- [Grafana as code complete guide](https://grafana.com/blog/2022/12/06/a-complete-guide-to-managing-grafana-as-code-tools-tips-and-tricks/)
- [Grafana IaC Cloud docs](https://grafana.com/docs/grafana-cloud/developer-resources/infrastructure-as-code/)
- [RBAC docs](https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/access-control/)
- [Team access management (Sep 2024)](https://grafana.com/blog/2024/09/10/grafana-access-management-how-to-use-teams-for-seamless-user-and-permission-management/)
- [Single vs multi-tenant guide](https://grafana.com/blog/single-tenant-vs-multi-tenant-architecture-with-grafana-cloud-how-to-choose-the-right-approach/)
- [GitHub grafana/scenes](https://github.com/grafana/scenes)
