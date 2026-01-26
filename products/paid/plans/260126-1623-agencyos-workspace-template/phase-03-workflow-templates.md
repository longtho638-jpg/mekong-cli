# Phase 3: Workflow Templates

**Context Links**
- [AgencyOS Architecture Research](../reports/researcher-260126-1624-agencyos-architecture.md)

## Overview
**Date:** 260126
**Priority:** P2
**Status:** Pending
**Description:** Implement standard operating procedures (workflows) for the agency. These workflows guide the agents and the user through common business processes using the "Turbo Mode" CLI pattern.

## Key Insights
- **Actionable:** Workflows must be executable, not just text.
- **CLI Integration:** Workflows should reference CLI commands (e.g., `agency finance:report`) for speed.
- **Templates:** Include YAML/JSON templates for data structures (P&L, Lead Scoring).

## Requirements
- Create `.agent/workflows/` directory.
- Implement 10-12 workflows covering Strategy, Revenue, and Ops.
- Key Workflows:
    - `strategic-audit.md` (Ch 1)
    - `runway-analysis.md` (Ch 2)
    - `win-win-win-check.md` (Gate)
    - `sales-pipeline-review.md`
    - `content-calendar-creation.md`
    - `invoice-generation.md`
    - `contract-drafting.md`
    - `hiring-onboarding.md`
    - `quarterly-business-review.md`
    - `crisis-management.md`

## Architecture
**Location:** `agencyos-workspace-template/.agent/workflows/`

**Structure per Workflow:**
1.  **Header:** Meta-data.
2.  **Quick Execute:** CLI command.
3.  **Step-by-Step:** Detailed instructions with CLI references.
4.  **Templates:** Embedded or linked config templates.
5.  **Success Criteria:** Checklist.

## Related Code Files
- `agencyos-workspace-template/.agent/workflows/*.md`

## Implementation Steps
1.  Create `.agent/workflows/` directory.
2.  Implement Strategy Workflows: `strategic-audit.md`, `win-win-win-check.md`.
3.  Implement Revenue Workflows: `runway-analysis.md`, `invoice-generation.md`, `sales-pipeline-review.md`.
4.  Implement Marketing Workflows: `content-calendar-creation.md`.
5.  Implement Ops Workflows: `contract-drafting.md`, `hiring-onboarding.md`.
6.  Implement Review Workflows: `quarterly-business-review.md`.
7.  Ensure all workflows reference the "Agency CLI" (`agency`) command alias.

## Todo List
- [ ] Create `.agent/workflows/`
- [ ] Implement `strategic-audit.md`
- [ ] Implement `win-win-win-check.md`
- [ ] Implement `runway-analysis.md`
- [ ] Implement `invoice-generation.md`
- [ ] Implement `sales-pipeline-review.md`
- [ ] Implement `content-calendar-creation.md`
- [ ] Implement `contract-drafting.md`
- [ ] Implement `hiring-onboarding.md`
- [ ] Implement `quarterly-business-review.md`

## Success Criteria
- 10-12 workflows created.
- All workflows follow the standard structure.
- Workflows reference specific CLI commands.

## Risk Assessment
- **Risk:** CLI commands referenced might not exist in the user's environment.
- **Mitigation:** Ensure `setup.sh` (Phase 4) handles CLI alias setup or documentation clarifies prerequisites.

## Next Steps
- Proceed to Phase 4: Setup Automation.
