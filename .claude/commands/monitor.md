---
description: 📊 MONITOR - Realtime CC CLI monitoring
---

# /monitor - Realtime Monitoring

> **"Giám sát thời gian thực"** - Live system watch

## Usage

```bash
/monitor [options]
```

## Options

| Option | Description | Example |
|--------|-------------|---------|
| `--interval` | Refresh rate | `/monitor --interval 10s` |
| `--metrics` | Specific metrics | `/monitor --metrics "ram,cpu"` |
| `--alert` | Alert threshold | `/monitor --alert load=12` |

## Metrics

| Metric | Source | Update Frequency |
|--------|--------|------------------|
| Load | `top` | 10s |
| RAM | `vm_stat` | 10s |
| CPU | `ps aux` | 10s |
| Tasks | `.claude/memory/tasks.md` | 30s |

## Execution Protocol

1. **Loop**: Every N seconds.
2. **Fetch**: Metrics.
3. **Display**: Terminal dashboard.
4. **Alert**: If threshold exceeded.

## Examples

```bash
# Start monitoring
/monitor --interval 10s

# Monitor specific metrics
/monitor --metrics "ram,cpu,load"

# With alerts
/monitor --alert "load=12,ram=1.5"
```

## Win-Win-Win
- **Owner**: Visibility into system.
- **Agency**: Proactive issue detection.
- **Client**: Reliability.
