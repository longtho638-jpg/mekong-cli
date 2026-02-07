# Proxy & Quota Autonomy Protocol

This rule governs how agents must handle API exhaustion and proxy management within the Mekong-CLI project.

## Context

Project uses **Antigravity Proxy** to load-balance Gemini/Claude accounts. Agents must treat the proxy as a first-class citizen of the development environment.

## Mandatory Actions

### 1. Error Handling (429/400)

When encountering a `RESOURCE_EXHAUSTED` or `QUOTA_EXHAUSTED` error:

- **DO NOT** stop the task and ask the user for help immediately.
- **ACTIVATE** the `proxy-manager` skill.
- **EXECUTE** `scripts/proxy-recovery.sh` to surgical reset accounts.
- **WAIT** 2 seconds and retry the last failed operation.

### 2. Model Failover Awareness

- The proxy is configured with `--fallback`.
- If Sonnet fails, the proxy will silently use Gemini Pro High.
- Agents should monitor `~/.mekong/logs/proxy.log` if they suspect the model quality has changed.

### 3. Session Persistence

- If the CLI appears hung after a quota error, use the `Kickstart Protocol`: send a newline to the current terminal.

## Distribution

This protocol is a core part of the **Mekong Autonomous SDK**. Any updates to the proxy recovery logic must be reflected here.
