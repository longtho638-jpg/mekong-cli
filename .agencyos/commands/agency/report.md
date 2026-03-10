# /report - Generate Client Report

Generate comprehensive client reports with AI-powered insights.

## Usage
```
/report [client] [type] [period]
```

## Parameters
- **client**: Client name or ID
- **type**: `seo`, `social`, `ppc`, `content`, `full` (default: `full`)
- **period**: `weekly`, `monthly`, `quarterly` (default: `monthly`)

## Examples
```
/report ABC Corporation monthly
/report XYZ Ventures seo weekly
/report "Startup Inc" full quarterly
```

## Workflow

### 1. Data Collection
- Fetch analytics data from connected sources (GA4, Search Console, Social APIs)
- Pull project progress from Supabase
- Gather invoice/billing status

### 2. Analysis
- Calculate KPIs and metrics
- Compare to previous period
- Identify trends and anomalies
- Generate AI insights using Gemini

### 3. Report Generation
- Create branded PDF report
- Include executive summary
- Add detailed metrics sections
- Embed charts and visualizations

### 4. Distribution
- Save to client portal
- Send via email (optional)
- Update activity log

## Output Format
```markdown
# Monthly Performance Report
**Client**: {client_name}
**Period**: {start_date} - {end_date}
**Generated**: {timestamp}

## Executive Summary
{ai_generated_summary}

## Key Metrics
| Metric | Current | Previous | Change |
|--------|---------|----------|--------|
| Traffic | X | Y | +Z% |
| ...

## Recommendations
{ai_recommendations}

## Next Steps
{action_items}
```

## Integration Points
- **Supabase**: Client data, project status
- **Analytics APIs**: GA4, GSC, Social
- **Gemini**: AI insights generation
- **SendGrid/Resend**: Email delivery
- **PDF Generation**: Puppeteer or react-pdf

## Agent
Uses `@reporter` agent for data gathering and analysis.

## Binh Pháp Alignment
**Chapter 9 - Hành Quân (Operations)**: Regular reporting keeps clients informed and builds trust. "Know the terrain" - understand client's metrics landscape.
