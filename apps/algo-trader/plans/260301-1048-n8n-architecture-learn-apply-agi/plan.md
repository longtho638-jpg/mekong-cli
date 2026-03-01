---
title: "n8n Architecture Patterns for Algo-Trader AGI"
description: "Apply n8n's DAG workflow, queue execution, error handling, and credential patterns to trading domain"
status: pending
priority: P2
effort: 18h
branch: master
tags: [architecture, n8n, workflow, trading, agi]
created: 2026-03-01
---

# n8n Architecture Patterns for Algo-Trader AGI

## Summary

Learn from n8n's workflow automation patterns and apply them to algo-trader. Goal: composable trading pipelines (DAG nodes), async execution queue, structured error recovery, and credential management. NOT copying n8n code -- adapting patterns to trading domain.

## Key n8n Patterns Applied

| n8n Pattern | Trading Application |
|---|---|
| DAG node execution | Strategy pipeline as composable nodes |
| `INodeExecutionData[]` item flow | Market data items flowing through node chain |
| Bull/Redis queue workers | Parallel multi-symbol signal fan-out |
| Error Trigger workflow | Circuit breaker + dead letter queue for failed trades |
| AES credential vault | Already exists (`CredentialVault.ts`), enhance with rotation/sharing |

## Architecture Fit

Existing components already hint at pipeline patterns: `BotEngine` orchestrates `IStrategy -> RiskManager -> ExchangeClient`. `StrategyEnsemble` + `SignalGenerator` + `SignalFilter` form an implicit pipeline. This plan formalizes it into explicit composable nodes.

## Phases

| # | Phase | Effort | Status |
|---|---|---|---|
| 1 | [Workflow Node System](./phase-01-workflow-node-system.md) | 4h | pending |
| 2 | [Strategy Pipeline Builder](./phase-02-strategy-pipeline-builder.md) | 4h | pending |
| 3 | [Execution Queue (BullMQ)](./phase-03-execution-queue-bullmq.md) | 4h | pending |
| 4 | [Error Workflow + DLQ](./phase-04-error-workflow-dlq.md) | 3h | pending |
| 5 | [Credential Vault Enhancement](./phase-05-credential-vault.md) | 3h | pending |

## Dependencies

- Phase 2 depends on Phase 1 (node interfaces)
- Phase 3 independent (queue layer)
- Phase 4 depends on Phase 3 (queue error hooks)
- Phase 5 independent (vault enhancement)

## Research Sources

- [research/researcher-01-n8n-core-architecture.md](./research/researcher-01-n8n-core-architecture.md)
- [research/researcher-02-n8n-scaling-ai-patterns.md](./research/researcher-02-n8n-scaling-ai-patterns.md)

## Unresolved Questions

1. Redis dependency -- acceptable for queue mode or keep in-memory queue as default?
2. Node serialization format -- JSON workflow files or code-only composition?
3. Should `BotEngine` be refactored to use pipeline, or keep it as a separate path?
