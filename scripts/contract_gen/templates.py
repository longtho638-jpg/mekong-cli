from typing import Dict

from .models import ContractTemplate

# Contract Templates Definitions
# NOTE: Templates are currently hardcoded but could be loaded from a
# dynamic config (JSON/YAML) or database in future iterations.
TEMPLATES: Dict[str, ContractTemplate] = {
    "ghost_cto": ContractTemplate(
        key="ghost_cto",
        title="Ghost CTO Lite Service Agreement",
        price=3000,
        term="Monthly (cancel with 30 days notice)",
        scope="""
## Scope of Services

The Provider agrees to deliver the following services:

### 1. Weekly Engineering Velocity Reports
- Commit analysis and PR metrics
- Cycle time tracking
- Bottleneck identification

### 2. Monthly Architecture Review
- Codebase health assessment
- Technical debt prioritization
- Scalability recommendations

### 3. On-Demand Support
- Slack/Email response within 24 hours
- Up to 5 hours of direct support per month
- Emergency escalation for critical issues

### 4. Quarterly Tech Roadmap
- Strategic planning session
- OKR alignment
- Resource planning recommendations
""",
    ),
    "venture": ContractTemplate(
        key="venture",
        title="Venture Architecture Agreement",
        price=10000,
        equity="5%",
        term="3-month engagement + ongoing advisory",
        scope="""
## Scope of Services

### Phase 1: Discovery (Week 1-2)
- Technical due diligence
- Architecture assessment
- Team capability evaluation

### Phase 2: Design (Week 3-4)
- System architecture design
- Technology stack recommendation
- Scalability planning

### Phase 3: Implementation Oversight (Week 5-12)
- Sprint planning support
- Code review guidance
- Hiring support for first 3 engineers

### Phase 4: Ongoing Advisory
- Monthly advisory calls
- Investor technical prep
- Exit readiness assessment
""",
    ),
    "ai_setup": ContractTemplate(
        key="ai_setup",
        title="AI Copilot Setup Agreement",
        price=997,
        term="One-time engagement",
        scope="""
## Scope of Services

### Deliverables

1. **AI Tool Configuration**
   - Cursor IDE setup and optimization
   - Claude/GPT integration
   - Custom prompt library (50+ prompts)

2. **Team Training**
   - 2-hour hands-on workshop
   - Best practices documentation
   - Prompt engineering guide

3. **Post-Setup Support**
   - 30 days of email support
   - Access to private Slack channel
   - 1 follow-up call at Day 14
""",
    ),
}
