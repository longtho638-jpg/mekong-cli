---
description: 🧹 PURGE - Clear RAM and disk cache
---

# /purge - System Cache Clear

> **"Dọn dẹp bộ nhớ"** - Clear system memory

## Usage

```bash
/purge [options]
```

## Options

| Option | Description | Example |
|--------|-------------|---------|
| (none) | Standard purge | `/purge` |
| `--aggressive` | Deep clean | `/purge --aggressive` |
| `--ram-only` | RAM only | `/purge --ram-only` |

## Actions

| Target | Command | Impact |
|--------|---------|--------|
| RAM Cache | `sudo purge` | Free inactive RAM |
| DNS Cache | `sudo dscacheutil -flushcache` | Clear DNS |
| Node Modules | `find . -name "node_modules" -type d -prune -exec rm -rf '{}' +` | Reclaim disk |

## Execution Protocol

1. **Check**: Current RAM usage.
2. **Purge**: Execute cache clear.
3. **Verify**: RAM freed.

## Examples

```bash
# Standard purge
/purge

# Aggressive clean
/purge --aggressive
```

## Win-Win-Win
- **Owner**: More free RAM.
- **Agency**: System stays responsive.
- **Client**: No performance degradation.
