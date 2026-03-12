---
description: "Cross-portfolio analytics — performance, patterns, intelligence. 1 command, ~8 min."
argument-hint: [--period=weekly|monthly|quarterly]
allowed-tools: Read, Write, Bash, Task
---

# /portfolio:report — Cross-Portfolio Analytics Report

## Goal

Generate comprehensive portfolio analytics with cross-company intelligence and pattern detection.

## Steps

1. Load all portfolio companies from .mekong/studio/portfolio/
2. Aggregate metrics: total MRR, portfolio value, avg health score
3. Identify cross-portfolio patterns (shared challenges, synergies)
4. Calculate momentum distribution across portfolio
5. Generate intelligence insights and recommendations
6. Save report to plans/reports/portfolio-report-{date}.md
7. Output summary to CLI

## Output Format

Markdown report + CLI summary.

```
📈 Portfolio Report ({period})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies  : {total} ({active} active)
Total MRR  : ${total_mrr}
Portfolio $ : ${portfolio_value}
Avg Health : {avg_health}/100
Pipeline   : {deals_count} deals
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 Insights: {count} cross-portfolio
📄 Full report: {report_path}
```

## Goal context

<goal>$ARGUMENTS</goal>
