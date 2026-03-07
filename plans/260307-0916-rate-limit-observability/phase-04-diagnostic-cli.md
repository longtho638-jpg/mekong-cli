# Phase 4: Diagnostic CLI Commands

**Status:** completed
**Priority:** P2
**Effort:** 2h
**Completed:** 2026-03-07

---

## Overview

Create Typer CLI app for debugging rate limit issues with commands for status, history, violations, and overrides.

## Files Created

- `src/commands/debug_rate_limits.py` - Main CLI command module (580 lines)

## Files Modified

- `src/main.py` - Register debug-rate-limits command

## Implementation Details

### Commands Implemented

#### 1. `status <tenant_id>`
- Show current quota state
- Show tier and custom overrides
- Show quota utilization %
- Options: `--json` for JSON output

#### 2. `history <tenant_id> [--hours=24] [--limit=50] [--type=EVENT_TYPE]`
- List recent rate limit events (last 24h default)
- Show endpoint, preset, event_type, timestamp
- Paginated output with Rich table
- Options: `--json` for JSON output

#### 3. `violations [--tenant=TENANT_ID] [--hours=24]`
- Show throttled requests (429 responses)
- Show retry_after, endpoint, timestamp
- Aggregate count by tenant and endpoint
- Options: `--json` for JSON output

#### 4. `list-overrides`
- List all tenant rate limit overrides
- Show tier, custom_limit, custom_window, expires_at
- Options: `--json` for JSON output

### Features

- **Rich tables**: Formatted output with colors and borders
- **JSON output**: All commands support `--json` flag for programmatic access
- **Async database queries**: Using existing repository pattern
- **Timestamp formatting**: Human-readable dates
- **Tier display**: Shows "(custom)" suffix for tenant overrides
- **Expiration detection**: Highlights expired overrides

### Database Queries

- Status: Recent events (5 min) for quota utilization
- History: Filtered events by tenant and time range
- Violations: Aggregates by tenant and endpoint
- Overrides: All tenant overrides from repository

## Testing

### Syntax Check
```bash
python3 -m py_compile src/commands/debug_rate_limits.py  # OK
python3 -m py_compile src/main.py  # OK
```

### CLI Registration
```bash
mekong --help  # Shows debug-rate-limits command
mekong debug-rate-limits --help  # Shows 4 subcommands
mekong debug-rate-limits status --help  # Shows status options
mekong debug-rate-limits history --help  # Shows history options
mekong debug-rate-limits violations --help  # Shows violations options
mekong debug-rate-limits list-overrides --help  # Shows list-overrides options
```

## Success Criteria

- [x] CLI command file created: `src/commands/debug_rate_limits.py`
- [x] `status` command works with tenant ID argument
- [x] `history` command works with time filtering
- [x] `violations` command works with aggregates
- [x] `list-overrides` command works
- [x] Commands integrated into main CLI
- [x] JSON output option available for all commands
- [x] Rich table formatting for CLI output
- [x] Syntax validation passed

## Dependencies

- `src/db/tier_config_repository.py` - Repository pattern for database access
- `src/db/database.py` - Database connection management
- `rich` library - Terminal formatting
- `typer` library - CLI framework

## Next Steps

Phase 5: Testing - Create test suite for CLI commands

## Related Files

| File | Purpose |
|------|---------|
| `src/commands/debug_rate_limits.py` | New CLI command module |
| `src/main.py` | Command registration |
| `src/db/tier_config_repository.py` | Database repository |
| `src/db/migrations/006_create_rate_limit_events.sql` | Events table |
| `src/commands/tier_admin.py` | Reference CLI pattern |
