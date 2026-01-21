---
description: Run automated workflows
---

# /automation/run - Workflow Runner

> **Execute automated business workflows**

## Available Workflows

// turbo

```bash
ls .agent/workflows/
```

## Run Workflow

```bash
# Use MCP tool: workflow/execute_workflow
mekong automation run "daily-tasks"
```

## Popular Workflows

| Workflow      | Description        |
| ------------- | ------------------ |
| daily-tasks   | Morning automation |
| revenue-check | Revenue monitoring |
| social-post   | Auto social media  |
| invoice-send  | Auto invoicing     |

## Create Custom

```yaml
# .agent/workflows/my-workflow.md
name: My Workflow
steps:
    - action: notify
    - action: report
```

## 🏯 Binh Pháp

> "Tự động hóa = Bất chiến tự thắng" - Automation wins without fighting.
