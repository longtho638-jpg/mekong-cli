---
description: Run CC CLI safely with memory management and auto-batching to prevent OOM crashes
---

# CC CLI Safe Runner Workflow

This workflow prevents CC CLI from crashing due to Out-of-Memory (OOM) errors.

## Quick Start

// turbo

```bash
./scripts/cc-cli-safe.sh "10-34"
```

## Features

1. **16GB Memory Limit** - Higher than default 8GB
2. **30-Minute Timeout** - Auto-restart if stuck
3. **5-Task Batches** - Smaller chunks = less memory
4. **Memory Monitoring** - Stops before crash
5. **Auto Cleanup** - Clears stale processes between batches

## Usage

### Run specific task range

// turbo

```bash
./scripts/cc-cli-safe.sh "10-14"
```

### Run with custom prompt

```bash
./scripts/cc-cli-safe.sh "" "Your custom prompt here"
```

### Configuration (edit script)

```bash
MAX_MEMORY_GB=16      # Memory limit
MAX_RUNTIME_MINUTES=30 # Timeout per batch
BATCH_SIZE=5          # Tasks per batch
```

## How It Works

1. **Pre-flight checks**: Verify memory available, cleanup old processes
2. **Batch execution**: Run 5 tasks at a time
3. **Memory monitoring**: Check usage every 30 seconds
4. **Emergency stop**: Kill process at 95% memory usage (before crash)
5. **Auto-retry**: Restart batch after emergency stop
6. **Cooldown**: 10-second pause between batches

## Troubleshooting

### Still getting OOM?

- Reduce `BATCH_SIZE` to 3
- Increase `MAX_MEMORY_GB` to 24
- Close other applications

### CC CLI not responding?

- Script has 30-minute timeout
- Will auto-cleanup and continue

## Integration with Antigravity

When Antigravity monitors CC CLI, use this instead of direct `claude` command:

```bash
# Instead of:
claude --model gemini-3-pro-high --dangerously-skip-permissions

# Use:
./scripts/cc-cli-safe.sh "10-34"
```
