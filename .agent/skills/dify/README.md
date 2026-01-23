# Dify Skill

This skill integrates [Dify](https://dify.ai), an open-source LLM app development platform.

## Features

- **Workflow Builder**: Visual orchestration of LLM chains.
- **RAG Engine**: Built-in document processing and retrieval.
- **Backend-as-a-Service**: Exposes APIs for your AI apps.

## Usage

Dify is typically deployed via Docker.

### Deployment

```bash
git clone https://github.com/langgenius/dify.git
cd dify/docker
cp .env.example .env
docker compose up -d
```

### Integration

You can call Dify apps via their API:

```python
import requests

url = "http://localhost/v1/chat-messages"
headers = {"Authorization": "Bearer YOUR_API_KEY"}
data = {
    "query": "Hello",
    "user": "agency-os-user"
}
response = requests.post(url, headers=headers, json=data)
```

## Requirements

- Docker
