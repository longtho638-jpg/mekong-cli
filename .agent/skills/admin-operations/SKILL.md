---
name: admin-operations
description: Business administration, document management, workflow automation, office ops. Use for process optimization, SOP creation, vendor management, compliance tracking.
license: MIT
version: 1.0.0
---

# Admin Operations Skill

Streamline business administration with workflow automation, document management, and operational excellence.

## When to Use

- Automating repetitive business processes (approvals, onboarding, reporting)
- Creating SOPs (Standard Operating Procedures)
- Document management and version control
- Vendor/supplier management and procurement
- Office operations optimization
- Meeting scheduling, agenda management
- Compliance tracking and audit preparation
- Budget tracking and expense management

## Tool Selection

| Need | Choose |
|------|--------|
| All-in-one business suite | Zoho One (45+ apps) |
| ERP + CRM unified | Odoo (modular, open-source) |
| Enterprise operations | NetSuite (Oracle) |
| Workflow automation | n8n, Zapier, Make |
| Document management | Google Workspace, Notion, Confluence |
| Project management | Linear, Asana, Monday.com |
| Internal knowledge base | Notion, Slite, Guru |
| Form & approval workflows | Typeform + Zapier, JotForm |

## Automation Patterns

```bash
# n8n workflow example: Auto-process new vendor applications
# Trigger: Form submission → Validate → Create vendor record → Notify team

# Zapier: Auto-archive completed documents
# Trigger: Status change → Move to archive folder → Update spreadsheet

# Make: Weekly report generation
# Schedule: Every Monday → Pull data from APIs → Generate report → Email stakeholders
```

## SOP Template

```markdown
# [Process Name] SOP
## Purpose: [Why this process exists]
## Scope: [Who/what it applies to]
## Steps:
1. [Step with specific instructions]
2. [Step with decision points]
3. [Step with verification]
## Exceptions: [When to deviate]
## Metrics: [How to measure success]
## Review: [Frequency of SOP review]
```

## Key Best Practices (2026)

**Automation First:** Automate any task done >2x/week — approval routing, data entry, report generation
**Single Source of Truth:** One system per data type — no duplicate spreadsheets
**Async by Default:** Document decisions, use async communication, reduce meetings
**Audit Trail:** Log all changes — who, what, when, why
**Self-Service:** Build internal tools/portals so teams unblock themselves

## References

- `references/workflow-automation-patterns.md` - n8n, Zapier, Make integration patterns
- `references/document-management-best-practices.md` - DMS selection, version control, retention policies
