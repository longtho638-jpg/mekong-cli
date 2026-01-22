---
title: "Phase 3: Medium Priority Files Modularization"
status: pending
priority: P2
effort: 2h
---

# Phase 3: Medium Priority Files (200-220 lines)

## Files to Refactor

These files are close to the 200-line limit. Consider simple extractions.

### 1. control/enhanced.py (220 lines)
**Action:** Extract helper functions to `control/helpers.py`

---

### 2. coding_level.py (220 lines)
**Action:** Extract level definitions to `coding_levels.py`

---

### 3. knowledge/graph.py (215 lines)
**Action:** Extract graph operations to `knowledge/operations.py`

---

### 4. swarm/coordinator.py (214 lines)
**Action:** Extract coordination logic to `swarm/coordination.py`

---

### 5. telemetry.py (211 lines)
**Action:** Extract exporters to `telemetry_exporters.py`

---

### 6. knowledge/entity_extractor.py (211 lines)
**Action:** Extract extraction rules to `knowledge/rules.py`

---

### 7. algorithm/core.py (205 lines)
**Action:** Extract utility functions to `algorithm/utils.py`

---

### 8. control/center.py (201 lines)
**Action:** Inline optimizations, remove dead code

---

### 9. ab_testing/experiments.py (201 lines)
**Action:** Extract experiment lifecycle to `ab_testing/lifecycle.py`

## Success Criteria

- All 9 files under 200 lines
- All tests pass
- Minimal import changes (simple extractions)
