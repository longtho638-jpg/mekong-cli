# Phase 2: Agent Definitions

**Context Links**
- [AgencyOS Architecture Research](../reports/researcher-260126-1624-agencyos-architecture.md)
- [Agent Hub Patterns](../reports/researcher-260126-1630-final-patterns.md)

## Overview
**Date:** 260126
**Priority:** P1
**Status:** Pending
**Description:** Define the "Executive Team" agents for the workspace. These are the AI agents that will operate the agency, mapped to the "Hub & Spoke" model.

## Key Insights
- **Hub Model:** Each agent is a "Hub" (e.g., Sales Hub) that manages specific metrics and chapters.
- **Binh Phap Alignment:** Agents must explicitly reference the 13 Chapters and Win-Win-Win gates.
- **Pre-configured:** Agents should come with predefined tools and permissions relevant to their role.

## Requirements
- Create `.claude/agents/` directory in the template.
- Define 6 core agents:
    1.  `executive-hub.md` (CEO)
    2.  `finance-hub.md` (CFO)
    3.  `sales-hub.md` (CRO)
    4.  `content-marketer.md` (CMO)
    5.  `revenue-engine.md` (Analyst)
    6.  `binh-phap-strategist.md` (Strategist)
- Each agent file must include: Name, Description (keywords), Persona, Tools, Metrics, Binh Phap Alignment.

## Architecture
**Agent Location:** `agencyos-workspace-template/.claude/agents/`

**Agent Personas:**
- **Executive Hub:** Focus on Strategy Audit (Ch 1), Health Score, KPI tracking.
- **Finance Hub:** Focus on Runway (Ch 2), P&L, Cash Flow, Invoicing.
- **Sales Hub:** Focus on VC Intelligence (Ch 13), Pipeline, Deal Closing.
- **Content Marketer:** Focus on Growth (Ch 5), Content Calendar, SEO.
- **Revenue Engine:** Focus on Financial modeling, MRR/ARR forecasting.
- **Binh Phap Strategist:** Focus on Win-Win-Win validation, 5 Factors Analysis.

## Related Code Files
- `agencyos-workspace-template/.claude/agents/executive-hub.md`
- `agencyos-workspace-template/.claude/agents/finance-hub.md`
- `agencyos-workspace-template/.claude/agents/sales-hub.md`
- `agencyos-workspace-template/.claude/agents/content-marketer.md`
- `agencyos-workspace-template/.claude/agents/revenue-engine.md`
- `agencyos-workspace-template/.claude/agents/binh-phap-strategist.md`

## Implementation Steps
1.  Create `.claude/agents/` directory.
2.  Create `executive-hub.md` with "Chairman/CEO" persona.
3.  Create `finance-hub.md` with "CFO" persona and Budget/Invoice tools.
4.  Create `sales-hub.md` with "CRO" persona and CRM/Pipeline tools.
5.  Create `content-marketer.md` with "CMO" persona and Content tools.
6.  Create `revenue-engine.md` with "Analyst" persona.
7.  Create `binh-phap-strategist.md` with "Grand Strategist" persona and Win3 Gate rules.

## Todo List
- [ ] Create `.claude/agents/`
- [ ] Implement `executive-hub.md`
- [ ] Implement `finance-hub.md`
- [ ] Implement `sales-hub.md`
- [ ] Implement `content-marketer.md`
- [ ] Implement `revenue-engine.md`
- [ ] Implement `binh-phap-strategist.md`

## Success Criteria
- All 6 agent files exist.
- Each agent has a unique persona and clear Binh Phap chapter alignment.
- Agents reference valid tools (even if tools are placeholders in the template initially).

## Risk Assessment
- **Risk:** Agent instructions might be too generic.
- **Mitigation:** Use specific Binh Phap terminology (e.g., "Analyze Ngũ Sự") to ground them in the framework.

## Next Steps
- Proceed to Phase 3: Workflow Templates.
