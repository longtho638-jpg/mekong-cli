---
title: "Phase 2: The Bootloader (One-Click Automation)"
description: "Develop the setup-antigravity.sh script for automated environment provisioning."
status: completed
priority: P1
effort: 8h
branch: main
tags: [script, bash, automation, devops]
created: 2026-01-26
completed: 2026-01-26
---

# Phase 2: The Bootloader

## 1. Overview
NO-TECH users cannot debug `npm install` errors or `pip` version conflicts. We need a "Nuclear Launch Key" - a single script that sets up the entire Antigravity environment.

## 2. Requirements
- **OS Support:** macOS (Primary - Apple Silicon), Linux (Secondary).
- **Idempotency:** Can run multiple times without breaking things.
- **Visuals:** "Hacker-style" progress bars, clear success messages (Green text).

## 3. Architecture
- **Script:** `scripts/setup-antigravity.sh`
- **Functions:**
    - `check_hardware()`: Warn if RAM < 16GB.
    - `install_homebrew()`: Auto-install if missing.
    - `install_deps()`: Node.js, Python 3.11, Git, Docker, FFmpeg.
    - `setup_proxy()`: Install and configure `antigravity-claude-proxy`.
    - `setup_cli()`: Install `mekong-cli` / `agencyos`.
    - `verify_health()`: Run a final system check.

## 4. Implementation Steps
1.  ✅ Create `products/paid/scripts/setup-antigravity.sh`.
2.  ✅ Implement `check_hardware` logic (using `sysctl` on Mac).
3.  ✅ Implement dependency installation (silence verbose logs, show spinners).
4.  ✅ Implement Proxy setup (npm install -g).
5.  ✅ Add "Self-Destruct" (Cleanup) function for temporary files.

## 5. Success Criteria
- ✅ User pastes **ONE** command into Terminal.
- ✅ Script runs for ~15 mins.
- ✅ Result: "Command Center Ready. Type 'cc' to begin."
- ✅ No user intervention required during the process.

## 6. Security
- Script must not require `sudo` for everything (only where Brew needs it).
- Verify checksums of downloaded assets if possible.
