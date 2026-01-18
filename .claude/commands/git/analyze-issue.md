---
description: Create implementation specification from GitHub issue
---

// turbo

# /analyze-issue - Issue Analyzer

Deep analysis of a GitHub issue to create implementation spec.

## Usage

```
/analyze-issue [issue-number]
```

## Claude Prompt Template

```
Analyze GitHub issue workflow:

1. Fetch issue: gh issue view {number} --json title,body,labels,comments
2. Parse requirements from issue body
3. Create implementation specification:

   ## Summary
   {concise problem statement}

   ## Requirements
   - [ ] Requirement 1
   - [ ] Requirement 2

   ## Technical Approach
   {implementation strategy}

   ## Files to Modify
   - path/to/file1.ts: {changes}
   - path/to/file2.ts: {changes}

   ## Testing Strategy
   {how to verify}

   ## Estimated Effort
   {time estimate}

Save spec to: .claude/specs/issue-{number}.md
```

## Example Output

```
📋 Issue #42: Add dark mode support

📝 Spec created: .claude/specs/issue-42.md

Summary:
- 5 requirements identified
- 8 files to modify
- ~4 hours estimated

Ready for /do-issue 42
```
