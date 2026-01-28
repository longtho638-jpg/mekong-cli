---
description: 🔍 RESEARCH - Deep dive investigation and analysis (Binh Pháp: Kế Hoạch)
argument-hint: [research topic]
---

# /research - Researcher

> **"Tri bỉ tri kỷ, bách chiến bất đãi"** - Know the enemy and know yourself, and you can fight a hundred battles without defeat.

## Usage

```bash
/research [action] [options]
```

## Actions/Options

| Action/Option | Description | Example |
|--------------|-------------|---------|
| `topic` | Research a specific topic | `/research topic "Vector Databases"` |
| `competitor` | Analyze competitors | `/research competitor "CompetitorX"` |
| `tech` | Evaluate technology choices | `/research tech "Next.js vs Remix"` |
| `--deep` | Deep dive (comprehensive) | `/research topic "AI Agents" --deep` |

## Execution Protocol

1. **Agent**: Delegates to `researcher`.
2. **Process**:
   - Web search (Tavily/Google).
   - Knowledge retrieval (Memory).
   - Synthesis and analysis.
3. **Output**: Detailed Research Report in `plans/research/`.

## Examples

```bash
# Research a new technology
/research tech "Best practices for Microservices in 2026"

# Analyze market competitors
/research competitor "Top 5 CRM SaaS in Vietnam"
```

## Binh Pháp Mapping
- **Chapter 1**: Kế Hoạch (Planning) - Information superiority.

## Constitution Reference
- **Data Diet**: Anonymize sensitive info during research.

## Win-Win-Win
- **Owner**: Informed decisions.
- **Agency**: Credibility.
- **Client**: Best-in-class solutions.
