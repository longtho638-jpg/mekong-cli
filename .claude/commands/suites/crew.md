---
description: 👥 Crew Command - Multi-agent crew management
argument-hint: [:list|:launch|:revenue|:content|:dev|:strategy|:debug]
---

## Mission

Manage and run multi-agent crews for complex tasks.

## Subcommands

| Command | Crew | Description |
|---------|------|-------------|
| `/crew:list` | - | List all crews |
| `/crew:launch` | product_launch | Launch a product |
| `/crew:revenue` | revenue_accelerator | Accelerate revenue |
| `/crew:content` | content_machine | Create content at scale |
| `/crew:dev` | dev_ops | Full dev ops cycle |
| `/crew:strategy` | strategy | Binh Pháp strategy |
| `/crew:debug` | debug_squad | Fix complex bugs |

## Quick Examples

```bash
/crew                  # List all crews
/crew:launch           # Product launch crew
/crew:revenue          # Revenue acceleration
/crew:content          # Content machine
```

## Crew Anatomy

```
👥 CREW
├── Lead Agent (orchestrates)
├── Worker Agent 1
├── Worker Agent 2
├── Worker Agent N
└── QA Agent (validates)
```

## Python Integration

```python
# turbo
from antigravity.core.agent_crews import run_crew, print_all_crews

# List crews
print_all_crews()

# Run a crew
result = run_crew("product_launch", {"goal": "Launch SaaS"})
print(f"Status: {result.status.value}")
```

---

👥 **Multi-agent teamwork for maximum impact**
