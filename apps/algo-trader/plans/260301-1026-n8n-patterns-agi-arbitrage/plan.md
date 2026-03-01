---
title: "n8n Patterns → AGI Arbitrage Engine"
description: "Learn n8n architecture patterns (workflow nodes, queue workers, credential vault, error workflows, metrics) and apply to algo-trader AGI ecosystem"
status: pending
priority: P2
effort: 6h
branch: master
tags: [arbitrage, n8n, architecture, agi, patterns]
created: 2026-03-01
---

# n8n Patterns → AGI Arbitrage Engine

## Binh Phap Ch.3 謀攻: Học từ n8n, áp dụng vào algo-trader

> "Thượng binh phạt mưu" — Learn the best patterns, don't reinvent the wheel.

## Research Sources

- `research/researcher-01-n8n-workflow-architecture.md`
- `research/researcher-02-n8n-credential-error-scaling.md`

## Implementation Phases

| # | Phase | Status | Effort | Files |
|---|-------|--------|--------|-------|
| 1 | [Workflow Node System](phase-01-workflow-node-system.md) | pending | 2h | 3 new |
| 2 | [Error Workflow Pattern](phase-02-error-workflow-handler.md) | pending | 1h | 1 new |
| 3 | [Credential Vault](phase-03-credential-vault.md) | pending | 1.5h | 1 new, 1 edit |
| 4 | [Metrics Collector](phase-04-metrics-collector.md) | pending | 1h | 1 new |
| 5 | [Integration + Tests + Commit](phase-05-integration-tests.md) | pending | 0.5h | 2 edit, 1 new |

## Key n8n Patterns Applied

| n8n Pattern | Algo-Trader Application |
|-------------|------------------------|
| Node `execute(INodeExecutionData[])` | Strategy node `process(MarketData): TradeSignal` |
| BullMQ queue + workers | Future: separate price-feed vs order-exec workers |
| AES-256 credential store | `CredentialVault` encrypts exchange API keys at rest |
| Error Trigger workflow | `ErrorWorkflowHandler` routes failed trades to recovery |
| `/metrics` Prometheus | `MetricsCollector` tracks arb opportunities, P&L, latency |

## Dependencies

- Existing: `@agencyos/vibe-arbitrage-engine`, `@agencyos/trading-core`
- No new npm packages required (Node.js crypto for AES-256)
