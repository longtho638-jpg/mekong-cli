# Phase 5: Setup Automation

## 1. Overview
Create the scripts and documentation that make this a "Product" rather than just a folder. The setup script automates the initialization of the workspace for the buyer.

## 2. Requirements
- `setup.sh`: Bash script to deploy the structure to a user's chosen location.
- `README_OPS.md`: The user manual.
- `manifest.json`: Product metadata.

## 3. Implementation Steps
1.  **Develop `setup.sh`**:
    - Ask user for "Agency Name".
    - Copy template files to destination.
    - Initialize git (optional).
    - Print "Success" message with next steps.
2.  **Write `README_OPS.md`**:
    - Welcome message ("Welcome to AgencyOS").
    - "How to use this workspace".
    - "Meet your AI Staff" (Agent descriptions).
    - "Workflow Library" (How to run workflows).
3.  **Create `manifest.json`**:
    - Product Name, Version, Description, Compatible Claude Version.

## 4. Todo List
- [ ] Write `setup-agencyos-workspace.sh` (executable).
- [ ] Write `README_OPS.md`.
- [ ] Finalize `manifest.json`.

## 5. Success Criteria
- Script runs and creates the full structure in a test directory.
- Documentation is user-friendly and professional.
