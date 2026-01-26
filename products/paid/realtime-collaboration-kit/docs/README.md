# Realtime Collaboration Kit

A full-stack solution for adding Google Docs-style collaboration to your React applications.

## Features

- **Realtime Text Synchronization**: Uses Operational Transformation (OT) to ensure document consistency across multiple users.
- **Presence Tracking**: See who is online, idle, or offline.
- **Collaborative Cursors**: Realtime visualization of other users' cursors and selections.
- **Typing Indicators**: Visual cues when others are typing.
- **Room Management**: Support for multiple isolated document rooms.

## Architecture

- **Backend**: Python FastAPI with WebSockets.
- **Frontend**: React hooks and components (`useCollaborativeDoc`, `CollaborativeEditor`).
- **Protocol**: JSON-based WebSocket messages with OT payloads.

## Quick Start

### Backend

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the server:
   ```bash
   uvicorn backend.websocket_server:app --reload
   ```

### Frontend Usage

Copy the `frontend` folder into your React project.

```tsx
import { CollaborativeEditor } from './frontend/components/CollaborativeEditor';

function App() {
  return (
    <CollaborativeEditor
      wsUrl="ws://localhost:8000/ws"
      roomId="doc-123"
      userId="user-1"
      username="Alice"
      userColor="#FF5733"
    />
  );
}
```

## Documentation

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed design and [EXAMPLES.md](docs/EXAMPLES.md) for advanced usage.
