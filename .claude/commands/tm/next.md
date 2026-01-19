---
description: Get the next task to work on
---

# /tm/next - Get Next Task

> **Task Master AI** - Get the next available task based on dependencies

## Usage

// turbo

```bash
task-master next
```

## What It Does

1. Checks dependency graph
2. Finds unblocked tasks
3. Returns highest priority task

## Example

```
$ task-master next

📌 NEXT TASK: #5 - Implement user authentication
   Status: pending
   Depends on: #3 (completed), #4 (completed)
   Complexity: Medium

   Would you like to work on this task?
```
