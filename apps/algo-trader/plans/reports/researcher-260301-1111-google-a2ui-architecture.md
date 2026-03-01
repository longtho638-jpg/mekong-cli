# Research Report: Google A2UI (Agent-to-User Interface) Architecture

**Date:** 2026-03-01
**Researcher:** researcher subagent
**Scope:** A2UI protocol spec, agent UX patterns, algo-trader mapping

---

## Executive Summary

A2UI is a real, open-source protocol launched by Google in December 2025 (v0.8 Public Preview). It defines how AI agents generate rich, interactive UIs declaratively via JSON — without executing arbitrary code. Agents emit structured JSON describing component trees; clients render them using native widgets from a pre-approved catalog. This solves the core trust problem: agents can produce dynamic UIs across trust boundaries safely.

For the algo-trader system, A2UI is directly applicable: trading agents can surface order confirmations, live P&L dashboards, risk alerts, and strategy control panels dynamically — replacing the current static CLI dashboard with agent-driven, context-aware interfaces.

---

## Research Methodology

- Sources: 8 primary sources (official A2UI docs, GitHub, Google Developers Blog, CopilotKit, Smashing Magazine, a2aprotocol.ai, Gemini synthesis)
- Date range: Dec 2025 – Feb 2026
- Key search terms: "Google A2UI", "Agent to User Interface", "A2UI architecture", "agentic AI UX patterns 2025 2026"

---

## Key Findings

### 1. What Is A2UI

**Official definition:** A2UI (Agent-to-User Interface) is a declarative, JSON-based open protocol enabling AI agents to generate rich, interactive user interfaces across platforms without executing arbitrary code.

**Launched:** December 2025 by Google
**Status:** v0.8 (Public Preview, battle-hardened), v0.9 (Draft)
**License:** Apache 2.0
**Repo:** [github.com/google/A2UI](https://github.com/google/A2UI)
**Spec site:** [a2ui.org](https://a2ui.org)

**Problem solved:** How can agents safely transmit rich UIs across trust boundaries? Text-only responses are too limited; arbitrary code execution (HTML/JS) is a security risk. A2UI sits in between — expressive like code, safe like data.

---

### 2. Core Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AGENT SIDE                               │
│  Agent (Gemini/GPT/any LLM)                                    │
│  → Generates A2UI JSON payload                                  │
│  → Sends via transport (A2A Protocol / AG-UI / SSE / WebSocket) │
└──────────────────────────────┬──────────────────────────────────┘
                               │  JSONL messages
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TRANSPORT LAYER                            │
│  AG-UI (event-based, bi-directional, real-time)                │
│  or A2A Protocol (Agent-to-Agent multi-agent mesh)              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT SIDE                                │
│  Component Catalog (trusted registry of approved widgets)       │
│  → Parses JSON, builds component tree                          │
│  → Binds data model (path-based reactive bindings)             │
│  → Renders native widgets (React / Flutter / Web / SwiftUI)    │
│  → Returns typed userAction events back to agent               │
└─────────────────────────────────────────────────────────────────┘
```

**Three decoupled layers:**
1. **Content Layer (A2UI)** — describes UI structure + component specs
2. **Transport Layer (AG-UI)** — event-based bi-directional communication
3. **Rendering Layer (Client)** — platform-native widget mapping

---

### 3. Protocol: Message Types

Four core message types form the interaction loop:

| Message | Purpose | Key Fields |
|---------|---------|------------|
| `beginRendering` | Signals client to start rendering | `surfaceId`, `root` (root component ID), `styles` |
| `surfaceUpdate` | Defines component tree + layout | Component array with IDs, types, children |
| `dataModelUpdate` | Populates components with runtime data | Path-based JSON bindings e.g. `"path": "/portfolio/pnl"` |
| `deleteSurface` | Removes rendered surface | `surfaceId` |

**Format:** JSONL (JSON Lines) — optimized for incremental LLM streaming

**Example payload structure:**
```json
[
  {
    "type": "beginRendering",
    "surfaceId": "order-confirmation-panel",
    "root": "root-card",
    "styles": { "primaryColor": "#1A73E8", "fontFamily": "Roboto" }
  },
  {
    "type": "surfaceUpdate",
    "surfaceId": "order-confirmation-panel",
    "components": [
      { "id": "root-card", "type": "Card", "children": ["title", "order-detail", "action-row"] },
      { "id": "title", "type": "Text", "value": "Confirm Order" },
      { "id": "order-detail", "type": "DataTable", "dataBinding": "/order/details" },
      { "id": "action-row", "type": "Row", "children": ["btn-confirm", "btn-cancel"] },
      { "id": "btn-confirm", "type": "Button", "label": "Execute Trade", "action": "CONFIRM_ORDER" },
      { "id": "btn-cancel", "type": "Button", "label": "Cancel", "action": "CANCEL_ORDER" }
    ]
  },
  {
    "type": "dataModelUpdate",
    "data": {
      "order": {
        "details": { "pair": "BTC/USDT", "side": "BUY", "qty": 0.01, "price": 65000 }
      }
    }
  }
]
```

---

### 4. Component Catalog (Security Model)

**Core security principle:** Agents cannot create arbitrary components. They can only request components from the client's pre-approved catalog.

**Built-in catalog types (v0.8):**
- Layout: `Card`, `Row`, `Column`, `Grid`, `Stack`
- Display: `Text`, `DataTable`, `Chart`, `Badge`, `Progress`
- Input: `Button`, `TextField`, `DateTimeInput`, `Select`, `Toggle`
- Feedback: `Alert`, `Modal`, `Spinner`, `Toast`
- Composite: `Form`, `ApprovalPanel`, `StatusBar`

**Custom catalog extension:** Developers register "Smart Wrappers" to add domain-specific components (e.g., `TradingChart`, `OrderBook`, `RiskGauge`).

**Trust enforcement:**
- Client maintains whitelist — agent requests unknown component → client ignores or falls back
- No code execution risk: agent describes data, client owns rendering logic
- Multi-agent mesh: untrusted sub-agents constrained to catalog vocabulary

---

### 5. Interaction Loop

```
Agent → [beginRendering] → Client renders skeleton
Agent → [surfaceUpdate]  → Client maps components to native widgets
Agent → [dataModelUpdate]→ Client binds reactive data (path refs)
User  → [click/input]    → Client emits typed userAction event
Agent ← [userAction]     → Agent reasons on structured event (not free text)
Agent → [dataModelUpdate]→ Client updates UI reactively
```

Key insight: user interactions return as **typed `userAction` events**, not free-form text. This gives agents structured, machine-parseable feedback.

---

### 6. Design Principles

| Principle | Description |
|-----------|-------------|
| **Security First** | Declarative data ≠ executable code. Catalog whitelist prevents injection |
| **LLM-Friendly** | Flat component list + ID references → easy for LLMs to generate incrementally |
| **Framework-Agnostic** | Same JSON renders to React, Flutter, Web Components, SwiftUI |
| **Progressive Rendering** | `beginRendering` signals start; components stream in, UI builds progressively |
| **Separation of Concerns** | Agent owns intent; client owns rendering; transport owns delivery |
| **Dual-Mode Support** | Clients advertise A2UI capability; agents fall back to text if client doesn't support it |

---

### 7. Agent UX Patterns (Agentic Design Standards 2025-2026)

Beyond the protocol, Google's research (PAIR, DeepMind, I/O 2025) defines 6 lifecycle patterns for agent-user interaction:

#### Pre-Action Patterns

**1. Intent Preview**
- Agent shows what it will do before execution
- Step-by-step plan in plain language
- Decision paths: Proceed / Edit / Handle Manually
- Critical for: irreversible actions (trades, orders, fund transfers)
- KPI: >85% acceptance without edits

**2. Autonomy Dial (Variable Control Ladder)**
Four-tier autonomy model:
```
[Observe & Suggest] → [Plan & Propose] → [Act with Confirmation] → [Act Autonomously]
```
- Task-specific granularity (different settings per strategy)
- For trading: could be per-instrument or per-risk-level

#### In-Action Patterns

**3. Explainable Rationale**
- "Because RSI crossed 30 and SMA20 > SMA50, I triggered BUY"
- Links decision to specific signal/rule
- KPI: reduction in support tickets about confusing agent behavior

**4. Confidence Signal**
- Surfaces agent's self-assessed confidence (e.g., "Signal strength: 73%")
- Combats automation bias
- KPI: Pearson correlation >0.8 between stated confidence and user acceptance

**5. Thought Summaries (Google I/O 2025)**
- For reasoning models: display "thinking breadcrumb" before execution
- "Thinking budget" control: users adjust computational depth vs speed

#### Post-Action Patterns

**6. Action Audit & Undo**
- Chronological log of all agent actions with status
- Persistent undo with clear time windows
- KPI: undo rate <5% per task (higher = users distrust automation)

**7. Escalation Pathway**
- Agent acknowledges uncertainty → requests clarification → loops in human
- KPI: 5-15% escalation frequency; >90% task completion post-escalation

---

### 8. Current Status & Ecosystem

| Item | Status |
|------|--------|
| Spec version | v0.8 (stable preview), v0.9 (draft) |
| Client libraries | Flutter ✅, Web Components ✅, Angular ✅ |
| Planned | React, Jetpack Compose, iOS SwiftUI, REST transport |
| Framework integrations | Genkit (planned), LangGraph (planned) |
| Transport compatibility | A2A Protocol, AG-UI, SSE, WebSockets |
| LLM compatibility | Any JSON-capable model (Gemini, GPT, Claude) |
| Developer preview | CopilotKit `createA2UIMessageRenderer()` factory |
| Community | Apache 2.0, open contributions welcomed |

**Roadmap to v1.0:** Spec stabilization, additional renderers, Genkit/LangGraph support, REST transport.

---

## Algo-Trader Mapping

### Current State

`src/ui/CliDashboard.ts` — static CLI dashboard. No agent-driven UI. No dynamic panels. No structured user feedback loop.

### A2UI Integration Architecture for Algo-Trader

```
┌──────────────────────────────────────────────────────────────────┐
│                    ALGO-TRADER AGENT LAYER                       │
│                                                                  │
│  BotEngine.ts ──→ generates A2UI JSON payloads                  │
│  RiskManager.ts ─→ surfaces risk alerts via Alert components     │
│  ArbitrageEngine ─→ surfaces opportunity panels via Card        │
│  StrategyLoader ──→ generates Autonomy Dial controls            │
└──────────────────────────────┬───────────────────────────────────┘
                               │ JSONL via SSE / WebSocket
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                  TRANSPORT LAYER                                 │
│  AG-UI or direct SSE from existing gateway                      │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                  CLIENT CATALOG (algo-trader specific)           │
│                                                                  │
│  Custom components:                                              │
│  TradingChart, OrderBook, RiskGauge, PositionPanel              │
│  StrategyToggle, ArbitrageOpportunityCard                        │
│  P&LTimeline, ExecutionLog, KellySlider                         │
│                                                                  │
│  Standard components:                                            │
│  DataTable, Button, Alert, Badge, Card, Text, Progress          │
└──────────────────────────────────────────────────────────────────┘
```

### Pattern-to-Feature Mapping

| A2UI / Agent UX Pattern | Algo-Trader Feature |
|------------------------|---------------------|
| **Intent Preview** | Before executing large order: "I will BUY 0.01 BTC at ~65,000 via Binance. Proceed?" |
| **Autonomy Dial** | Per-strategy autonomy: RSI strategy = Act with Confirmation; Arbitrage = Act Autonomously (low risk) |
| **Explainable Rationale** | "Triggered BUY: RSI(14)=28 < 30, SMA20 crossed above SMA50, regime = trending" |
| **Confidence Signal** | "Signal strength: 73% — moderate confidence. Kelly fraction: 0.35 → sized at 35% max position" |
| **Thought Summaries** | Show AGI Arbitrage Engine reasoning steps before executing cross-exchange spread trade |
| **Action Audit & Undo** | Full execution log in `src/reporting/` + order cancellation via `OrderManager` |
| **Escalation Pathway** | If spread < min_profit_threshold or regime uncertain → surface alert, pause, await human confirmation |
| **surfaceUpdate** | Dynamic order confirmation panel rendered by `BotEngine` before each trade |
| **dataModelUpdate** | Live P&L, position sizes, spread data pushed reactively to dashboard |
| **userAction events** | Typed events: `CONFIRM_ORDER`, `CANCEL_ORDER`, `ADJUST_KELLY`, `TOGGLE_STRATEGY` |
| **Component Catalog** | `TradingChart` (price + indicators), `RiskGauge` (current exposure), `ArbitrageCard` (spread opportunity) |

### Concrete A2UI Payload Example for Algo-Trader

```json
// BotEngine emits this before executing a BUY signal
[
  {
    "type": "beginRendering",
    "surfaceId": "trade-confirmation",
    "root": "confirm-card",
    "styles": { "primaryColor": "#0F9D58" }
  },
  {
    "type": "surfaceUpdate",
    "surfaceId": "trade-confirmation",
    "components": [
      { "id": "confirm-card", "type": "Card", "children": ["header", "rationale", "risk-row", "actions"] },
      { "id": "header", "type": "Text", "value": "Trade Signal: BUY BTC/USDT" },
      { "id": "rationale", "type": "Text", "dataBinding": "/signal/rationale" },
      { "id": "risk-row", "type": "RiskGauge", "dataBinding": "/signal/kelly_fraction" },
      { "id": "actions", "type": "Row", "children": ["btn-execute", "btn-skip", "btn-adjust"] },
      { "id": "btn-execute", "type": "Button", "label": "Execute", "action": "CONFIRM_ORDER" },
      { "id": "btn-skip", "type": "Button", "label": "Skip", "action": "SKIP_SIGNAL" },
      { "id": "btn-adjust", "type": "Button", "label": "Adjust Size", "action": "OPEN_KELLY_DIAL" }
    ]
  },
  {
    "type": "dataModelUpdate",
    "data": {
      "signal": {
        "rationale": "RSI(14)=28 (oversold) + SMA20 > SMA50 (trend confirm) + Regime=TRENDING",
        "kelly_fraction": 0.35,
        "proposed": { "pair": "BTC/USDT", "side": "BUY", "qty": 0.01, "est_price": 65000 }
      }
    }
  }
]
```

### Implementation Path for Algo-Trader

**Phase 1 (Minimal):**
- Add A2UI JSON emitter to `BotEngine.ts`
- Extend `CliDashboard.ts` to accept + render A2UI payloads (text fallback for now)
- Implement 3 surfaces: trade-confirmation, risk-alert, position-summary

**Phase 2 (Web UI):**
- Add SSE endpoint to serve A2UI stream from `BotEngine`
- Build React client with `createA2UIMessageRenderer()` (CopilotKit)
- Register custom catalog: `TradingChart`, `RiskGauge`, `ArbitrageCard`

**Phase 3 (Autonomy Control):**
- Implement Autonomy Dial per strategy (stored in config/IConfig.ts)
- Action Audit log surfaced via A2UI `surfaceUpdate` on `deleteSurface` cycle
- Escalation pathway for regime uncertainty (RiskManager → surfaces `Alert` + pauses bot)

---

## Comparative Context

| Approach | Security | Flexibility | LLM-Friendly | Interactivity |
|----------|----------|-------------|--------------|---------------|
| Text-only chat | High | Low | High | None |
| Arbitrary HTML/JS | Low | High | Low | High |
| iFrame sandbox | Medium | Medium | Low | Medium |
| **A2UI (catalog-based)** | **High** | **High** | **High** | **High** |

A2UI is the only approach combining all four properties.

---

## Resources

- [A2UI Official Site](https://a2ui.org/introduction/what-is-a2ui/)
- [GitHub: google/A2UI](https://github.com/google/A2UI)
- [Google Developers Blog: Introducing A2UI](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/)
- [CopilotKit: Build with A2UI + AG-UI](https://www.copilotkit.ai/blog/build-with-googles-new-a2ui-spec-agent-user-interfaces-with-a2ui-ag-ui)
- [A2A Protocol: Complete A2UI Guide](https://a2aprotocol.ai/blog/a2ui-guide)
- [Analytics Vidhya: A2UI Explained](https://www.analyticsvidhya.com/blog/2025/12/google-a2ui-explained/)
- [Grid Dynamics: AI Agent for UI with A2UI](https://www.griddynamics.com/blog/ai-agent-for-ui-a2ui)
- [Smashing Magazine: Designing for Agentic AI UX Patterns](https://www.smashingmagazine.com/2026/02/designing-agentic-ai-practical-ux-patterns/)
- [MarkTechPost: Google Introduces A2UI](https://www.marktechpost.com/2025/12/22/google-introduces-a2ui-agent-to-user-interface-an-open-sourc-protocol-for-agent-driven-interfaces/)

---

## Unresolved Questions

1. **React client library availability** — v0.8 has Flutter + Web Components + Angular. React renderer is on roadmap but no release date. CopilotKit provides a bridge (`createA2UIMessageRenderer`) but it's third-party. When will official React client land?

2. **Spec stability** — v0.8 is "battle-hardened" but pre-1.0. How many breaking changes expected before v1.0? Risk for algo-trader integration.

3. **Real-time streaming semantics** — How does `dataModelUpdate` handle high-frequency updates (e.g., tick-by-tick price data)? Is there throttling/debounce spec?

4. **Bidirectional userAction schema** — The typed `userAction` event schema is not fully documented in public sources. Need to review GitHub for the full event taxonomy.

5. **A2A Protocol dependency** — Is A2A Protocol required for multi-agent scenarios, or can A2UI work purely with SSE/WebSockets in a single-agent system like algo-trader?

6. **Financial/trading-specific component patterns** — No official A2UI examples exist for trading/fintech. Custom catalog design (TradingChart, RiskGauge) would be greenfield work.
