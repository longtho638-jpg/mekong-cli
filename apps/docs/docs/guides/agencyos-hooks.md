---
title: "AgencyOS Hooks Reference"
description: "Complete API reference for AgencyOS Agent Framework hooks"
---

# AgencyOS Hooks Reference

Complete API reference for all AgencyOS Agent Framework hooks.

---

## useAgentOS

Connect an agent to the UI with state management.

### Import
```tsx
import { useAgentOS } from '@/agencyos';
```

### Usage
```tsx
const { state, startTask, updateStatus, completeTask, setMode, addArtifact } = useAgentOS({
  agentName: 'planner',
  onStateChange: (state) => console.log(state)
});
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `agentName` | `string` | Required. Name of the agent |
| `onStateChange` | `(state) => void` | Callback when state changes |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `state` | `AgentState` | Current agent state |
| `startTask` | `(name: string) => void` | Start a new task |
| `updateStatus` | `(status: string) => void` | Update task status |
| `completeTask` | `() => void` | Complete current task |
| `setMode` | `(mode: Mode) => void` | Set agent mode |
| `addArtifact` | `(artifact) => void` | Add an artifact |

### State Object

```typescript
interface AgentState {
  taskName: string;
  taskStatus: string;
  taskSummary: string;
  mode: 'planning' | 'execution' | 'verification';
  artifacts: Artifact[];
  isActive: boolean;
}
```

---

## useTaskTracker

Track progress through multi-step workflows.

### Import
```tsx
import { useTaskTracker } from '@/agencyos';
```

### Usage
```tsx
const { state, progress, initTask, completeStep, failStep, resetTask } = useTaskTracker();

// Initialize with steps
initTask('Feature Build', [
  'Analyze requirements',
  'Design architecture',
  'Implement code',
  'Write tests',
  'Deploy'
]);

// Complete steps
completeStep('step_0'); // or by index
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `state` | `TaskTrackerState` | Current tracker state |
| `progress` | `number` | Progress percentage (0-100) |
| `currentStepName` | `string` | Name of current step |
| `initTask` | `(name, steps) => void` | Initialize task |
| `completeStep` | `(id) => void` | Complete a step |
| `failStep` | `(id) => void` | Mark step as failed |
| `resetTask` | `() => void` | Reset tracker |

---

## useApprovalGate

Human-in-the-loop approval for critical actions.

### Import
```tsx
import { useApprovalGate } from '@/agencyos';
```

### Usage
```tsx
const { pendingRequest, requestApproval, approve, reject } = useApprovalGate();

// Request approval
const approved = await requestApproval(
  'Deploy to Production',
  'This will update the live environment',
  { branch: 'main', environment: 'prod' }
);

if (approved) {
  // Proceed with deployment
}
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `pendingRequest` | `ApprovalRequest | null` | Current pending request |
| `requestApproval` | `(action, desc, details?) => Promise<boolean>` | Request approval |
| `approve` | `() => void` | Approve pending request |
| `reject` | `() => void` | Reject pending request |

---

## useDashboardAction

Trigger UI actions from agents.

### Import
```tsx
import { useDashboardAction } from '@/agencyos';
```

### Usage
```tsx
const { navigate, refreshWidget, showNotification, updateWidget } = useDashboardAction();

// Navigate to a page
navigate('/dashboard/analytics');

// Refresh a widget
refreshWidget('sales-chart');

// Show notification
showNotification('success', 'Deployment complete!');

// Update widget data
updateWidget('metrics', { revenue: 50000 });
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `navigate` | `(path: string) => void` | Navigate to path |
| `refreshWidget` | `(id: string) => void` | Refresh widget |
| `showNotification` | `(type, message) => void` | Show notification |
| `updateWidget` | `(id, data) => void` | Update widget data |

---

## Components

### AgentReport

Render agent-generated reports.

```tsx
<AgentReport
  type="plan" | "walkthrough" | "task" | "other"
  title="Implementation Plan"
  status="active" | "completed" | "error"
  steps={[{ name: 'Step 1', status: 'completed' }]}
  content="Markdown content..."
/>
```

### DynamicCard

Render agent-generated cards.

```tsx
<DynamicCard
  title="Metrics"
  icon="📊"
  status="completed" | "active" | "error" | "pending"
  metrics={[
    { label: 'Revenue', value: '$50K', change: 15 }
  ]}
  actions={[
    { id: 'refresh', label: 'Refresh', onClick: handleRefresh }
  ]}
  glowing={true}
/>
```

### TaskTrackerWidget

Display task progress.

```tsx
<TaskTrackerWidget
  taskName="Feature Build"
  steps={steps}
  currentStepIndex={2}
  progress={40}
/>
```

### ApprovalDialog

Modal for approval requests.

```tsx
<ApprovalDialog
  isOpen={!!pendingRequest}
  action="Deploy to Production"
  description="This will update the live environment"
  details={{ branch: 'main' }}
  onApprove={approve}
  onReject={reject}
/>
```

---

## AgencyOSProvider

Root provider for the framework.

```tsx
import { AgencyOSProvider } from '@/agencyos';

function App() {
  return (
    <AgencyOSProvider>
      <Dashboard />
    </AgencyOSProvider>
  );
}
```

---

## Related

- [Vibe Coding Guide](/docs/guides/antigravity-vibe-coding)
- [Agent Framework](/docs/agents/agent-framework)
- [System Architecture](/docs/system-architecture)
