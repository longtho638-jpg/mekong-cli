---
title: "Agent Performance Benchmarking & Optimization"
description: "Implement a comprehensive benchmarking engine to track agent latency, success rates, and token costs for the Antigravity swarm."
status: completed
priority: P2
effort: 16h
branch: feat/agent-benchmarking
tags: [observability, performance, agents, ai-ops]
created: 2026-01-22
---

# 📈 Agent Performance Benchmarking & Optimization

> Design and implement Phase 18 of the AgencyOS roadmap: a data-driven observability layer for the Antigravity multi-agent system.

## 📋 Execution Tasks

- [x] **Phase 1: Instrumentation & Data Collection**
  - [x] Implement a standardized `TelemetryWrapper` for all 24+ Antigravity agents.
  - [x] Capture key metrics: `execution_time`, `input_tokens`, `output_tokens`, `success_status`, `retry_count`.
  - [x] Log metrics to a persistent storage layer (Supabase `agent_metrics` table).
- [ ] **Phase 2: Benchmarking Engine**
  - [x] Create a standalone CLI tool `/benchmark` to run standardized test suites across agents.
  - [ ] Define "Golden Datasets" for each agent role (Planning, Implementation, Review).
  - [ ] Implement automated regression testing for agent performance.
- [ ] **Phase 3: Cost Observability**
  - [x] Integrate with `quota_engine.py` to provide real-time ROI analysis per agent invocation.
  - [x] Generate daily cost reports grouped by agent type and task category.
- [ ] **Phase 4: Optimization & Prompt Tuning**
  - [ ] Identify high-latency/high-cost bottlenecks in sequential workflows.
  - [ ] Implement automated prompt versioning and A/B testing for agent instructions.
  - [ ] Create a "Performance Scorecard" UI for the AgencyOS Dashboard.

## 🔍 Context

### Technical Strategy
- **Observability**: Use a lightweight decorator pattern to instrument Python agents without altering core logic.
- **Data Flow**: Agent telemetry is pushed asynchronously to Supabase to avoid adding latency to the main execution loop.
- **Analysis**: Use historical data to establish baselines and trigger alerts when performance deviates significantly.

### Affected Files
- `antigravity/core/agent_base.py`: Add telemetry hooks.
- `antigravity/core/telemetry.py`: New telemetry and instrumentation module.
- `scripts/benchmark_agents.py`: New benchmarking CLI.
- `docs/project-roadmap.md`: Update phase status.

## 🛠️ Implementation Steps

### 1. Telemetry Foundation
Define the schema for `agent_metrics` and implement the base Python decorator for tracking execution metadata.

### 2. Workflow Tracing
Implement "Parent-Child" correlation IDs to trace token consumption across complex chains (e.g., Planner -> 3x Researcher -> Planner).

### 3. Benchmarking Suites
Develop role-specific benchmarks that test accuracy and speed using predefined inputs and expected outcomes.

## 🏁 Success Criteria
- [ ] 100% of Antigravity agents are instrumented with telemetry.
- [ ] Benchmarking tool identifies at least 2 major bottlenecks in current workflows.
- [ ] Cost observability dashboard provides per-task pricing transparency.
- [ ] Performance data is used to optimize at least one agent prompt for 10% faster execution.

## ⚠️ Risks & Mitigations
- **Overhead**: Telemetry must add < 50ms to execution time. Use async logging.
- **Data Volume**: Sample telemetry for high-frequency low-value tasks to manage database storage.
- **Accuracy**: Benchmarks must represent real-world tasks to be actionable.
