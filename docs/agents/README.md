# Agent Overview

AgencyOS uses specialized AI agents for different business functions.

## Available Agents

### Core Agents

- **fullstack-developer** - Full-stack development tasks
- **tester** - Test writing and validation
- **code-reviewer** - Code quality and security review

### Business Agents

- **content-agent** - Content creation and marketing
- **sales-agent** - Sales pipeline management
- **finance-agent** - Financial operations

### Orchestration

- **Chairman** - Strategic oversight (Antigravity)
- **CEO** - Operational execution (Claude Code)

## Agent Coordination

Agents work in parallel using the swarm pattern:

1. Chairman dispatches high-level tasks
2. CEO breaks them into subtasks
3. Specialized agents execute in parallel
4. Results synthesized and reviewed

See [Architecture](../ARCHITECTURE.md) for the full system design.
