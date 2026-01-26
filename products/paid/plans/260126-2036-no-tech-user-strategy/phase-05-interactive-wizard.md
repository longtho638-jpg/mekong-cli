# Phase 5: Interactive CLI Wizard (Thủy Kế)

> **Mission:** "Victory before Combat" - Ensure the user's environment is battle-ready before they write a single line of code.

## Context
- **Strategy:** [Operation Iron Man](./plan.md)
- **Goal:** Create a "Jarvis-like" setup experience for NO-TECH users.
- **Role:** The Wizard acts as the "Thủy Kế" (Water Meter/Strategy) to measure and prepare the terrain (System).

## Requirements

### 1. Auto-Detection (Biết mình)
- [x] Hardware Check (CPU, RAM, Disk).
- [x] Network Check (Speedtest).
- [x] OS Detection.

### 2. Guided Setup (Biết người)
- [x] Dependency Installation (`pip install`).
- [x] Environment Configuration (`.env`).
- [x] Project Structure Initialization.

### 3. Vietnamese UI (Thiên thời)
- [x] Native Vietnamese language.
- [x] "Binh Pháp" terminology (Thủy Kế, Thế Trận, Dụng Gián).
- [x] Friendly, encouraging tone.

## Implementation Details

### Script: `scripts/antigravity-wizard.py`
- **Library:** `rich` for UI, `questionary` for interaction.
- **Flow:** Welcome -> Check -> Gap Analysis -> Install -> Success.
- **Safety:** Exception handling, permission checks.

### Dependencies
Added to `requirements.txt`:
- `rich>=13.0.0`
- `questionary>=2.0.0`
- `speedtest-cli>=2.1.3`
- `psutil>=5.9.0`

## Deliverables
1. **Wizard Script:** `scripts/antigravity-wizard.py`
2. **Documentation:** `scripts/README.md`
3. **Dependencies:** Updated `requirements.txt`

## User Journey
1. User runs `python3 scripts/antigravity-wizard.py`.
2. Wizard greets with "Hệ điều hành AI cho Agency".
3. Wizard scans system (RAM, Internet).
4. Wizard warns if RAM < 8GB or Internet < 30Mbps.
5. User selects "Cài đặt" options.
6. Wizard executes setup.
7. Success screen prompts to run `cc sales dashboard` and share on Twitter.

## Success Metrics
- **Completion Rate:** 100% of required steps.
- **Time:** < 2 minutes (excluding download time).
- **User Delight:** High (due to rich UI and easy guidance).
