---
title: "Phase 6: CI/CD Optimization & CLI Verification"
description: "Ensure the mekong CLI entry point is correctly installed and verified in the CI environment."
status: pending
priority: P1
effort: 1h
branch: main
tags: [cicd, cli, quality-assurance]
created: 2026-01-20
---

# 📜 Phase 6: CI/CD Optimization & CLI Verification

> Ensure the `mekong` CLI command is accessible and functional in the CI pipeline, aligning the build process with the `setup.py` package definition.

## 📋 Execution Tasks
- [ ] Phase 1: Local Verification
- [ ] Phase 2: CI Configuration Update
- [ ] Phase 3: Validation

## 🔍 Context
Currently, the CI workflow (`.github/workflows/ci.yml`) installs dependencies using `requirements.txt` but does not install the `mekong-cli` package itself. This means the `entry_points` defined in `setup.py` are not tested. We need to install the package (in editable mode or standard mode) within the CI environment to ensure the `mekong` command maps correctly to `cli.entrypoint:main`.

## 🛠️ Detailed Phases

### Phase 1: Local Verification
**Goal:** Verify the package installs and the CLI command works locally.
- Run `pip install -e .` in the local environment.
- Execute `mekong --help` and `mekong --version` (if available) to verify the entry point.
- Ensure no import errors occur when running as an installed package.

### Phase 2: CI Configuration Update
**Goal:** Update the GitHub Actions workflow to install the package.
- **File:** `.github/workflows/ci.yml`
- **Action:**
    - In the `Install Dependencies` step, add `pip install -e .` (or `pip install .`).
    - This ensures `setup.py` logic is executed and the `mekong` binary is added to the path.

### Phase 3: Validation
**Goal:** Prove it works in CI.
- **File:** `.github/workflows/ci.yml`
- **Action:** Add a new step "Verify CLI Entry Point".
- **Command:** `mekong --help`
- **Success Criteria:** The step passes without error, outputting the help text.

## 📝 Unresolved Questions
- Should we completely replace `pip install -r requirements.txt` with `pip install .`?
    - *Decision:* We will keep `pip install -r requirements.txt` for now to ensure we have all pinned dev dependencies (like `ruff`, `pytest` which might not be in `install_requires` of `setup.py` yet) before installing the package. `setup.py` currently excludes tests.
