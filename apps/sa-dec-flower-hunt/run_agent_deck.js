const fs = require('fs');
const { TalentOrgAgent } = require('./bizplan-cli-toolkit/dist/agents/18-agent');

async function run() {
    console.log("🚀 Starting PHASE 3 Execution: Talent & Org Design...");

    const inputContent = fs.readFileSync('/Users/macbookprom1/Documents/sa-dec-flower-hunt/BUSINESS_PLAN_INPUT.md', 'utf-8');

    // Mock Context (Updated with Phase 2 outputs)
    const context = {
        '01': {
            summary: "AgriTech Platform.",
            analysis: "Series A trajectory."
        },
        '05': {
            archetype: "Marketplace + SaaS",
            unit_economics: { cac: 5, ltv: 50 }
        }
    };

    const agentInput = {
        idea_or_plan_excerpt: inputContent,
        project_name: "Sa Dec Flower Hunt (AgriTech)",
        stage_hint: "Seed to Series A",
        current_headcount: "10-20", // Mock
        target_headcount: "50"
    };

    const agent18 = new TalentOrgAgent();
    // Monkey-patch context
    agent18.getContext = (skillId) => context[skillId] || {};

    console.log("👉 Agent 18: Designing Org Chart & Hiring Plan...");
    const out18 = await agent18.execute(agentInput);
    fs.writeFileSync('output_18_talent.json', JSON.stringify(out18, null, 2));

    console.log("✅ PHASE 3 COMPLETE! Talent Data Ready.");
}

run().catch(console.error);
