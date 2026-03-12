# @mekong/cli-core

Core SDK for the Mekong CLI platform — SOP execution engine, agent framework, LLM client, and plugin system.

## Installation

```bash
pnpm add @mekong/cli-core
```

## Quick Start

```typescript
import { parseSopYaml, SopExecutor } from '@mekong/cli-core';

const yaml = `
sop:
  name: hello
  version: "1.0.0"
  tags: []
  inputs: []
  preconditions: []
  steps:
    - id: greet
      name: "Greet"
      action: shell
      command: "echo Hello, world!"
      on_failure: stop
`;

const result = parseSopYaml(yaml);
if (result.ok) {
  const executor = new SopExecutor();
  const run = await executor.run(result.value);
  console.log(run.status); // "success"
}
```

## SOP Templates

Built-in templates in `src/sops/templates/`:

| Template | Description |
|----------|-------------|
| `deploy.yaml` | Deploy application to production |
| `code-review.yaml` | AI-powered code review pipeline |
| `feature-dev.yaml` | End-to-end feature development |
| `content-pipeline.yaml` | Research, draft, review, publish |
| `incident-response.yaml` | Incident detection and resolution |

## SOP Schema

```yaml
sop:
  name: string           # required
  version: string        # default "1.0.0"
  description: string    # optional
  author: string         # optional
  tags: string[]
  inputs:
    - name: string
      type: string|number|boolean|object|array
      required: boolean
      description: string  # optional
      default: any         # optional
  preconditions:
    - type: file_exists|env_set|command_available|custom
      value: string
      message: string      # optional
  steps:
    - id: string
      name: string
      action: shell|llm|tool|agent|sop|condition
      command: string      # for shell action
      prompt: string       # for llm action
      on_success: string   # step id to run next
      on_failure: stop|continue|retry
      retry:
        max: number
        delay_seconds: number
      timeout_seconds: number
  outputs:
    key: value             # optional output map
```

## API Reference

### Parser

```typescript
import { parseSopYaml, parseSopFile } from '@mekong/cli-core/sops';

parseSopYaml(yamlString)     // Result<SopDefinition>
parseSopFile(filePath)       // Promise<Result<SopDefinition>>
```

### Executor

```typescript
import { SopExecutor } from '@mekong/cli-core/sops';

const executor = new SopExecutor();
const run = await executor.run(sopDefinition, inputs);
// run.status: 'success' | 'failed' | 'running'
// run.steps: StepState[]
```

### DAG

```typescript
import { buildDag, topoSort, validateDag } from '@mekong/cli-core/sops';

const dag = buildDag(steps);
const layers = topoSort(dag);
const { valid, errors } = validateDag(dag);
```

## ROIaaS 5-Phase DNA (v0.4 - v0.8)

Implements HIEN-PHAP-ROIAAS Dieu 6 — every CLI feature maps to measurable ROI.

### Phase 1: License Gate (v0.4)

```typescript
import { LicenseGate, LicenseStore, LicenseVerifier } from '@mekong/cli-core/license';

const store = new LicenseStore();
const verifier = new LicenseVerifier('your-hmac-secret');
const gate = new LicenseGate(store, verifier);

const validation = await gate.validate();
// validation.valid, validation.tier, validation.quotas

const canUse = gate.canAccess('kaizen'); // checks tier >= required
```

**CLI**: `mekong license status|activate|deactivate|info`

### Phase 2: License Admin (v0.5)

```typescript
import { LicenseAdmin, KeyGenerator } from '@mekong/cli-core/license';

const admin = new LicenseAdmin(storePath, 'hmac-secret');
const key = await admin.createKey({ tier: 'pro', owner: 'user@example.com', expiresInDays: 365 });
await admin.revokeKey(key.id);
const keys = await admin.listKeys();
```

**CLI**: `mekong license-admin create|list|revoke|rotate|audit`

### Phase 3: Payment Webhooks (v0.6)

```typescript
import { WebhookHandler, WebhookVerifier } from '@mekong/cli-core/payments';

const verifier = new WebhookVerifier('polar-webhook-secret');
const handler = new WebhookHandler(verifier, subscriptionManager, receiptStore);
const result = await handler.handle(rawBody, headers);
// checkout.completed -> auto-creates license
// subscription.canceled -> revokes license
```

**CLI**: `mekong billing status|receipts|webhook-test`

### Phase 4: Usage Metering (v0.7)

```typescript
import { MeteringCollector, UsageLimiter } from '@mekong/cli-core/metering';

const collector = new MeteringCollector(store);
collector.recordLlmCall({ model: 'claude-sonnet-4', tokens: 1500 });
collector.recordToolRun({ tool: 'search', duration: 200 });

const limiter = new UsageLimiter(store, 'pro');
const check = await limiter.checkLimit('llm'); // { allowed, used, limit, remaining }
```

**CLI**: `mekong usage today|this-month|summary|export|limits`

### Phase 5: ROI Analytics (v0.8)

```typescript
import { ROICalculator, AgentScorer, RevenueTracker } from '@mekong/cli-core/analytics';

const roi = new ROICalculator();
const metrics = roi.calculate({ timeSavedHours: 40, hourlyRate: 150, revGenerated: 5000, totalCost: 149 });
// metrics.roiPercentage, metrics.netValue

const scorer = new AgentScorer();
const score = scorer.score({ progress: 80, activity: 90, successRate: 85, errorRecovery: 70 });
// AGI Score 0-100 per HIEN-PHAP Dieu 7.3
```

**CLI**: `mekong analytics roi|agents|revenue|growth|export`

### Tier Model

| Tier | LLM/day | Tools/day | SOPs/day |
|------|---------|-----------|----------|
| Free | 100 | 50 | 10 |
| Starter | 1,000 | 500 | 100 |
| Pro | 10,000 | 5,000 | 1,000 |
| Enterprise | Unlimited | Unlimited | Unlimited |

## Development

```bash
pnpm test          # run tests (692+)
pnpm run lint      # type check
pnpm run build     # build dist
```

## License

MIT
