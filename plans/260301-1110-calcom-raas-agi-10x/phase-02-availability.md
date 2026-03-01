---
title: "Phase 2 — Agent Availability Engine"
status: pending
priority: P1
effort: 2h
---

# Phase 2: Agent Availability Engine

## Overview
Cal.com availability service computes bookable slots from schedules + conflicts.
Map to **AvailabilityEngine** — defines when agents are available for missions.

## Related Code Files
- **Create:** `src/core/availability.py`
- **Create:** `tests/test_availability.py`
- **Modify:** `src/main.py` — add `schedule` CLI group

## Architecture

```
TimeSlot (dataclass)
  start: datetime
  end: datetime
  available: bool

AgentSchedule (dataclass)
  agent_name: str
  timezone: str                           # e.g. "Asia/Ho_Chi_Minh"
  working_hours: Dict[str, tuple]         # {"mon": ("09:00","17:00"), ...}
  blocked_slots: List[TimeSlot]           # manual blocks

AvailabilityEngine
  _schedules: Dict[str, AgentSchedule]   # agent_name → schedule
  set_schedule(schedule) → None
  get_schedule(agent_name) → Optional[AgentSchedule]
  compute_slots(agent_name, date, duration_min) → List[TimeSlot]
  is_available(agent_name, start, end) → bool
  _persist() / _load()                   # .mekong/availability.yaml
```

## Implementation Steps

1. Create `src/core/availability.py`:
   - `TimeSlot` dataclass with overlap detection method
   - `AgentSchedule` dataclass with defaults (Mon-Fri 09:00-17:00, UTC)
   - `AvailabilityEngine.compute_slots()` — split working window into N-min chunks, subtract blocked slots
   - Timezone-aware via `datetime` + `zoneinfo` (stdlib, Python 3.9+)
   - YAML persistence to `.mekong/availability.yaml`
   - `get_availability_engine()` singleton

2. Add CLI group to `src/main.py`:
   ```python
   @app.command("schedule")
   # sub-commands: show, set, block, slots
   # show <agent> → rich table of working hours + blocks
   # slots <agent> --date 2026-03-10 --duration 30 → list open slots
   ```

3. Create `tests/test_availability.py`:
   - test slot computation with no blocks → full day slots
   - test blocked slot removal
   - test is_available() true/false
   - test timezone offset applied correctly
   - test YAML persistence round-trip

## CLI Interface
```bash
mekong schedule show git-agent
mekong schedule set git-agent --timezone Asia/Ho_Chi_Minh --hours "09:00-17:00"
mekong schedule block git-agent --start "2026-03-10T14:00" --end "2026-03-10T15:00"
mekong schedule slots git-agent --date 2026-03-10 --duration 30
```

## Success Criteria
- [ ] `compute_slots()` returns correct list excluding blocked periods
- [ ] `is_available()` detects conflicts correctly
- [ ] Timezone conversion tested with Asia/Ho_Chi_Minh vs UTC
- [ ] YAML persistence round-trip verified

## Notes
- Use `zoneinfo` (stdlib) — no pytz dependency (YAGNI)
- Duration slots: 15/30/60 min increments only
- Default schedule: Mon-Fri 09:00-17:00 UTC per agent
