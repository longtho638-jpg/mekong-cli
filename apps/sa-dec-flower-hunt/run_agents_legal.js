const fs = require('fs');
const { DataRoomAgent } = require('./bizplan-cli-toolkit/dist/agents/20-agent');

async function run() {
    console.log("🚀 Starting LEGAL & COMPLIANCE Agent Activation...");
    console.log("   --> Target: Agent 20 (Data Room & Investor Materials)");

    const inputContent = fs.readFileSync('/Users/macbookprom1/Documents/sa-dec-flower-hunt/BUSINESS_PLAN_INPUT.md', 'utf-8');

    // Mock Context for Legal Analysis
    const context = {
        '04': { // Gap Report
            governance_gaps: ["Board Composition", "IP Assignment"]
        },
        '16': { // Fundraising
            target_valuation: 60000000,
            investor_type: "VC"
        }
    };

    const agentInput = {
        idea_or_plan_excerpt: inputContent,
        project_name: "Sa Dec Flower Hunt (AgriOS)",
        company_stage: "Seed/Angel",
        fundraising_type: "Equity",
        target_valuation: 20000000 // Base for Seed
    };

    const mockGetContext = (skillId) => context[skillId] || {};

    const agent20 = new DataRoomAgent();
    agent20.getContext = mockGetContext;

    console.log("👉 Agent 20: Structuring Legal Data Room & IP Assets...");
    console.log("   ... Generating Due Diligence Checklist...");
    console.log("   ... Mapping IP Ownership (Source Code to Equity)...");

    // Execute Agent
    try {
        const out20 = await agent20.execute(agentInput);
        fs.writeFileSync('output_20_legal.json', JSON.stringify(out20, null, 2));
        console.log("✅ LEGAL ASSETS GENERATED: 'output_20_legal.json'");
        console.log("   - Corporate Structure: Ready");
        console.log("   - IP & Tech Stack Audit: Ready");
        console.log("   - Investor Data Room: Ready");
    } catch (error) {
        console.error("❌ Agent Execution Failed:", error);
    }
}

run().catch(console.error);
