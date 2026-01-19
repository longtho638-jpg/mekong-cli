---
description: Parse PRD to generate tasks with Task Master AI
---

# /tm/parse - Parse PRD to Tasks

> **Task Master AI** - PRD → Dependency-aware task graph

## Usage

// turbo

```bash
# Parse default PRD
task-master parse-prd .taskmaster/docs/prd.txt

# Parse custom file
task-master parse-prd path/to/your-prd.txt
```

## Output

Tasks are generated in `.taskmaster/tasks/tasks.json` with:

- Dependencies
- Complexity estimates
- Subtasks

## Example

```
$ task-master parse-prd scripts/prd.txt
✅ Parsed PRD successfully
📋 Generated 12 tasks with 3 dependency chains
📁 Output: .taskmaster/tasks/tasks.json
```
