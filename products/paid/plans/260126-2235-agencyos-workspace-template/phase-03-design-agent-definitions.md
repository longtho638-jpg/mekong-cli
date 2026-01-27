# Phase 3: Agent Personas

## 1. Overview
Define the "Digital Staff" for the agency. These are 6 specialized Claude agents pre-configured with the right prompts, context, and skills to handle specific domains of the agency business.

## 2. Requirements
- Agents must align with the folder structure.
- Agents must reference `antigravity` skills.
- Files must be valid markdown configurations.

## 3. Agent List & Roles
1.  **`strategy-director.md`** (00_Strategy_Center):
    - Based on: `binh-phap-strategist`
    - Role: Vision, OKR setting, "Win-Win-Win" checks.
2.  **`product-manager.md`** (01_Product_Factory):
    - Based on: `project-manager`
    - Role: Delivery tracking, Quality Assurance, Client comms.
3.  **`marketing-wizard.md`** (02_Marketing_Engine):
    - Based on: `content-factory`
    - Role: Content creation, Viral hooks, Calendar management.
4.  **`sales-closer.md`** (03_Sales_Hub):
    - Based on: `client-magnet`
    - Role: Lead qualification, Proposal writing, Negotiation.
5.  **`finance-controller.md`** (04_Finance_Ops):
    - Based on: `revenue-engine`
    - Role: Invoicing, Cash flow tracking, Pricing strategy.
6.  **`ops-commander.md`** (System/General):
    - Based on: `adminops`
    - Role: General admin, Context switching, Resource allocation.

## 4. Implementation Steps
1.  **Extract Core Logic**: Read existing agent files from `.claude/agents/` to get the "DNA" of each agent.
2.  **Adapt for Template**: Simplify instructions for a general agency audience (remove Mekong-specific internal references).
3.  **Write Files**: Create the 6 `.md` files in `.antigravity/agents/`.

## 5. Todo List
- [ ] Create `strategy-director.md`
- [ ] Create `product-manager.md`
- [ ] Create `marketing-wizard.md`
- [ ] Create `sales-closer.md`
- [ ] Create `finance-controller.md`
- [ ] Create `ops-commander.md`

## 6. Success Criteria
- 6 Agent definition files created.
- Each agent has clear Name, Description, and Skillset.
