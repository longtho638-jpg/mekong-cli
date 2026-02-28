---
name: customer-service
description: Support systems, ticketing, CRM, chatbots, helpdesk automation. Use for customer support workflows, SLA management, knowledge base creation, feedback loops.
license: MIT
version: 1.0.0
---

# Customer Service Skill

Build and optimize customer support systems with modern helpdesk tools, AI chatbots, and feedback loops.

## When to Use

- Setting up helpdesk/ticketing systems
- Building AI chatbots and auto-responders
- Creating knowledge bases and FAQ systems
- Designing support workflows and escalation paths
- SLA management and response time optimization
- Customer feedback collection and analysis
- Omnichannel support (email, chat, phone, social)
- Self-service portal development

## Tool Selection

| Need | Choose |
|------|--------|
| Full helpdesk + CRM | HubSpot Service Hub, Zendesk |
| Open-source ticketing | Chatwoot (self-hosted), osTicket |
| AI-first support | Intercom Fin, Zendesk AI |
| Knowledge base | Notion, GitBook, HelpScout Docs |
| Live chat widget | Crisp, Tawk.to (free), Intercom |
| Chatbot builder | Voiceflow, Botpress, Dialogflow |
| Feedback collection | Canny, Productboard, Typeform |
| Email support | HelpScout, Front, Freshdesk |

## Support Architecture

```
Customer → [Channel Router] → [AI Triage] → [Queue/Priority]
                                    ↓
                            [Auto-resolve?]
                              Yes → KB Article / Bot Response
                              No  → [Agent Assignment] → [Resolution] → [CSAT Survey]
```

## Key Metrics

| Metric | Target | Formula |
|--------|--------|---------|
| First Response Time | < 1h (business hours) | Time from ticket creation to first reply |
| Resolution Time | < 24h | Time from creation to resolution |
| CSAT Score | > 4.5/5 | Post-resolution survey average |
| First Contact Resolution | > 70% | Resolved without escalation / Total tickets |
| Ticket Deflection Rate | > 40% | Self-served / Total support requests |

## Chatbot Integration Pattern

```typescript
// AI support bot with fallback to human
async function handleSupportQuery(message: string) {
  // Step 1: Search knowledge base
  const kbResults = await searchKnowledgeBase(message);
  if (kbResults.confidence > 0.85) {
    return { type: 'auto-resolve', answer: kbResults.answer };
  }
  // Step 2: AI classification
  const category = await classifyTicket(message);
  // Step 3: Route to appropriate queue
  return { type: 'escalate', category, priority: category.priority };
}
```

## Key Best Practices (2026)

**AI Triage:** Use LLMs to classify, prioritize, and draft responses — reduces agent workload 40-60%
**Knowledge-Centered Service (KCS):** Every resolved ticket → knowledge base article
**Proactive Support:** Monitor usage patterns, reach out before issues escalate
**Omnichannel Consistency:** Same context across email, chat, phone, social
**CSAT + NPS:** Measure satisfaction per interaction AND relationship loyalty

## References

- `references/helpdesk-setup-guide.md` - Zendesk, Intercom, Chatwoot configuration
- `references/ai-chatbot-patterns.md` - LLM-powered support automation
