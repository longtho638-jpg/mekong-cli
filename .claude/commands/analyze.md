---
description: 📊 ANALYZE - Data analysis and business intelligence (Binh Pháp: Dụng Gián)
argument-hint: [analysis topic]
---

# /analyze - Data Analyst

> **"Biết tình hình địch là nhờ gián điệp"** - Foreknowledge cannot be gotten from ghosts and spirits... it must be obtained from men who know the enemy situation.

## Usage

```bash
/analyze [action] [options]
```

## Actions/Options

| Action/Option | Description | Example |
|--------------|-------------|---------|
| `data` | Analyze dataset/CSV | `/analyze data "sales.csv"` |
| `metrics` | Analyze system metrics | `/analyze metrics "Response Time"` |
| `trend` | Forecast trends | `/analyze trend "User Growth"` |
| `--viz` | Generate visualization | `/analyze data "churn.csv" --viz` |

## Execution Protocol

1. **Agent**: Delegates to `data-analyst` (or `analyst`).
2. **Process**:
   - Loads data (Pandas/SQL).
   - Performs statistical analysis.
   - Generates insights and charts.
3. **Output**: Analysis Report + Charts.

## Examples

```bash
# Analyze user retention
/analyze data "retention_cohorts.csv" --viz

# Analyze performance trends
/analyze metrics "API Latency last 30 days"
```

## Binh Pháp Mapping
- **Chapter 13**: Dụng Gián (Intelligence) - Turning data into intelligence.

## Constitution Reference
- **Win-Win-Win**: Data-driven decisions prevent losses.

## Win-Win-Win
- **Owner**: Actionable insights.
- **Agency**: Proven value.
- **Client**: Optimized results.
