const fs = require('fs');
const path = require('path');

// Import Agents (compiled JS)
const { GapReportAgent } = require('./bizplan-cli-toolkit/dist/agents/04-agent');
const { BusinessModelAgent } = require('./bizplan-cli-toolkit/dist/agents/05-agent');
const { AgenticOKRAgent } = require('./bizplan-cli-toolkit/dist/agents/21-agent');

async function run() {
    console.log("🚀 Starting WOW Execution for $500k Goal...");

    // 1. Read Input
    const inputContent = fs.readFileSync('/Users/macbookprom1/Documents/sa-dec-flower-hunt/BUSINESS_PLAN_INPUT.md', 'utf-8');

    // Mock Context (Simulating prior agents)
    const context = {
        '01': {
            summary: "Sa Dec Flower Hunt - AgriTech Platform connecting farmers to Gen Z.",
            analysis: "Strong potential for tech-enabled disruption in traditional flower market."
        },
        '03': { // IPO Readiness
            stage: "Seed",
            score: 25,
            gap_summary: "Need financial formalization and tech scalability."
        },
        '05': { // Will be populated by Agent 05 run
            archetype: "Marketplace + D2C Brand",
            unit_economics: {
                cac: 5,
                ltv: 50
            }
        },
        '06': { // Customer Psych
            target_audience_summary: { who_they_are: "Gen Z Urban" }
        }
    };

    // Shared Input Object
    const agentInput = {
        idea_or_plan_excerpt: inputContent,
        project_name: "Sa Dec Flower Hunt",
        target_revenue: 500000,
        currency: "USD",
        timeline: "2026",
        stage_hint: "Seed",
        market_context_hint: "Vietnam AgriTech, Gen Z consumers",
        segment_hint: "Urban Gen Z",
        b2b_or_b2c: "B2C & B2B"
    };

    // 2. Run Agent 05 (Business Model -> Financials)
    const agent05 = new BusinessModelAgent();
    // Inject context mock manually if needed, or BaseAgent handles it via a StateManager. 
    // BaseAgent usually takes a StateManager. We'll mock it or just pass context in input if agent supports it.
    // Looking at code: `this.getContext('03', input)` -> input probably needs to contain the context map if I can't pass state manager.
    // Actually BaseAgent `getContext` usually reads from a file or state. 
    // Let's monkey-patch getContext for this script to keep it simple.

    const mockGetContext = (skillId) => context[skillId] || {};
    agent05.getContext = mockGetContext;
    const agent04 = new GapReportAgent();
    agent04.getContext = mockGetContext;
    const agent21 = new AgenticOKRAgent();
    agent21.getContext = mockGetContext;

    console.log("👉 Agent 05: Analyzing Unit Economics...");
    const out05 = await agent05.execute(agentInput);
    context['05'] = out05; // Update context for next agents
    fs.writeFileSync('output_05_financials.json', JSON.stringify(out05, null, 2));

    console.log("👉 Agent 04: Building Roadmap...");
    const out04 = await agent04.execute(agentInput);
    context['04'] = out04;
    fs.writeFileSync('output_04_roadmap.json', JSON.stringify(out04, null, 2));

    console.log("👉 Agent 21: Setting OKRs...");
    const out21 = await agent21.execute(agentInput);
    fs.writeFileSync('output_21_okrs.json', JSON.stringify(out21, null, 2));

    console.log("✅ DONE! Outputs saved.");
}

run().catch(console.error);
