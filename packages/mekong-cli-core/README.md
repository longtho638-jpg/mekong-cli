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

## Development

```bash
pnpm test          # run tests
pnpm run lint      # type check
pnpm run build     # build dist
```

## License

MIT
