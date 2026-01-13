---
title: "Vibe Coding with AgencyOS"
description: "Complete guide to Vibe Coding patterns using AgencyOS Agent Framework"
---

# Vibe Coding with AgencyOS

> 🚀 Build faster with AI-powered agent orchestration

---

## What is Vibe Coding?

Vibe Coding is a development paradigm where you collaborate with AI agents to write code. Instead of typing every line, you describe your intent and let agents handle implementation.

**Key Principles:**
- 🎯 Intent over implementation
- 🔄 Iterative refinement
- 🤖 Agent orchestration
- ✅ Human-in-the-loop for critical decisions

---

## Quick Start

### 1. Setup AgencyOS Provider

```tsx
import { AgencyOSProvider } from '@/agencyos';

function App() {
  return (
    <AgencyOSProvider>
      <YourDashboard />
    </AgencyOSProvider>
  );
}
```

### 2. Connect an Agent

```tsx
import { useAgentOS } from '@/agencyos';

function AgentPanel() {
  const { state, startTask, updateStatus } = useAgentOS({
    agentName: 'planner'
  });

  return (
    <div>
      <p>Status: {state.taskStatus}</p>
      <button onClick={() => startTask('Plan new feature')}>
        Start Planning
      </button>
    </div>
  );
}
```

---

## Core Patterns

### Pattern 1: Task Tracking

Track progress through multi-step workflows:

```tsx
import { useTaskTracker, TaskTrackerWidget } from '@/agencyos';

function FeatureDevelopment() {
  const { state, progress, initTask, completeStep } = useTaskTracker();

  useEffect(() => {
    initTask('Build Feature', [
      'Analyze requirements',
      'Design architecture',
      'Implement code',
      'Write tests',
      'Deploy'
    ]);
  }, []);

  return <TaskTrackerWidget {...state} progress={progress} />;
}
```

### Pattern 2: Human Approval

Gate critical actions with human approval:

```tsx
import { useApprovalGate, ApprovalDialog } from '@/agencyos';

function DeploymentFlow() {
  const { pendingRequest, requestApproval, approve, reject } = useApprovalGate();

  async function deploy() {
    const approved = await requestApproval(
      'Deploy to Production',
      'This will update the live environment'
    );
    
    if (approved) {
      // Proceed with deployment
    }
  }

  return (
    <>
      <button onClick={deploy}>Deploy</button>
      <ApprovalDialog
        isOpen={!!pendingRequest}
        action={pendingRequest?.action || ''}
        description={pendingRequest?.description || ''}
        onApprove={approve}
        onReject={reject}
      />
    </>
  );
}
```

### Pattern 3: Dynamic Reports

Render agent-generated content:

```tsx
import { AgentReport, DynamicCard } from '@/agencyos';

function AgentOutput({ report }) {
  return (
    <div>
      <AgentReport
        type="plan"
        title={report.title}
        steps={report.steps}
        status={report.status}
      />
      
      <DynamicCard
        title="Metrics"
        metrics={report.metrics}
        glowing={true}
      />
    </div>
  );
}
```

---

## Agent Commands

Use slash commands to invoke agents:

| Command | Agent | Action |
|---------|-------|--------|
| `/@planner` | Planner | Create implementation plans |
| `/@scout` | Scout | Analyze codebase |
| `/@fullstack` | Developer | Implement features |
| `/@debugger` | Debugger | Fix bugs |
| `/@tester` | Tester | Write tests |
| `/@git-manager` | Git | Manage commits |

### Example Flow

```
User: /@planner Create authentication system

Planner Agent:
├── Analyzes requirements
├── Creates implementation_plan.md
└── Returns structured plan

User: /@fullstack Implement the plan

Fullstack Agent:
├── Reads implementation_plan.md
├── Writes code
├── Requests approval for sensitive changes
└── Commits with git-manager
```

---

## Artifacts

Agents generate artifacts to document their work:

| Artifact | Purpose |
|----------|---------|
| `task.md` | Current task checklist |
| `implementation_plan.md` | Proposed changes |
| `walkthrough.md` | Summary of completed work |

### Artifact Path

```
.gemini/antigravity/brain/{conversation-id}/
├── task.md
├── implementation_plan.md
└── walkthrough.md
```

---

## Best Practices

### 1. Be Specific
```
❌ "Make it better"
✅ "Add error handling for API failures with retry logic"
```

### 2. Use Approval Gates
```tsx
// Always gate destructive actions
const approved = await requestApproval('Delete database', details);
```

### 3. Track Progress
```tsx
// Initialize tasks with clear steps
initTask('Feature', ['Plan', 'Code', 'Test', 'Deploy']);
```

### 4. Review Artifacts
Always review `implementation_plan.md` before approving major changes.

---

## Related

- [Agent Framework Reference](/docs/agents/agent-framework)
- [Hook API](/docs/guides/agencyos-hooks)
- [System Architecture](/docs/system-architecture)

---

*AgencyOS Vibe Coding Guide | Tinh Hoa Architecture*
