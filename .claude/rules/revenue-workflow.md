---
title: "Revenue Workflow"
priority: P1
tags: [workflow, revenue, sales, agency]
agents: [revenue-engine, client-magnet, agency-server]
---

# Revenue Generation Workflow

> **"Tiền là máu"** - Revenue is the lifeblood of the agency.

## 1. Strategy Phase (Binh Pháp)
- **Trigger**: New Lead or Quarterly Review.
- **Tool**: `/binh-phap` -> `agency_server.analyze_strategy`.
- **Action**:
    1. Analyze Client Position (Thien, Dia, Nhan).
    2. Identify WIN-WIN-WIN opportunity.
    3. Determine Pricing Tier (Warrior/General/Tuong Quan).

## 2. Acquisition Phase (Client Magnet)
- **Trigger**: Pipeline Gap.
- **Tool**: `/sales` -> `marketing_server.generate_campaign`.
- **Action**:
    1. Generate Content (Viral/Value).
    2. Nurture Leads (Automated Drip).
    3. Book Strategy Session.

## 3. Onboarding Phase (Agency Engine)
- **Trigger**: Signed Contract.
- **Tool**: `/onboard` -> `agency_server.onboard_client`.
- **Action**:
    1. Generate Contract (MSA).
    2. Create Invoice (First Payment).
    3. Setup Client Portal.
    4. Provision Access.

## 4. Execution Phase (Revenue Engine)
- **Trigger**: Monthly Cycle.
- **Tool**: `/revenue` -> `revenue_server.check_sales`.
- **Action**:
    1. Track MRR/ARR.
    2. Identify Upsell Opportunities.
    3. Automate Collections.

## 5. Retention Phase (Win3 Loop)
- **Trigger**: QBR or Renewal.
- **Tool**: `/win` -> `agency_server.validate_win_win_win`.
- **Action**:
    1. Review Performance.
    2. Re-validate Alignment.
    3. Renew or Pivot.
