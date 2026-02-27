---
phase: 2
title: "Tôm Hùm AGI Integration"
status: completed
priority: P0
effort: 5h
depends_on: [phase-01]
---

# Phase 2: Tôm Hùm AGI Integration

## Context Links

- Research: [Infra Readiness](research/researcher-02-infra-deployment-readiness.md)
- Source: `apps/openclaw-worker/` (70+ modules, L3-L5 AGI)
- Ref: `BINH_PHAP_MASTER.md` — DNA #6 OpenFang Agent OS Architecture
- Ref: `apps/openclaw-worker/CLAUDE.md` — full architecture spec

## Overview

Tích hợp toàn bộ Tôm Hùm AGI stack vào mekong-cli platform. Biến openclaw-worker từ standalone daemon thành core component được expose qua CLI + API.

## Key Insights

- Tôm Hùm đã production-ready (v2026.2.27 AGI Deep Upgrade)
- 14 sub-modules từ monolith decomposition + facade pattern
- Health endpoint port 9090 hoạt động
- AGI Score 5-dimension calculator ready
- Triple-Mix MAX routing đã stable ($0/ngày)
- Safety Gate v2.0 (3 tầng phòng thủ) đã enforce

## Requirements

### Functional
- `mekong agi start` — khởi động Tôm Hùm daemon
- `mekong agi status` — hiển thị AGI score, health, mission stats
- `mekong agi mission <file>` — dispatch mission thủ công
- `mekong agi logs` — live mission viewer
- Health API endpoint accessible từ mekong gateway

### Non-functional
- Backward compatible — openclaw-worker vẫn chạy standalone
- No breaking changes cho existing task-watcher.js flow
- M1 resource protection maintained

## Architecture

### Integration Pattern: Bridge (không merge code)

```
mekong CLI (Python)
├── src/agents/agi_bridge.py     # NEW: Bridge to Tôm Hùm
│   ├── start_daemon()           # spawn task-watcher.js
│   ├── get_status()             # curl localhost:9090/health
│   ├── dispatch_mission()       # write tasks/mission_*.txt
│   └── stream_logs()            # tail ~/tom_hum_cto.log
└── src/core/gateway.py          # ADD: /api/agi/* routes proxy to :9090

apps/openclaw-worker/ (Node.js) — UNCHANGED
└── lib/brain-health-server.js   # Already exposes :9090
```

### Tại sao Bridge, không Merge?

1. **Python (CLI) + Node.js (daemon)** = 2 runtime khác nhau
2. Tôm Hùm đã stable — merge = risk regression
3. Bridge pattern = loose coupling, independent deploy
4. Binh Pháp 第三篇: "Thắng không cần đánh" — integrate không cần rewrite

## Related Code Files

### Cần tạo mới
- `src/agents/agi_bridge.py` — Python bridge to Tôm Hùm (~150 LOC)
- `src/commands/agi.py` — CLI subcommands (start/status/mission/logs) (~100 LOC)

### Cần sửa
- `src/core/gateway.py` — thêm /api/agi/* proxy routes (~20 LOC)
- `src/main.py` — register `agi` command group

### Không sửa (reference only)
- `apps/openclaw-worker/task-watcher.js` — entry point
- `apps/openclaw-worker/lib/brain-health-server.js` — health :9090
- `apps/openclaw-worker/config.js` — paths & config

## Implementation Steps

### 1. Tạo agi_bridge.py (1.5h)

```python
# src/agents/agi_bridge.py
import subprocess, httpx, pathlib

class AGIBridge:
    """Bridge to Tôm Hùm AGI daemon (apps/openclaw-worker/)"""

    def __init__(self, mekong_dir: str):
        self.mekong_dir = pathlib.Path(mekong_dir)
        self.worker_dir = self.mekong_dir / "apps" / "openclaw-worker"
        self.health_url = "http://localhost:9090"
        self.tasks_dir = self.mekong_dir / "tasks"

    def start(self) -> bool:
        """Spawn task-watcher.js as background daemon"""
        # subprocess.Popen(["node", "task-watcher.js"], cwd=self.worker_dir)

    def status(self) -> dict:
        """GET localhost:9090/health → AGI score, mission stats"""
        # httpx.get(f"{self.health_url}/health")

    def dispatch(self, mission_file: str) -> str:
        """Copy mission file to tasks/ directory"""
        # shutil.copy(mission_file, self.tasks_dir)

    def logs(self, follow: bool = True):
        """Stream ~/tom_hum_cto.log"""
        # tail -f equivalent
```

### 2. Tạo CLI commands (1h)

```python
# src/commands/agi.py
import typer
app = typer.Typer(help="Tôm Hùm AGI daemon management")

@app.command()
def start(): ...

@app.command()
def status(): ...

@app.command()
def mission(file: str): ...

@app.command()
def logs(): ...
```

### 3. Gateway proxy routes (30min)

```python
# Thêm vào src/core/gateway.py
@app.get("/api/agi/health")
async def agi_health():
    # proxy to localhost:9090/health

@app.get("/api/agi/metrics")
async def agi_metrics():
    # proxy to localhost:9090/metrics
```

### 4. Register trong main.py (15min)

```python
from src.commands.agi import app as agi_app
main_app.add_typer(agi_app, name="agi")
```

### 5. Integration test (1h)

```bash
# Test sequence:
mekong agi start                    # daemon starts
mekong agi status                   # shows health + AGI score
mekong agi mission test_hello.txt   # dispatch test mission
mekong agi logs                     # stream output
curl localhost:9090/health          # verify API
curl localhost:8000/api/agi/health  # verify gateway proxy
```

## Todo List

- [ ] Tạo `src/agents/agi_bridge.py` — bridge class
- [ ] Tạo `src/commands/agi.py` — CLI subcommands
- [ ] Thêm /api/agi/* routes vào gateway.py
- [ ] Register `agi` command group trong main.py
- [ ] Test: `mekong agi start` → daemon spawns
- [ ] Test: `mekong agi status` → health + AGI score
- [ ] Test: `mekong agi mission` → dispatch works
- [ ] Test: gateway /api/agi/health → proxy OK

## Success Criteria

- `mekong agi status` → hiển thị AGI score (5 dimensions)
- `mekong agi start` → task-watcher.js spawns thành công
- `curl localhost:8000/api/agi/health` → 200 OK
- Existing openclaw-worker flow KHÔNG bị break

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Node.js daemon crash khi spawn từ Python | AGI không available | Heartbeat check + auto-restart |
| Port 9090 conflict | Health endpoint fail | Configurable port via env var |
| Circular dependency Python↔Node | Architecture mess | Bridge pattern = one-way only |

## Security Considerations

- Health endpoint chỉ expose ở localhost (bind 127.0.0.1)
- Mission dispatch validate file content trước khi copy
- Không expose internal Tôm Hùm config qua public API

## Next Steps

→ Phase 3 (Package) — include agi_bridge trong PyPI package
→ Phase 5 (Docs) — document AGI architecture cho public
