---
name: people-hub-sdk
description: Unified people SDK — HR, CRM, customer success, wellbeing, longevity. Use for employee management, sales pipelines, customer health scores, wellness tracking.
license: MIT
version: 1.0.0
---

# People Hub SDK Skill

Build people-centric systems with unified HR, CRM, and wellbeing facades.

## When to Use

- Employee management and HR workflows
- CRM and sales pipeline management
- Customer success and health scoring
- Wellness and wellbeing tracking
- Time-off and payroll integration
- Org chart and department management

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/people-hub-sdk/hr` | HRFacade | Employees, time-off, payroll |
| `@agencyos/people-hub-sdk/crm` | CRMFacade | Contacts, deals, health scores |
| `@agencyos/people-hub-sdk/wellbeing` | WellbeingFacade | Wellness, longevity metrics |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-hr` | HR engine |
| `@agencyos/vibe-crm` | CRM pipeline |
| `@agencyos/vibe-customer-success` | Customer health |
| `@agencyos/vibe-wellbeing` | Wellbeing metrics |
| `@agencyos/vibe-wellness` | Wellness tracking |
| `@agencyos/vibe-longevity` | Longevity science |
