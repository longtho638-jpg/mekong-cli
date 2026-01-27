---
name: agno
description: Agno framework integration for high-performance agents - 529x faster than LangChain. Lightweight, production-ready.
---

# Agno Integration Skill

> **Binh Pháp Chương 3: 謀攻 (Strategic Attack)**
> "兵貴神速" - Speed is the essence of war

## Core Usage

```python
from agno.agent import Agent
from agno.models.openai import OpenAIChat

agent = Agent(
    model=OpenAIChat(id="gpt-4"),
    instructions=["You are a helpful assistant"],
    markdown=True,
)

agent.print_response("Explain quantum computing")
```

## Key Features

- **529x Faster**: Minimal abstraction overhead
- **Type-Safe**: Full Pydantic integration
- **Multi-Modal**: Text, image, audio
- **Tool Use**: Function calling built-in

## Migration from LangChain

```python
# LangChain (slow)
chain = LLMChain(llm=llm, prompt=prompt)

# Agno (529x faster)
agent = Agent(model=model, instructions=[prompt])
```

## WIN-WIN-WIN

- 👑 ANH: 529x speed = instant response
- 🏢 AGENCY: Lightweight agent framework
- 🚀 CLIENT: Production-grade performance
