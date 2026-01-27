---
name: dify
description: Open source LLM app development platform with visual workflow builder, RAG pipeline, and prompt IDE.
---

# Dify Integration Skill

> **Binh Pháp Chương 9: 行軍 (On the March)**
> "知彼知己，百戰不殆" - Know the enemy, know yourself, never in peril

## Quick Start

```bash
cd docker/dify && docker-compose up -d
# Access at http://localhost:3000
```

## Key Features

- **Visual Workflow Builder**: Drag-and-drop LLM pipelines
- **RAG Engine**: Document → Embedding → Retrieval
- **Prompt IDE**: Version control, A/B testing
- **API Export**: Generate production APIs

## AgencyOS Integration

```python
from dify_client import DifyClient

client = DifyClient(api_key="...", base_url="http://localhost:3000")
response = client.chat.create(inputs={"query": "..."})
```

## WIN-WIN-WIN

- 👑 ANH: Visual RAG builder = instant knowledge bases
- 🏢 AGENCY: Reusable Dify templates for all RAG projects
- 🚀 CLIENT: Production-ready semantic search
