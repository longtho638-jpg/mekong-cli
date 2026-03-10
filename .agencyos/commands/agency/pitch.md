# /pitch - Generate Client Proposals

Create compelling proposals and pitches for prospective clients.

## Usage
```
/pitch [prospect] [service] [options]
```

## Parameters
- **prospect**: Prospective client name/company
- **service**: Service type to pitch

## Services
- `seo` - SEO campaign proposal
- `social` - Social media management
- `ppc` - Pay-per-click advertising
- `content` - Content marketing
- `web` - Website design/development
- `full` - Full-service agency package
- `custom` - Custom service bundle

## Examples
```
/pitch "Acme Corp" seo --budget 5000
/pitch "Startup XYZ" full --industry tech
/pitch "Local Bakery" social --budget 1000 --location "Ho Chi Minh"
```

## Options
```
--budget, -b      Client's budget range
--industry, -i    Client's industry
--location, -l    Client's location
--competitors, -c Competitor URLs to analyze
--goals, -g       Client's primary goals
--timeline, -t    Project timeline
```

## Workflow

### 1. Research Phase
- Analyze prospect's current online presence
- Research competitors in their industry
- Identify opportunities and gaps
- Check their social media activity

### 2. Proposal Generation
- Create executive summary
- Define scope of work
- Build pricing table
- Generate timeline
- Add case studies

### 3. Customization
- Apply agency branding
- Add industry-specific insights
- Include relevant testimonials
- Embed competitive analysis

### 4. Output
- Generate PDF proposal
- Create presentation deck (optional)
- Save to proposals folder

## Proposal Structure
```markdown
# Proposal for {prospect_name}

## Executive Summary
{ai_generated_summary}

## The Opportunity
{market_analysis}

## Our Approach
{strategy_overview}

## Scope of Work
{deliverables_list}

## Investment
| Service | Monthly | Setup |
|---------|---------|-------|
| ... | ... | ... |

## Timeline
{project_milestones}

## Why Choose Us
{differentiators}

## Case Studies
{relevant_examples}

## Next Steps
{call_to_action}
```

## Integration Points
- **Scout Agent**: Prospect research
- **Gemini**: Content generation
- **Templates**: Branded proposal templates
- **CRM**: Log prospect activity

## Agent
Uses `@pitcher` agent with research and copywriting skills.

## Binh Pháp Alignment
**Chapter 3 - Mưu Công (Attack by Strategy)**: Win the deal before the competition knows you're in the game. "Supreme excellence consists in breaking the enemy's resistance without fighting."
