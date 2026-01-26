# Architecture Guide

## Overview

The Realtime Collaboration Kit uses a centralized Operational Transformation (OT) approach. The server acts as the source of truth and responsible for ordering operations.

### Data Flow

1. **Initialization**:
   - Client connects via WebSocket to `/ws/{room_id}`.
   - Server sends `init` message with full document content, revision number, and active users.

2. **Client Updates**:
   - User types a character.
   - `useCollaborativeDoc` applies the change locally (optimistic UI).
   - An `operation` message is sent to the server with the operation (insert/delete) and the *base revision* it was applied on.

3. **Server Processing**:
   - Server receives operation.
   - Checks client's base revision against current server revision.
   - If `client_rev < server_rev`, the server transforms the client's operation against all intervening operations (concurrent changes).
   - Server applies the (possibly transformed) operation to the document.
   - Increments revision.
   - Broadcasts the operation to all clients.

4. **Client Synchronization**:
   - Client receives remote operation.
   - Transforms the remote operation against any *pending* (unacknowledged) local operations.
   - Applies the transformed operation to the local document.

### OT Algorithm

We implement a simplified inclusion transformation (IT) supporting `INSERT` and `DELETE`.

- `T(op1, op2) -> (op1', op2')`
- Handles shifting positions based on insertions/deletions.
- Resolves conflicts (e.g., insert at same position) deterministically (Server wins/Timestamp).

### Presence System

- **Heartbeats**: Not explicitly implemented in v1 (relies on WebSocket connection state), but `last_active` is tracked on any message.
- **Cursors**: Ephemeral messages (`cursor` type) are broadcast to others but not stored permanently.
- **Timeouts**: `PresenceTracker` has a cleanup method to remove stale users (can be triggered by a background task).

## Directory Structure

- `backend/`: Python server logic.
- `frontend/`: React components and hooks.
- `shared/`: (Conceptual) Types and OT logic mirrors.

## Scalability

For production use:
- Replace in-memory `RoomManager` with Redis Pub/Sub for multi-server scaling.
- Persist documents to a database (PostgreSQL/MongoDB) periodically or on room closure.
