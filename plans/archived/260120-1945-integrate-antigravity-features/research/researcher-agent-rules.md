# Researcher Report: Antigravity Core & Agency OS Analysis
**ID**: a695204 | **Date**: 2026-01-20
**CWD**: `/Users/macbookprom1/mekong-cli`

## 1. Agent Orchestration: Current State & Analysis

### Infrastructure & Dual-Layer Execution
The codebase implements a sophisticated two-tier orchestration model:
*   **Low-Level Swarm (`antigravity/core/agent_swarm/`)**: A robust, thread-safe execution engine (`AgentRegistry`, `SwarmCoordinator`, `TaskExecutor`). It handles asynchronous task assignment, specialty-based matching, and performance tracking (throughput, avg execution time).
*   **High-Level Orchestrator (`antigravity/core/agent_orchestrator/`)**: A facade/conductor layer that maps command suites (e.g., `dev`, `revenue`) to "Agent Chains" defined in YAML.

### Agent Definition & Discovery
*   **Definition**: Agents are defined as Markdown instruction files in `.claude/agents/` (e.g., `planner.md`, `binh-phap-strategist.md`).
*   **Inventory**: `antigravity/core/agent_chains/inventory.py` maintains a central registry of **26 agents** categorized into: `DEVELOPMENT`, `BUSINESS`, `CONTENT`, `DESIGN`, and `EXTERNAL`.
*   **Chains**: `antigravity/core/config/chains.yaml` replaces hardcoded logic with a declarative sequence of steps.

### Gaps vs. Visual Agent Manager
*   **Communication**: Communication is primarily via task payloads and results in-memory. Lacks a persistent "Shared Blackboard" for complex, long-running cross-agent reasoning.
*   **Visualization**: Current state is monitored via `monitor.py` and `reporting.py` (CLI-focused). No real-time visual graph representation of agent interactions or swarm bottlenecks exists.

## 2. Rules & Workflows: Scalability Analysis

### Rule Distribution
*   **Locations**: Divided between `.claude/rules/` (Project defaults) and `.agencyos/rules/` (Agency-wide).
*   **Management**: Handled via file injection and the `QUANTUM_MANIFEST.md`.
*   **Volume**: Currently ~10-15 core rule files. Reaching 500+ rules will require a transition from "File Injection" to a **Vector-based Rule Retrieval** or a structured **Rule Graph** with priority weights.

### Workflow Engine
*   **Logic**: `antigravity/core/agent_chains/engine.py` acts as the primary rule/workflow selector based on the `chains.yaml` configuration.
*   **Protocol**: `orchestration-protocol.md` and `primary-workflow.md` define the "How-To" for agent coordination.

## 3. "Nuclear" & "Win-Win-Win" Features

### High-Leverage Engines
*   **Win-Win-Win Gate**: Implemented as both a Python validator (`antigravity/core/algorithm/validation.py`) and a Node.js hook (`.claude/hooks/win-win-win-gate.cjs`). It enforces a hard block if criteria for **Anh (Owner)**, **Agency**, and **Client** aren't met.
*   **Quota Engine**: `packages/antigravity/core/quota/engine.py` is the "Economic Core". It manages model quotas across multiple accounts/keys to maximize Gemini 1M usage while minimizing costs.
*   **ML Engine**: `antigravity/core/algorithm/ml_engine/core.py` handles pricing optimization using inference/training modules.

### Master Algorithm
*   `antigravity/core/algorithm/engine.py`: Single source of truth for pricing, lead scoring (BANT), and revenue forecasting.

## 4. Summary of Gaps & Proposed Updates

| Component | Current State | Antigravity Standard (Gap) |
| :--- | :--- | :--- |
| **Agent Count** | 26 Agents | 50+ Specialized Agents |
| **Rule Count** | ~15 Rules | 500+ Atomic Rules |
| **Orchestration** | Linear Chains (YAML) | Dynamic Branching / Graph-based |
| **Knowledge** | Static Manifest | Dynamic Context Weaver / RAG |
| **UI/UX** | CLI / Basic HTML | Real-time Visual Swarm Manager |

## 5. Implementation Recommendations

1.  **Knowledge Layer Update**:
    *   Implement an automated indexer for `.claude/rules/` to generate/update `QUANTUM_MANIFEST.md` dynamically.
    *   Create a `RuleRegistry` in Python to allow `AntigravityAlgorithm` to query rules programmatically.

2.  **Core Layer Update**:
    *   Extend `chains.yaml` to support `parallel: true` for specific steps.
    *   Integrate `AgentSwarm` directly into `OrchestratorDelegator` to replace simulated execution with actual swarm tasks.

3.  **Nuclear Expansion**:
    *   Deploy `quota_engine.py` as a central service to be shared across all sub-agents.
