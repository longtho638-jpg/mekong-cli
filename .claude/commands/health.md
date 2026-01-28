---
description: 🏥 HEALTH - Check Mac system resources
---

# /health - System Health Check

> **"Kiểm tra sức khỏe hệ thống"** - Monitor system resources

## Usage

```bash
/health [options]
```

## Options

| Option | Description | Example |
|--------|-------------|---------|
| (none) | Quick health check | `/health` |
| `--detailed` | Detailed resource report | `/health --detailed` |
| `--threshold` | Show threshold status | `/health --threshold` |
| `--purge` | Auto-purge if critical | `/health --purge` |

## Actions

| Metric | Command | Threshold |
|--------|---------|-----------|
| **Load Average** | `top -l 1 | grep "Load Avg"` | < 15 |
| **Free RAM** | `vm_stat | grep "Pages free"` | > 1GB |
| **CPU Usage** | `top -l 1 | grep "CPU usage"` | < 80% |
| **Disk Space** | `df -h /` | > 10GB |

## Execution Protocol

1. **Agent**: Delegates to `health-monitor`.
2. **Check**: Run system metrics.
3. **Alert**: Warn if thresholds exceeded.
4. **Purge**: Auto-purge if critical (with approval).

## Examples

```bash
# Quick health check
/health

# Detailed report
/health --detailed

# Auto-purge if critical
/health --purge
```

## Win-Win-Win
- **Owner**: System stays performant.
- **Agency**: Prevents crashes during work.
- **Client**: Reliable execution environment.
