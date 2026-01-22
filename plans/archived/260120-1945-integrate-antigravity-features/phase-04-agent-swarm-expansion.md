---
title: "Phase 04: Agent Swarm Expansion"
description: "Enhance orchestrator for dynamic/graph execution and implement a Shared Blackboard system."
status: pending
priority: P2
effort: 10h
branch: feat/antigravity-integration
tags: [agents, swarm, graph-execution]
created: 2026-01-20
---

# 📜 Phase 04: Agent Swarm Expansion

## 🔍 Context Links
- [Researcher Report: Antigravity Core & Agency OS Analysis](./research/researcher-agent-rules.md)
- [Agent Swarm Module](../../antigravity/core/agent_swarm/)

## 📋 Overview
- **Priority**: P2
- **Status**: Pending
- **Description**: Move beyond linear YAML chains to dynamic, graph-based agent orchestration with shared memory (Blackboard). This prepares the system for a future Visual Swarm Manager.

## 💡 Key Insights
- Complex tasks (e.g., "Build a full-stack app") require parallel execution and loops that linear chains can't handle.
- Agents need a way to share intermediate state without passing massive payloads.

## 🎯 Requirements
- **Graph-based Execution**: Support branching and loops in `chains.yaml`.
- **Shared Blackboard**: A central, thread-safe memory space for all agents in a swarm.
- **Dynamic Task Routing**: Route tasks based on real-time agent availability and performance metrics.

## 🏗️ Architecture
- **Graph Orchestrator**: Uses a Directed Acyclic Graph (DAG) for step execution.
- **Blackboard Store**: A key-value store with versioning for shared context.

## 📂 Related Code Files
- `antigravity/core/agent_swarm/coordinator.py`: Task distribution logic.
- `antigravity/core/agent_orchestrator/engine.py`: High-level workflow controller.
- `antigravity/core/agent_memory/system.py`: Base for Blackboard implementation.

## 🚀 Implementation Steps
1. **Extend `chains.yaml` Schema**: Add support for `parallel`, `if`, and `goto` logic.
2. **Implement Blackboard API**: Create a thread-safe context manager for shared state.
3. **Update Coordinator**: Integrate real-time performance metrics from `agent_swarm/state.py` for smarter routing.
4. **Visual Data Export**: Expose execution traces in a format compatible with graph visualization tools (e.g., Mermaid, D3).

## ✅ Success Criteria
- [ ] Multiple agents can run in parallel within a single chain step.
- [ ] Agents can read/write to the Blackboard to share state.
- [ ] Orchestrator can handle conditional branching based on agent output.

## ⚠️ Risk Assessment
- **Deadlocks**: Parallel execution with shared memory can lead to race conditions.
- **Complexity**: Graph-based debugging is harder than linear debugging.

## 🔒 Security Considerations
- Namespace Blackboard entries to prevent one swarm from leaking data to another.
