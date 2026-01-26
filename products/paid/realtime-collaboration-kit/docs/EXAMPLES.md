# Examples

## Basic Integration

```tsx
import { CollaborativeEditor } from './components/CollaborativeEditor';

export default function Page() {
  return (
    <div className="h-screen p-4">
      <CollaborativeEditor
        wsUrl="wss://api.myapp.com/ws"
        roomId="document-id-uuid"
        userId="current-user-id"
        username="John Doe"
        userColor="#00AAFF"
      />
    </div>
  );
}
```

## Custom UI with Hooks

If you want to build your own editor UI (e.g. using Quill or Slate) but use our logic:

```tsx
import { useCollaborativeDoc } from './hooks/useCollaborativeDoc';

function CustomEditor() {
  const {
    content,
    submitOperation,
    users
  } = useCollaborativeDoc({
    wsUrl: "ws://localhost:8000/ws",
    roomId: "doc-1",
    userId: "u1",
    username: "Me",
    userColor: "#000"
  });

  const handleChange = (newText) => {
    // Calculate diff and submit op
    // submitOperation({ type: 'insert', position: 0, value: 'a' });
  };

  return (
    <div>
      <div className="users">
        {users.map(u => <span key={u.user_id}>{u.username}</span>)}
      </div>
      <textarea value={content} onChange={e => handleChange(e.target.value)} />
    </div>
  );
}
```

## Integrating with existing Auth

Pass the JWT token as a query parameter or handle it in the `useWebSocket` hook by modifying the connection URL construction.

```typescript
// useWebSocket.ts modification
const ws = new WebSocket(`${url}/${roomId}?token=${authToken}`);
```
