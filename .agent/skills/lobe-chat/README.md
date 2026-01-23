# Lobe Chat Skill

This skill integrates [Lobe Chat](https://github.com/lobehub/lobe-chat), a modern AI workspace with plugin support.

## Features

- **Visual Workspace**: Chat interface for multiple models.
- **Plugin System**: Extensive plugin marketplace (including MCP support).
- **TTS/STT**: Voice interaction capabilities.

## Usage

Deploy Lobe Chat using Docker:

```bash
docker run -d -p 3210:3210 \
  -e OPENAI_API_KEY=sk-xxxx \
  -e ACCESS_CODE=lobe66 \
  --name lobe-chat \
  lobehub/lobe-chat
```

Then access at `http://localhost:3210`.

## AgencyOS Integration

Lobe Chat can be used as a "Frontend" for the AgencyOS "Backend" agents, connecting via standard API protocols or MCP.

## Requirements

- Docker
