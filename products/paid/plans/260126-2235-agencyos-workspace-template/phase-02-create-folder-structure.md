# Phase 2: Core Folder Structure

## 1. Overview
Create the standardized folder hierarchy that defines the "AgencyOS" operating model. This structure separates concerns (Strategy vs. Execution vs. Support) and provides a home for every file an agency produces.

## 2. Requirements
- Structure must be intuitive for agency owners.
- Numbering system (00, 01, 02...) keeps folders sorted.

## 3. Implementation Steps
1.  **Create Root Directories**:
    - `.antigravity/` (System Core)
    - `.agent/` (Workflows)
    - `00_Strategy_Center/` (The Brain)
    - `01_Product_Factory/` (The Hands)
    - `02_Marketing_Engine/` (The Voice)
    - `03_Sales_Hub/` (The Wallet)
    - `04_Finance_Ops/` (The Scoreboard)
    - `workspacesetup/` (Installation)

2.  **Create Subdirectories**:
    - Inside `.antigravity/`: `agents/`, `skills/`
    - Inside `.agent/`: `workflows/`
    - Inside `00_Strategy_Center/`: `OKR/`, `Brand_Identity/`, `Legal/`
    - Inside `01_Product_Factory/`: `Projects/`, `Delivery_SOPs/`
    - Inside `02_Marketing_Engine/`: `Content_Calendar/`, `Assets/`
    - Inside `03_Sales_Hub/`: `CRM/`, `Proposals/`, `Contracts/`
    - Inside `04_Finance_Ops/`: `Invoices/`, `Expenses/`, `Reports/`

3.  **Add Placeholder READMEs**:
    - Add a `README.md` in each root folder explaining its purpose.

## 4. Todo List
- [ ] Create 5 Core Business Logic folders (00-04).
- [ ] Create System folders (.antigravity, .agent).
- [ ] Create `workspacesetup` folder.
- [ ] Populate subdirectories for a standard agency workflow.
- [ ] Add `README.md` to every folder.

## 5. Success Criteria
- Full folder tree matches the Architecture plan.
- Every folder has a description file.
