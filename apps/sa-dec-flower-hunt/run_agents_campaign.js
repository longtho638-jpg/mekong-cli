const fs = require('fs');

// Import Agents (compiled JS)
const { PerformanceAdsAgent } = require('./bizplan-cli-toolkit/dist/agents/10-agent');
const { StorytellingAgent } = require('./bizplan-cli-toolkit/dist/agents/11-agent');
const { SalesProcessAgent } = require('./bizplan-cli-toolkit/dist/agents/13-agent');

async function run() {
    console.log("🚀 Starting PHASE 4 Execution: Campaign & Sales Assets...");

    const inputContent = fs.readFileSync('/Users/macbookprom1/Documents/sa-dec-flower-hunt/BUSINESS_PLAN_INPUT.md', 'utf-8');

    // Mock Context (Updated with Phase 2/3 outputs)
    const context = {
        '01': { summary: "AgriTech Platform.", analysis: "Traction Phase." },
        '06': {
            customer_personas: [
                { name: "Urban Gen Z", pain: "Plants die in heat", motivation: "Green lifestyle without effort" },
                { name: "Traditional Farmer", pain: "Unstable prices", motivation: "Guaranteed outlet" }
            ]
        },
        '07': { brand_positioning: "The Grab for Flower Industry. High-Tech, Resilient, Convenient." },
        '14': { // GTM Strategy
            bullseye_framework: {
                inner_ring_channels: [{ channel: "Facebook Ads" }, { channel: "TikTok Viral" }]
            }
        }
    };

    const agentInput = {
        idea_or_plan_excerpt: inputContent,
        project_name: "Sa Dec Flower Hunt",
        target_revenue: 500000,
        stage_hint: "Expansion",
        market_context_hint: "Urban Heat Islands vs AgriTech Solution"
    };

    const mockGetContext = (skillId) => context[skillId] || {};

    // Initialize Agents
    const agent10 = new PerformanceAdsAgent();
    agent10.getContext = mockGetContext;

    const agent11 = new StorytellingAgent();
    agent11.getContext = mockGetContext;

    const agent13 = new SalesProcessAgent();
    agent13.getContext = mockGetContext;

    // Execute
    console.log("👉 Agent 10: Generating Facebook/TikTok Ad Creatives...");
    const out10 = await agent10.execute(agentInput);
    fs.writeFileSync('output_10_ads.json', JSON.stringify(out10, null, 2));

    console.log("👉 Agent 11: Writing 'Climate Warrior' PR Story...");
    const out11 = await agent11.execute(agentInput);
    fs.writeFileSync('output_11_story.json', JSON.stringify(out11, null, 2));

    console.log("👉 Agent 13: Building 'Farm2Phone' Sales Playbook...");
    const out13 = await agent13.execute(agentInput);
    fs.writeFileSync('output_13_sales.json', JSON.stringify(out13, null, 2));

    console.log("✅ PHASE 4 COMPLETE! Assets Generated.");
}

run().catch(console.error);
