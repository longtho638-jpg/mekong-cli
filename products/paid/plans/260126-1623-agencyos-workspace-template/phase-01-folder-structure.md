# Phase 1: Folder Structure & Scaffold

**Context Links**
- [AgencyOS Architecture Research](../reports/researcher-260126-1624-agencyos-architecture.md)
- [Final Patterns Research](../reports/researcher-260126-1630-final-patterns.md)

## Overview
**Date:** 260126
**Priority:** P1 (Blocking)
**Status:** Pending
**Description:** Create the physical directory structure for the AgencyOS Workspace. This establishes the "Hybrid Architecture" separating business logic (Strategy, Revenue, Ops) from technical implementation (Platform).

## Key Insights
- **Hybrid Model:** Explicitly separate "Brain" (Strategy), "Blood" (Revenue), "Muscle" (Ops), and "Body" (Platform/Tech).
- **Hidden Engine:** Use `.agency/` for configuration and scripts to keep the root clean.
- **English-First:** Folder names should be in English (e.g., `10-STRATEGY`) but content can be localized.

## Requirements
- Create root directory `agencyos-workspace-template/`.
- Create the 4 main pillars: `10-STRATEGY`, `20-REVENUE`, `30-OPERATIONS`, `platform`.
- Create the engine folder `.agency/`.
- Create placeholder `README.md` and `SETUP.md`.
- Ensure gitkeep files are present to preserve empty structure.

## Architecture
```text
agencyos-workspace/
├── .agency/                     # Engine
│   ├── scripts/
│   └── templates/
├── 10-STRATEGY/                 # Brain
│   ├── 01-Win-Win-Win-Gate/
│   ├── 02-13-Chapters/
│   └── 03-Offers/
├── 20-REVENUE/                  # Blood
│   ├── 01-Sales-Pipeline/
│   ├── 02-Marketing-Assets/
│   └── 03-Finance/
├── 30-OPERATIONS/               # Muscle
│   ├── 01-Legal/
│   ├── 02-Delivery/
│   └── 03-HR-Culture/
└── platform/                    # Body
    ├── dashboard/
    ├── website/
    └── docs/
```

## Related Code Files
- New Directory: `agencyos-workspace-template/` (root)
- New File: `agencyos-workspace-template/.agency/config.json` (Default config)
- New File: `agencyos-workspace-template/README.md`
- New File: `agencyos-workspace-template/SETUP.md`

## Implementation Steps
1.  Create the root folder `agencyos-workspace-template`.
2.  Create `.agency` directory and its subdirectories (`scripts`, `templates`).
3.  Create `10-STRATEGY` structure with subfolders for Win-Win-Win, Chapters, Offers.
4.  Create `20-REVENUE` structure with subfolders for Sales, Marketing, Finance.
5.  Create `30-OPERATIONS` structure with subfolders for Legal, Delivery, HR.
6.  Create `platform` structure with subfolders for dashboard, website, docs.
7.  Initialize `README.md` with project overview.
8.  Initialize `.agency/config.json` with default values (Agency Name, Primary Color, etc.).

## Todo List
- [ ] Create root directory
- [ ] Create `.agency/` structure
- [ ] Create `10-STRATEGY/` structure
- [ ] Create `20-REVENUE/` structure
- [ ] Create `30-OPERATIONS/` structure
- [ ] Create `platform/` structure
- [ ] Create default `config.json`
- [ ] Create `README.md`

## Success Criteria
- Folder structure matches the "Minh Long" model exactly.
- All directories exist.
- `config.json` is valid JSON.

## Risk Assessment
- **Risk:** Users might find the structure too complex.
- **Mitigation:** Detailed `README.md` in the root explaining the Brain/Blood/Muscle/Body analogy.

## Next Steps
- Proceed to Phase 2: Agent Definitions.
