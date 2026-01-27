---
title: Implementation Plan - AgencyOS Workspace Template
description: Create a standardized AgencyOS workspace template ($97 product) for small agencies and solopreneurs.
status: completed
priority: high
effort: medium
branch: feat/agencyos-workspace-template
tags:
  - product
  - template
  - agencyos
  - monetization
created: 2026-01-26
completed: 2026-01-26
---

# AgencyOS Workspace Template - Implementation Plan

## 1. Overview
We are building the **AgencyOS Workspace Template**, a $97 product designed to be the "Operating System" for small agencies and solopreneurs. It provides a pre-configured folder structure, specialized AI agents, and standardized workflows inspired by Binh Pháp strategy.

This product serves as an upsell from the **Antigravity Onboarding Kit** and aims to professionalize agency operations immediately upon installation.

## 2. Goals
- **Standardization**: Provide a "Golden Standard" folder structure for agencies.
- **AI-Native**: Include pre-configured, specialized AI agents (Strategy, Sales, Ops).
- **Actionable**: Include ready-to-use workflow templates for common agency tasks.
- **Automation**: One-click setup script (`setup-agencyos-workspace.sh`).
- **Monetization**: Package as a high-value, low-touch digital product.

## 3. Architecture

### Folder Structure
```
agencyos-workspace-template/
├── .antigravity/          # The Brain
│   ├── agents/            # Specialized AI Personas (Strategy, Sales, Ops...)
│   └── skills/            # Context & Knowledge Base
├── .agent/
│   └── workflows/         # Actionable Process Templates (SOPs)
├── 00_Strategy_Center/    # High-level Strategy (Binh Pháp)
├── 01_Product_Factory/    # Delivery & Production
├── 02_Marketing_Engine/   # Lead Gen & Content
├── 03_Sales_Hub/          # CRM & Deals
├── 04_Finance_Ops/        # Money Management
├── workspacesetup/        # Installation & Guides
├── README_OPS.md          # The "Manual"
└── setup.sh               # Auto-installer
```

## 4. Implementation Phases

- [x] **Phase 1: Environment Setup** ([Detailed Plan](./phase-01-setup-environment.md))
  - Initialize workspace.
  - Verify dependencies.

- [x] **Phase 2: Core Folder Structure** ([Detailed Plan](./phase-02-create-folder-structure.md))
  - Create the standard directory tree.
  - Add placeholder READMEs for each section.

- [x] **Phase 3: Agent Personas** ([Detailed Plan](./phase-03-design-agent-definitions.md))
  - Define 6 core agents: Strategist, Operator, Sales, Marketer, Finance, Admin.
  - Create `.md` definitions in `.antigravity/agents/`.

- [x] **Phase 4: Workflow Templates** ([Detailed Plan](./phase-04-create-workflow-templates.md))
  - Create 10+ SOP templates (Onboarding, Sprint, Content, etc.).
  - Store in `.agent/workflows/`.

- [x] **Phase 5: Setup Automation** ([Detailed Plan](./phase-05-build-setup-automation.md))
  - Write `setup-agencyos-workspace.sh`.
  - Create `manifest.json`.
  - Write `README_OPS.md` (Documentation).

- [x] **Phase 6: Packaging & Testing** ([Detailed Plan](./phase-06-package-and-test.md))
  - Verify structure.
  - Test setup script.
  - Create final ZIP package.

## 5. Success Criteria
- [x] Directory structure is clean and logical.
- [x] Agents are correctly defined and reference standard skills.
- [x] Setup script runs without errors on macOS/Linux.
- [x] Documentation is clear for a non-technical agency owner.
- [x] Final ZIP file is ready for Gumroad upload.
