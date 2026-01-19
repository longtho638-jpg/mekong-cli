---
description: Real-time GitHub Actions CI status check
---

# /ci-status - GitHub Actions Status

Quick check of CI pipeline status.

## Usage

```bash
/ci-status          # Last 5 runs
/ci-status --watch  # Continuous monitoring
```

## Steps

### Step 1: Fetch Status

// turbo

```bash
cd /Users/macbookprom1/mekong-cli
gh run list --limit 5 --json status,conclusion,name,headBranch,createdAt \
  --template '{{range .}}{{if eq .conclusion "success"}}✅{{else if eq .conclusion "failure"}}❌{{else}}🔄{{end}} {{.name}} ({{.headBranch}}) - {{timeago .createdAt}}
{{end}}'
```

### Step 2: Check Latest Run Details

// turbo

```bash
gh run view --json jobs --jq '.jobs[] | "\(.name): \(.conclusion)"' 2>/dev/null | head -10
```

### Step 3: Retry Failed (if needed)

```bash
# Get last failed run ID
FAILED_RUN=$(gh run list --limit 1 --status failure --json databaseId --jq '.[0].databaseId')

# Retry
gh run rerun $FAILED_RUN
```

## Status Legend

| Icon | Meaning     |
| ---- | ----------- |
| ✅   | Success     |
| ❌   | Failed      |
| 🔄   | In Progress |
| ⚠️   | Cancelled   |
