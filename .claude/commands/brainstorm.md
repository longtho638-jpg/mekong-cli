---
description: ⚡⚡ Elite brainstorming with 6-phase multi-agent collaboration
argument-hint: [question]
---

# /brainstorm - Technical Decision Making

Elite brainstorming command for technical solutions. Engages multi-agent collaboration to evaluate approaches against engineering principles.

## Syntax

```bash
/brainstorm [question]
```

// turbo

## When to Use

- **Architecture Decisions**: Choosing between design patterns
- **Technology Selection**: Evaluating frameworks, libraries, tools
- **Design Challenges**: Solving complex problems
- **Risk Assessment**: Identifying trade-offs before implementation
- **Team Alignment**: Structured analysis for stakeholder discussions

## Quick Example

```bash
/brainstorm [should we use Redis or PostgreSQL for session storage?]
```

## 6-Phase Process

### Phase 1: Discovery
- What problem are we solving?
- What constraints exist? (budget, timeline, skills)
- What's the success criteria?
- What's already been tried?

### Phase 2: Research
- Project docs (architecture, code standards)
- External APIs via MCP tools
- Documentation lookups
- Codebase analysis via scout

### Phase 3: Analysis
Evaluates against principles:
- **YAGNI**: Does this add unnecessary complexity?
- **KISS**: Is there a simpler approach?
- **DRY**: Does this create duplication?
- Plus: Security, performance, maintainability

### Phase 4: Debate
- Devil's advocate for each option
- Surface hidden trade-offs
- Question "obvious" choices
- Consider edge cases and failure modes

### Phase 5: Consensus
- Synthesize perspectives
- Rank options with rationale
- Identify non-negotiables
- Note acceptable trade-offs

### Phase 6: Documentation
Creates markdown report with recommendation.

## Report Structure

```markdown
# Brainstorm: {Topic}

**Date**: YYMMDD
**Question**: {Original question}

## Problem Statement
{Clarified problem and constraints}

## Options Considered

### Option A: {Name}
- Description
- Pros / Cons
- YAGNI ✓ KISS ✓ DRY ✓

### Option B: {Name}
...

## Recommendation
{Selected option with rationale}

## Risks & Mitigations
- Risk 1 → Mitigation

## Success Metrics
- {Measurable criteria}

## Next Steps
1. {Action item}
```

## Output Location

```
plans/reports/brainstorm-YYMMDD-{topic}.md
```

## Answer this question:
<question>$ARGUMENTS</question>

// turbo-all
