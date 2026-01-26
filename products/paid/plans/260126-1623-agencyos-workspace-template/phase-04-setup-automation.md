# Phase 4: Setup Automation

**Context Links**
- [Final Patterns Research](../reports/researcher-260126-1630-final-patterns.md)

## Overview
**Date:** 260126
**Priority:** P1
**Status:** Pending
**Description:** Build the "Nuclear Weapon" setup script (`setup.sh`) that transforms the generic template into a personalized agency workspace in minutes.

## Key Insights
- **Interactive:** The script must ask questions (Name, Niche, Founder).
- **Personalization:** It must replace placeholders globally.
- **Cleanup:** It must remove "meta-docs" (instructions about the template) to leave a clean workspace.
- **Dependency Management:** It should install dependencies for the platform apps.

## Requirements
- Create `setup.sh` in the root (or `.agency/scripts/` and symlinked).
- Script capabilities:
    - Prompt for Agency Name, Founder Name, Niche.
    - Generate/Update `.agency/config.json`.
    - Find and replace `{{AGENCY_NAME}}`, `{{FOUNDER_NAME}}` in all MD/JSON files.
    - Install NPM dependencies for `platform/dashboard` and `platform/website`.
    - Setup CLI aliases (optional but recommended).
    - Remove `SETUP.md` (the template setup guide) and rename `README.md` if needed.

## Architecture
**Script Logic:**
1.  **Welcome:** Banner and introduction.
2.  **Input:** Read user inputs.
3.  **Config:** Write to `.agency/config.json`.
4.  **Scaffold:** `sed` replacement across `10-STRATEGY`, `20-REVENUE`, `30-OPERATIONS`.
5.  **Platform:** `npm install` in subdirectories.
6.  **Finish:** Success message and "How to start" instructions.

## Related Code Files
- `agencyos-workspace-template/setup.sh`
- `agencyos-workspace-template/.agency/scripts/init.py` (Optional helper if python is preferred for complex logic)

## Implementation Steps
1.  Draft `setup.sh` with bash shebang.
2.  Implement user prompting logic.
3.  Implement JSON config generation (using `jq` or simple string manipulation).
4.  Implement `find` and `sed` logic for placeholder replacement.
5.  Add commands to run `npm install` in platform folders.
6.  Add cleanup logic for template-specific files.
7.  Test the script in a sandbox environment.

## Todo List
- [ ] Create `setup.sh`
- [ ] Implement input prompts
- [ ] Implement placeholder replacement
- [ ] Implement config generation
- [ ] Implement dependency installation
- [ ] Implement cleanup logic
- [ ] Verify execution permissions (`chmod +x`)

## Success Criteria
- Script runs without errors.
- All placeholders are replaced correctly.
- `config.json` reflects user input.
- Node_modules are installed in platform folders.

## Risk Assessment
- **Risk:** `sed` differences between macOS (BSD) and Linux (GNU).
- **Mitigation:** Use compatible `sed` syntax or detect OS and adjust commands. Alternatively, use a Python script for better cross-platform compatibility.

## Security Considerations
- Ensure script doesn't log sensitive inputs.
- Set proper file permissions.

## Next Steps
- Proceed to Phase 5: Packaging.
