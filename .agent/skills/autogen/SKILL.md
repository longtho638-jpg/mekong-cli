---
name: autogen
description: Microsoft AutoGen integration for multi-agent collaboration - orchestrate GPT-4, Claude, and local models in conversation.
---

# AutoGen Integration Skill

> **Binh Pháp Chương 3: 謀攻 (Strategic Attack)**
> "Thượng binh phạt mưu" - The highest form of warfare is to attack strategy

## Core Usage

```python
from autogen import AssistantAgent, UserProxyAgent

assistant = AssistantAgent("assistant", llm_config={"model": "gpt-4"})
user_proxy = UserProxyAgent("user", code_execution_config={"work_dir": "."})

user_proxy.initiate_chat(assistant, message="Build a FastAPI server")
```

## Key Features

- **Multi-Agent Chat**: Agents collaborate in conversation
- **Code Execution**: Sandboxed Python/Shell
- **Human-in-Loop**: Approval workflows
- **Custom Agents**: Extend with domain expertise

## AgencyOS Agents

```python
# Map to AgencyOS agent ecosystem
agents = {
    "fullstack-developer": AssistantAgent(...),
    "devops-engineer": AssistantAgent(...),
    "qa-engineer": AssistantAgent(...),
}
```

## WIN-WIN-WIN

- 👑 ANH: 10x productivity via multi-agent orchestration
- 🏢 AGENCY: Reusable agent templates
- 🚀 CLIENT: Advanced AI capabilities
