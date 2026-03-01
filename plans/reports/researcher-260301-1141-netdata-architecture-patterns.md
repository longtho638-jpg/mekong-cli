# Netdata Architecture & Patterns Research Report

**Report:** Netdata Open-Source Project Architecture Analysis
**Date:** 2026-03-01
**Focus:** Core patterns applicable to Plan-Execute-Verify CLI engines
**Status:** Complete

---

## EXECUTIVE SUMMARY

Netdata is a distributed monitoring engine using **edge-based processing, modular collectors, parent-child streaming topology, and real-time alert cascades**. Three patterns map directly to mekong-cli's Plan-Execute-Verify architecture:

1. **Plugin Orchestrator Pattern** → Recipe orchestrators with language-agnostic modules
2. **Parent-Child Replication Flow** → Multi-tier plan generation with gap-filling verification
3. **Health Watchdog Engine** → Cascading quality gates with configurable thresholds

---

## 1. CORE ARCHITECTURE (始計 — Initial Calculations)

### System Topology

```
┌──────────────────────────────────────────────────────────────┐
│                     NETDATA CLOUD (Enterprise)               │
│                   (MCP Server since v2.9.0)                  │
└──────────────────────────────┬───────────────────────────────┘
                               │ (Metrics aggregation)
                    ┌──────────┴──────────┐
                    ▼                     ▼
        ┌──────────────────┐  ┌──────────────────┐
        │ PARENT NODE 1    │  │ PARENT NODE 2    │
        │ (Replication hub)│  │ (Replication hub)│
        └─────────┬────────┘  └────────┬─────────┘
                  │                     │
    ┌─────────────┼─────────────┬───────┼─────────────┐
    ▼             ▼             ▼       ▼             ▼
  ┌─────┐     ┌─────┐       ┌──────┐┌──────┐     ┌──────┐
  │CHILD│     │CHILD│       │CHILD││CHILD│     │CHILD│
  │  1  │     │  2  │       │  3  ││  4  │     │  5  │
  └─────┘     └─────┘       └──────┘└──────┘     └──────┘
  [Host 1]    [Host 2]    [Container]  [K8s]     [VM]
```

**Principle:** Agents collect locally, parents aggregate, cloud orchestrates. Edge-first design.

### Agent Collection Pipeline

```
Data Source → Collector Plugin → DBENGINE → Stream/Query → Alert Engine
                    │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
    Internal      External   eBPF
    (C code)  (Go/Python/Bash) (Kernel)
```

---

## 2. PLUGIN ORCHESTRATOR PATTERN (作戰 — Waging War)

### Three-Layer Plugin Architecture

| Layer | Language | Type | Example | Use Case |
|-------|----------|------|---------|----------|
| **Internal** | C | Built-in | cgroup, disk, net | System-level metrics |
| **External** | Go/Python/Bash | Modular | Prometheus scraper, MySQL | Application monitoring |
| **Kernel** | eBPF | Tracepoints | Process trace, socket trace | Deep observability |

### Plugin Communication Protocol

```
Plugin ──stdin──> [Metric: timestamp value]
Plugin <──stdout─ Agent waits for formatted output

Format: timestamp|dimension value
Example: 1709273460|eth0_in 123456
```

**Mapping to mekong-cli:**
```
Recipe ──stdin──> [Step Output: exit_code, stdout, stderr]
Recipe <──stdout─ Orchestrator reads ExecutionResult
```

### Collector Module Structure (Go Example)

```go
type Collector interface {
    Init(ctx context.Context) bool      // PLAN phase
    Check(ctx context.Context) bool     // Verify connectivity
    Collect(ctx context.Context) error  // EXECUTE phase
    Charts() *Charts                    // Define outputs
}
```

**Analogy:** `Collector` ≈ Recipe module; `Collect()` ≈ `ExecutionResult`

---

## 3. STREAMING & REPLICATION (第九篇 行軍 — The March)

### Real-Time Parent-Child Flow

```
CHILD AGENT:                    PARENT AGENT:
┌──────────────┐              ┌──────────────┐
│ Collect      │─ Stream ────>│ Receive      │
│ Metrics      │              │ Aggregate    │
└──────────────┘              └──────────────┘
│                                   │
│ Gap Detection                     │ Gap Detection
├─> Replicate Missing ─────────────>│ Fill Backlog
│   (historical data)                │
└─────────────────────────────────────┘
```

**Three-Phase Protocol:**
1. **Replication** (init): Historical data backfill from child to parent
2. **Streaming** (live): Real-time metric push with sub-second latency
3. **Aggregation** (parent): Multi-source roll-up + downsampling

**Mapping to mekong-cli:**
1. Plan phase generates recipe with task sequence
2. Execute phase streams results + completion signals
3. Verify phase aggregates: pass/fail status → quality gates

---

## 4. HEALTH WATCHDOG ENGINE (第四篇 軍形 — Military Disposition)

### Alert Configuration Cascade

```
netdata.conf [health]
    │
    ├─> /etc/netdata/health.d/*.conf (Custom rules)
    │
    ├─> /usr/lib/netdata/health.d/ (Default: 800+ rules)
    │
    └─> Runtime Evaluation @ 10s intervals
        │
        ├─> Query DBENGINE for metric values
        ├─> Calculate: lookup (time-series), aggregation
        ├─> Compare: value vs warning/critical thresholds
        └─> Emit: Alert status (clear/warning/critical)
```

**Alert Syntax:**
```
alarm: cpu_warning
    on: system.cpu
    lookup: average -10m of user,system
    warning: $this > 80
    critical: $this > 95
    units: %
    every: 10s
```

**Hysteresis Pattern:** `warning-hysteresis: 5%` prevents flapping.

**Mapping to mekong-cli Verification:**
```python
class RecipeVerifier:
    def verify(result, criteria):
        checks = [
            {"command": "exit_code", "expected": 0},
            {"command": "test -f output.log", "expected": "pass"},
            {"command": "pytest", "warning": "> 80% pass"}
        ]
        return cascading_gate_evaluation(checks)
```

---

## 5. DBENGINE TIME-SERIES STORAGE (軍形 — Disposition)

### Tiered Retention Strategy

```
Tier 0: Per-second    │━━━━━━━━━━━━━━━━━━━━━━│ 14 days  (1 GiB default)
                      │ [High Resolution]     │
                      │
Tier 1: Per-minute    │━━━━━━━━━━━━━━━━━━━━━━│ 3 months (1 GiB default)
                      │ [Medium Resolution]   │
                      │
Tier 2: Per-hour      │━━━━━━━━━━━━━━━━━━━━━━│ >1 year  (1 GiB default)
                      │ [Low Resolution]      │
```

**Compression:** 0.6 bytes/sample via **Gorilla algorithm + ZSTD**

**Key Innovation:** Fixed-step pages eliminate per-point timestamps (3x savings)

**Mapping to mekong-cli:**
```
Phase 0: Full execution logs (per-step)
Phase 1: Summary reports (per-phase)
Phase 2: Telemetry archive (per-project)
```

---

## 6. MODULAR COLLECTOR PATTERN (謀攻 — Attack by Stratagem)

### Go.d.Plugin Architecture

```
go.d.plugin (orchestrator)
    │
    ├─> prometheus module (scrape Prometheus)
    ├─> docker module (container metrics)
    ├─> mysql module (database queries)
    ├─> [80+ modules] (production-grade)
    │
    └─> Module Interface:
        ├─ New(Config) Module
        ├─ Init() error
        ├─ Check() bool
        ├─ Collect() error
        └─ Close() error
```

**Performance:** Go chosen for production → lower latency, no runtime overhead

**Module Structure:**
```
netdata/src/collectors/
├── go.d.plugin/
│   └── modules/
│       ├── prometheus/
│       ├── docker/
│       └── custom/
├── python.d.plugin/
│   └── modules/
└── cgroups.plugin/ (eBPF)
```

---

## 7. AUTO-DISCOVERY PATTERN (虛實 — Strengths/Weaknesses)

### Service Detection Flow

```
1. Scan /proc, /sys (Linux)
2. Query Docker API, Kubernetes API
3. Probe common ports (3306, 5432, 6379, etc.)
4. Load auto_detect.yaml rules
   │
   ├─> IF port 3306 responds → MySQL module
   ├─> IF environment=K8s → Kubelet module
   ├─> IF cgroup exists → cgroup plugin
   │
5. Generate dashboard + collector config
```

**No-Op Principle:** Collectors return zero dimensions if service unavailable → memory-safe

---

## 8. API GATEWAY & STREAMING (第七篇 軍爭 — Command Protocol)

### HTTP/WebSocket API

```
GET /api/v1/data?chart=system.cpu&after=1234567890&before=1234567900
    → JSON timeseries response

GET /api/v1/info
    → Agent metadata (version, uptime, charts)

GET /api/v1/alarms?status=active
    → Current alarm state

WebSocket: /api/v1/streaming
    → Real-time metrics push (subscribe/broadcast)
```

**MCP Integration (v2.9.0):**
```
Netdata MCP Server listens on :19999
├─> /mcp/query_metrics
├─> /mcp/execute_function
├─> /mcp/discover_nodes
└─> /mcp/root_cause_analysis
```

**Mapping to mekong-cli API:**
```
/api/v1/recipes → List available recipes
/api/v1/execute → POST {recipe, params}
/api/v1/status → Recipe execution status
/ws/streaming → Real-time execution stream
```

---

## 9. CONFIGURATION MANAGEMENT (虛實 — Know Yourself)

### Hierarchical Config Resolution

```
/etc/netdata/netdata.conf (system)
    ↓
~/.netdata/netdata.conf (user override)
    ↓
/etc/netdata/health.d/*.conf (health rules)
    ↓
CLI arguments (runtime)
    └─> Runtime reload via netdatacli reload-health
```

**No Restart Required:** Hot-reload for health configs + collector modules

**Mapping to mekong-cli:**
```
~/.claude/CLAUDE.md (global rules)
    ↓
./.claude/CLAUDE.md (project rules)
    ↓
./plans/active-recipe.md (runtime params)
    ↓
/cook flags (CLI override)
```

---

## 10. SCALABILITY PATTERNS (火攻 — Attack Formation)

### Parent Topology Scaling

```
Tier 1: 1 Parent × 1000 Children
        ├─ Streaming: <1KB/sample
        ├─ Replication: hourly bulk sync
        └─ Storage: 3-5 GiB disk

Tier 2: N Parents × N Children
        ├─ Parent-to-parent replication (multi-tier)
        ├─ Metrics deduplication (3-way handshake)
        └─ Automatic failover (child reconnects to next parent)
```

**Key Metric:** 4,000 metrics/sec per agent × 1000 agents = **4M metrics/sec centralized**

**Memory Efficiency:** Page cache (default 32 MiB) + tiered compression

---

## LESSONS FOR MEKONG-CLI (Binh Pháp Mapping)

| Netdata Pattern | Mekong-CLI Mapping | Benefit |
|-----------------|-------------------|---------|
| Plugin orchestrator | Recipe orchestrator | Language-agnostic task execution |
| Parent-child replication | Plan→Execute→Verify with gap-fill | Resilient multi-phase workflows |
| Health watchdog cascade | Quality gates (YAGNI/KISS/DRY checks) | Automated quality enforcement |
| Tiered storage | Phase-level logs + archives | Efficient telemetry retention |
| Module interface | AgentBase (plan/execute/verify) | Modular agent composition |
| Auto-discovery | Auto-detect project type → recipe | Zero-config task routing |
| No-restart hot-reload | Dynamic skill loading | Evolving agent capabilities |
| MCP integration | AI-native query API | LLM-friendly metric exposure |

---

## ARCHITECTURAL DIFFERENCES (What NOT to copy)

- **Netdata:** Real-time continuous metrics every 1-10s
- **Mekong-CLI:** Discrete task execution (minutes to hours)

- **Netdata:** Thousands of concurrent collectors
- **Mekong-CLI:** Serialized recipe phases (Plan→Execute→Verify)

- **Netdata:** Storage-centric (14 days high-res data)
- **Mekong-CLI:** Execution-centric (step logs + verification proof)

---

## UNRESOLVED QUESTIONS

1. Should mekong-cli implement MCP server for external LLM queries (AI integration)?
2. How to handle dynamic recipe reloading during execution without restarts?
3. Should parent-child replication apply to plan generation (distributed planning)?
4. Can DBENGINE compression be adapted for recipe telemetry (execution logs)?

---

**Sources:**
- [GitHub - netdata/netdata](https://github.com/netdata/netdata)
- [Monitor anything with Netdata](https://learn.netdata.cloud/docs/welcome-to-netdata/monitor-anything)
- [Netdata Architecture](https://www.netdata.cloud/tags/architecture/)
- [Database engine documentation](https://learn.netdata.cloud/docs/developer-and-contributor-corner/database-engine)
- [Streaming and replication](https://learn.netdata.cloud/docs/streaming/)
- [Collector configuration](https://learn.netdata.cloud/docs/agent/collectors/quickstart)
- [Health alerts configuration](https://learn.netdata.cloud/docs/alerts-&-notifications/alert-configuration-reference)
- [How to write a Netdata collector in Go](https://learn.netdata.cloud/docs/developer-and-contributor-corner/external-plugins/go.d.plugin/how-to-write-a-netdata-collector-in-go)
- [Develop a custom data collector in Python](https://learn.netdata.cloud/docs/data-collection/external-plugins/python.d.plugin/develop-a-custom-data-collector-in-python)
