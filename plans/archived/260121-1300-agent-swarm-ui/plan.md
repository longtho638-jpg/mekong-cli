# Phase 15: Agent Swarm UI (Real-time & Interactive)

**Status**: In Progress
**Priority**: P2
**Goal**: Upgrade the Swarm Dashboard to a real-time, interactive "Mission Control" for agents using WebSockets.

## Context
Phase 12 gave us a basic Swarm UI using polling. Phase 15 will replace this with a WebSocket-based real-time connection, allowing users to watch agents think and act instantly. We will also add a chat interface to directly interact with specific agents.

## Objectives

1.  **Real-time Infrastructure (WebSockets)**
    - [ ] Implement `WebSocketManager` in Backend (`backend/websocket/manager.py`).
    - [ ] Add WebSocket endpoint to `backend/main.py`.
    - [ ] Update `MessageBus` to broadcast events to WebSocket clients.

2.  **Frontend Real-time Client**
    - [ ] Create `useSwarmSocket` hook in `apps/dashboard`.
    - [ ] Update `SwarmPage` to use WebSocket events instead of polling.

3.  **Interactive Agent Chat**
    - [ ] Create `AgentChat` component.
    - [ ] Support direct messaging to agents via UI.
    - [ ] Display "typing" states for agents.

4.  **Task Trace Visualization**
    - [ ] Visualize the chain of thought/execution path (e.g., Architect -> Coder -> Reviewer).
    - [ ] Display node status (Pending, Running, Completed, Failed).

## Execution Plan

### Step 1: Backend WebSocket Support
- [ ] Install `websockets` (if needed, or use FastAPI built-in).
- [ ] Create `ConnectionManager`.
- [ ] Hook `MessageBus.publish` to broadcast to connected clients.

### Step 2: Frontend Socket Hook
- [ ] Implement `useSwarmSocket`.
- [ ] Handle connection states (Connecting, Connected, Disconnected).

### Step 3: Interactive UI
- [ ] Build `AgentChat` component.
- [ ] Update `SwarmVisualizer` to render live updates.

### Step 4: Verification
- [ ] Test real-time message delivery.
- [ ] Verify multi-client sync.

## Deliverables
- Real-time Swarm Dashboard.
- Interactive Chat Interface.
