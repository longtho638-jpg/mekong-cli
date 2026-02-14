const fs = require('fs');
const { AAARRAnalyticsAgent } = require('./bizplan-cli-toolkit/dist/agents/15-agent');
const { RiskScenarioAgent } = require('./bizplan-cli-toolkit/dist/agents/17-agent');
const { IndustryPatternsAgent } = require('./bizplan-cli-toolkit/dist/agents/19-agent');

async function run() {
    console.log("🚀 Starting PHASE 6 Execution: Governance & Metrics...");

    const inputContent = fs.readFileSync('/Users/macbookprom1/Documents/sa-dec-flower-hunt/BUSINESS_PLAN_INPUT.md', 'utf-8');

    // Mock Context
    const context = {
        '05': { // Financials
            unit_economics: { ltv: 50, cac: 5 }
        },
        '14': { // GTM
            bullseye_framework: {
                inner_ring_channels: ["Viral Loop", "Facebook Ads"]
            }
        }
    };

    const agentInput = {
        idea_or_plan_excerpt: inputContent,
        project_name: "Sa Dec Flower Hunt (AgriTech)",
        target_revenue: 500000,
        timeline: "2026",
        stage_hint: "Expansion"
    };

    const mockGetContext = (skillId) => context[skillId] || {};

    const agent15 = new AAARRAnalyticsAgent();
    agent15.getContext = mockGetContext;

    const agent17 = new RiskScenarioAgent();
    agent17.getContext = mockGetContext;

    const agent19 = new IndustryPatternsAgent();
    agent19.getContext = mockGetContext;

    // Execute
    console.log("👉 Agent 15: Defining Viral Metrics & Dashboard...");
    const out15 = await agent15.execute(agentInput);
    fs.writeFileSync('output_15_metrics.json', JSON.stringify(out15, null, 2));

    console.log("👉 Agent 17: Analyzing Platform Risks...");
    const out17 = await agent17.execute(agentInput);
    fs.writeFileSync('output_17_risk.json', JSON.stringify(out17, null, 2));

    console.log("👉 Agent 19: Benchmarking vs SaaS Standards...");
    const out19 = await agent19.execute(agentInput);
    fs.writeFileSync('output_19_benchmarks.json', JSON.stringify(out19, null, 2));

    console.log("✅ PHASE 6 COMPLETE! Governance Assets Ready.");
}

run().catch(console.error);
