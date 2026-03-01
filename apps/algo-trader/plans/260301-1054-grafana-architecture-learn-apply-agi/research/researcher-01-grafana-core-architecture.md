# Grafana Core Architecture Research
**Date:** 2026-03-01 | **Scope:** Plugin system, dashboard/panel, datasource, alerting, backend

---

## 1. Plugin Architecture

Three plugin types, all follow same loading mechanism:

| Type | Purpose | Interface |
|------|---------|-----------|
| **Datasource** | Connect to external systems, execute queries | `DataSourceApi` — must impl `query()` + `testDatasource()` |
| **Panel** | Visualize data, navigate, control external systems | React component receiving `PanelProps` |
| **App** | Full custom experiences: pages, backends, UI extensions | Composite — pages + datasources + panels |

**Loading mechanism:**
- Frontend: SystemJS dynamic module loader at runtime
- External plugins installed in `data/plugins/`, same path as core plugins
- Backend plugins: Go binaries communicating via gRPC (grafana-plugin-sdk-go)
- Plugin manifest (`plugin.json`) declares type, id, dependencies, routes
- Sandboxing: frontend plugins run in same browser JS context (no true isolation); backend plugins are separate processes

**Discovery:** Grafana scans plugin dirs on startup, loads manifests, registers in plugin registry. No hot-reload without restart.

**Backend plugin SDK:** `github.com/grafana/grafana-plugin-sdk-go` — implements `QueryData`, `CheckHealth`, `CallResource` handlers. Communicates with Grafana via hashicorp/go-plugin (gRPC over Unix socket).

---

## 2. Dashboard & Panel System

**JSON Model** — entire dashboard serialized as JSON:
```json
{
  "title": "...",
  "uid": "...",
  "panels": [...],           // array of panel objects
  "templating": { "list": [...] },  // variables
  "annotations": { "list": [...] },
  "time": { "from": "now-6h", "to": "now" },
  "refresh": "30s"
}
```

**Panel JSON keys:** `type` (plugin id), `datasource`, `targets` (queries), `fieldConfig`, `options`, `gridPos` (x/y/w/h).

**Rendering pipeline:**
1. Dashboard loads → resolve variables → substitute into query targets
2. `PanelQueryRunner` sends queries to DataSourceApi
3. Results returned as `DataFrame[]` (columnar data structure)
4. Panel plugin renders DataFrames via its React component
5. Field config (units, thresholds, overrides) applied as transformations

**Variables/Templating:**
- Types: Query (from datasource), Custom (manual list), Constant, Datasource, Text box, Interval, Ad hoc filters
- Variables interpolated into queries as `$var`, `${var}`, `${var:format}`
- Chained variables: one variable's query can reference another
- Dashboard-level variables shared across all panels

**Dashboard v2 schema** (in progress as of 2025): typed schema replacing loose JSON, enables observability-as-code.

---

## 3. Data Source Abstraction

**Unified interface** across 100+ datasources:

```
User query → QueryEditor (React, per plugin) → DataSourceApi.query()
           → [frontend-only datasource] → HTTP call to remote
           → [backend datasource] → Grafana backend proxy → remote system
```

**Proxy mode** (most production datasources): Grafana backend forwards requests, handles auth secrets server-side. Frontend never touches raw credentials.

**Direct mode** (legacy/simple): Browser makes requests directly to datasource.

**Data flow:**
1. Panel calls `DataSourceApi.query(request)` with `DataQueryRequest`
2. Frontend datasource → returns `Observable<DataQueryResponse>`
3. Backend datasource → frontend calls `/api/ds/query` → Go backend → plugin gRPC → datasource
4. Response normalized to `DataFrame[]` (name, fields with typed arrays)
5. Transformations applied (join, group by, filter, etc.) before panel render

**Mixed datasource:** Special datasource that fans out queries to multiple backends, merges DataFrames. Enables multi-source panels.

---

## 4. Alerting Engine (Unified Alerting / Ngalert)

Architecture since Grafana 8 (replaced legacy alerting):

**Components:**
- **Scheduler** — manages goroutines per rule group; evaluates on interval tick
- **Evaluator** — executes datasource queries + condition expression for each rule
- **State Manager** — maintains per-alert-instance state machine (Normal→Pending→Firing→Resolved)
- **Notifier** — routes firing alerts to contact points via Alertmanager (embedded)

**Alert rule structure:**
- Rule group → N rules, one eval interval per group
- Each rule: datasource query + reduce expression + threshold condition
- Multi-dimensional: one rule → N alert instances (one per time series label set)

**Evaluation flow:**
```
Scheduler tick → Evaluator runs queries → expression pipeline →
State transitions → if Firing → Alertmanager → route to contact point
```

**2024 improvement:** Rule evaluation spread across full interval (jitter) to avoid thundering herd on datasources.

**HA mode:** All instances evaluate all rules independently; deduplication via Alertmanager cluster (gossip). At-least-once delivery guarantee.

**Contact points:** Email, Slack, PagerDuty, OpsGenie, webhook, etc. — configured via Alertmanager config JSON.

**Silences & mute timings:** Time-based suppression stored in Alertmanager. Inhibition rules prevent cascading noise.

---

## 5. Backend Architecture (Go + React)

**Backend (Go):**
- Entry: `pkg/server/wire.go` — Wire codegen assembles all services + dependencies
- `pkg/modules/modules.go` — dskit service lifecycle (start/stop/health)
- `pkg/api/http_server.go` — HTTP server, all REST endpoints + middleware
- Service pattern: each feature area is a `Service` interface with `ProvideService()` constructor
- Wire reads constructor params → builds dependency graph → generates init code

**Key services:** AlertingService, DashboardService, DatasourceService, AuthService, OrgService, UserService, SearchService, LiveService (WebSocket)

**API layer:** REST (`/api/...`) + WebSocket (`/api/live/...` for streaming). GraphQL not used. Handlers are thin — delegate to service layer.

**Frontend (React/TypeScript):**
- Redux for global state (dashboards, user, org, datasources)
- `@grafana/ui` component library
- `@grafana/data` — shared types (DataFrame, FieldType, etc.) used by both core and plugins
- `@grafana/runtime` — plugin runtime bridge (getDataSourceSrv, getBackendSrv, etc.)
- Plugins loaded via SystemJS, receive Grafana APIs via `@grafana/runtime` module federation

**Plugin isolation boundary:** Plugins share `@grafana/data` types with host; communicate via defined interfaces only. No access to internal Redux store.

---

## Key Architectural Patterns (Apply to AGI Trader)

| Grafana Pattern | AGI Trader Application |
|----------------|----------------------|
| DataFrame abstraction | Normalize OHLCV/orderbook data across exchanges into unified columnar format |
| Plugin datasource interface | Each exchange adapter implements `query()`-equivalent for price/trade data |
| Variable interpolation | Strategy parameters as runtime-substitutable variables |
| Alert evaluation engine | Regime detection + signal conditions evaluated on scheduler ticks |
| Wire DI pattern | Service graph for engine, adapters, risk manager, notifier |
| Mixed datasource fan-out | Multi-exchange price aggregation in single query context |

---

## Sources
- [Plugin System — DeepWiki](https://deepwiki.com/grafana/grafana/11-plugin-system)
- [Anatomy of a Plugin — Grafana Plugin Tools](https://grafana.com/developers/plugin-tools/key-concepts/anatomy-of-a-plugin)
- [Backend Plugin System](https://grafana.com/developers/plugin-tools/key-concepts/backend-plugins)
- [Grafana Backend Architecture — kozhuhds.com](https://www.kozhuhds.com/blog/an-easy-look-at-grafana-architecture/)
- [Dashboard JSON Model](https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/view-dashboard-json-model/)
- [Variables — Grafana docs](https://grafana.com/docs/grafana/latest/dashboards/variables/)
- [Alert Rule Evaluation](https://grafana.com/docs/grafana/latest/alerting/fundamentals/alert-rule-evaluation/)
- [Unified Alerting — DeepWiki](https://deepwiki.com/grafana/grafana/7-unified-alerting-system)
- [Grafana Architecture — DEV Community](https://dev.to/favxlaw/grafana-architecture-explained-how-the-backend-and-data-flow-work-49d0)
- [grafana-plugin-sdk-go](https://github.com/grafana/grafana-plugin-sdk-go)

---

## Unresolved Questions
1. How does Grafana handle plugin version compatibility across upgrades? (semver contract unclear)
2. Exact gRPC proto schema for backend plugin `QueryData` — needed if building custom backend plugin
3. Dashboard JSON v2 schema stability/timeline — still in flux as of early 2026
4. Alertmanager clustering mechanism detail (Raft vs gossip) for HA deployment
5. Whether `@grafana/runtime` module federation approach works with Vite-based plugin builds vs legacy webpack
