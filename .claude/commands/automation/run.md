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
python3 scripts/vibeos/workflow_engine.py --run "daily-tasks"
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
