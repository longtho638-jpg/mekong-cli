# Bolt.diy Skill

This skill integrates [Bolt.diy](https://github.com/stackblitz-labs/bolt.diy), a "vibe coding" platform that allows for rapid full-stack application development using LLMs.

## Features

- **Full-Stack Generation**: Generates React/Node.js apps from prompts.
- **WebContainer**: Runs code in the browser (or Electron app).
- **AgencyOS Integration**: Connects via MCP to share context.

## Usage

Bolt.diy is typically run as a standalone application. This skill serves as a connector/documentation point.

### Setup

```bash
# Clone the repository (if not using the desktop app)
git clone https://github.com/stackblitz-labs/bolt.diy
cd bolt.diy
pnpm install
pnpm run dev
```

### AgencyOS Workflow

1. Use `marketing` agents to generate a PRD.
2. Feed PRD to Bolt.diy for initial prototype.
3. Export code back to AgencyOS monorepo.

## Requirements

- Node.js 18+
- Docker (optional, for containerized run)
