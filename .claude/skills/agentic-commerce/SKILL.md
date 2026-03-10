# Agentic Commerce — Skill

> Autonomous AI shopping agents, dynamic pricing engines, and agent-to-agent marketplace infrastructure.

## When to Activate
- Building AI agents that autonomously browse, compare, and purchase products on user's behalf
- Implementing dynamic pricing systems driven by demand signals and competitor intelligence
- Designing conversational commerce flows with LLM-powered product recommendation
- Creating agent-to-agent (A2A) marketplaces where supplier and buyer agents negotiate autonomously

## Core Capabilities

| Area | Description |
|------|-------------|
| Shopping Agents | Autonomous product discovery, comparison, cart management, and checkout execution |
| Procurement Automation | RFQ generation, supplier selection, PO issuance, and invoice matching without human loop |
| Dynamic Pricing | Real-time price optimization using demand elasticity, inventory levels, competitor scraping |
| Conversational Commerce | LLM-driven product advisor with catalog RAG, intent classification, and cart manipulation |
| A2A Marketplaces | Structured negotiation protocols between buyer/seller agents with escrow and settlement |

## Architecture Patterns

- **Shopping Agent Loop:** User intent → NLU → product search API → ranking → preference filter → checkout action → confirmation
- **Dynamic Pricing Engine:** Competitor price scrape (every 15min) + inventory signal + demand forecast → pricing model → price update API → A/B test validation
- **Conversational Commerce:** User message → intent classification → catalog RAG (pgvector) → response generation → add-to-cart tool call → order confirmation
- **A2A Negotiation Protocol:** Buyer agent issues RFQ → supplier agents submit bids → scoring function selects winner → smart contract escrow → delivery trigger → payment release

## Key Technologies

- **Agent Frameworks:** LangGraph, CrewAI, AutoGen for multi-agent orchestration
- **Commerce APIs:** Shopify Storefront API, WooCommerce REST, Medusa.js, commercetools
- **Browser Automation:** Playwright + CDP for agent-driven checkout on external sites
- **Pricing:** Prophet/NeuralProphet for demand forecasting; Scrapfly/Zyte for competitor data
- **A2A Protocols:** OpenAgents spec, ANP (Agent Network Protocol), Stripe Connect for settlements
- **Vector Search:** pgvector, Pinecone, or Weaviate for semantic product catalog search

## Implementation Checklist

- [ ] Define agent permission scope — explicit user consent for autonomous purchase above threshold
- [ ] Build product catalog ingestion pipeline with embedding generation for semantic search
- [ ] Implement intent classification layer (browse / compare / buy / return / track)
- [ ] Add guardrails: spend limit enforcement, merchant allowlist, duplicate purchase prevention
- [ ] Design human-in-the-loop escalation for purchases above configurable amount
- [ ] Implement idempotent checkout: retry-safe order submission with deduplication keys
- [ ] Build competitor price monitoring with change detection and alert thresholds
- [ ] Set up audit log for all autonomous purchase decisions (regulatory traceability)

## Best Practices

- Store explicit user preferences as structured memory — agents must personalize, not guess
- Use structured output (JSON schema) for all tool calls — prevents hallucinated product IDs
- Implement optimistic UI for conversational commerce — show cart updates before API confirms
- Rate-limit competitor scraping to comply with ToS — use official pricing APIs where available
- Design pricing rules as declarative config (YAML/DSL), not hardcoded logic — easy to audit and update

## Anti-Patterns

- Never allow agents to complete purchases without a confirmation step for first-time merchants
- Avoid storing payment credentials in agent memory or logs — always tokenize via payment vault
- Do not scrape checkout pages of competitors — price intelligence APIs exist and are ToS-safe
- Avoid stateless agents for commerce — cart and session state must persist across conversation turns
- Do not optimize price purely for margin — factor in customer lifetime value and conversion rate impact
