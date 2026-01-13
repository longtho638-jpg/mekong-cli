---
description: SimStudio Flow - Visual workflow builder with AI copilot
---

# /sim - SimStudio Flow Command

Build and execute visual AI agent workflows.

## Usage

```bash
/sim <action> [options]
```

## Actions

### Create Workflow
```bash
/sim create "Workflow Name"
```
// turbo

### Add Node
```bash
/sim add <workflow_id> <node_type> "Label"
```
Node types: `agent`, `tool`, `trigger`, `condition`, `transform`, `output`, `loop`, `human`

### Connect Nodes
```bash
/sim connect <workflow_id> <source_id> <target_id>
```
// turbo

### Execute Workflow
```bash
/sim run <workflow_id>
```
// turbo

### Generate from Prompt
```bash
/sim gen "Build an AI sales pipeline"
```
Uses FlowCopilot to generate workflow from natural language.

## Planet Mapping

| Planet | Node Types |
|--------|------------|
| 🟣 Saturn | agent |
| 🟠 Jupiter | trigger, output |
| 🔴 Mars | tool |
| 🟢 Earth | transform |
| 🟡 Mercury | trigger |
| 🟤 Neptune | output |
| 🔵 Venus | human |
| ⚪ Uranus | condition |

## Example

```bash
# Create workflow
/sim create "Lead Qualification"

# Add nodes
/sim add wf_123 trigger "New Lead"
/sim add wf_123 agent "Qualify Lead"
/sim add wf_123 condition "Score > 50"
/sim add wf_123 output "Add to CRM"

# Connect
/sim connect wf_123 node_1 node_2
/sim connect wf_123 node_2 node_3
/sim connect wf_123 node_3 node_4

# Run
/sim run wf_123
```

// turbo-all
