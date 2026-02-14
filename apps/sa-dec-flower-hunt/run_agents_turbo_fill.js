const fs = require('fs');
const path = require('path');

// Import Agents from compiled distribution
// Note: Adapting import paths based on checked directory structure
const { CustomerPsychologyAgent } = require('./bizplan-cli-toolkit/dist/agents/06-agent');
const { BrandPositioningAgent } = require('./bizplan-cli-toolkit/dist/agents/07-brand-positioning');
const { ContentPillarsAgent } = require('./bizplan-cli-toolkit/dist/agents/08-agent');
const { WebsiteNarrativeAgent } = require('./bizplan-cli-toolkit/dist/agents/09-agent');
const { PerformanceAdsAgent } = require('./bizplan-cli-toolkit/dist/agents/10-agent');
const { StorytellingAgent } = require('./bizplan-cli-toolkit/dist/agents/11-agent');
const { EmailSequencesAgent } = require('./bizplan-cli-toolkit/dist/agents/12-agent');
const { SalesProcessAgent } = require('./bizplan-cli-toolkit/dist/agents/13-agent');
const { FundraisingAgent } = require('./bizplan-cli-toolkit/dist/agents/16-agent');
const { TalentOrgAgent } = require('./bizplan-cli-toolkit/dist/agents/18-agent');
const { DataRoomAgent } = require('./bizplan-cli-toolkit/dist/agents/20-agent');

async function runTurboFill() {
    console.log("🚀 STARTING TURBO-FILL OPERATION (SKILLS 06-20)...");
    console.log("==================================================");

    // 1. Load Master Context
    let masterPlan = "";
    try {
        masterPlan = fs.readFileSync('MASTER_BUSINESS_PLAN_500K.md', 'utf-8');
        console.log("✅ Loaded Master Business Plan Context");
    } catch (e) {
        console.warn("⚠️ Master Plan not found, using generic context.");
        masterPlan = "Project: Sa Dec Flower Hunt. Goal: $500k Revenue. Model: E-commerce + Gamification.";
    }

    const commonInput = {
        project_name: "Sa Dec Flower Hunt",
        target_revenue: 500000,
        idea_or_plan_excerpt: masterPlan.slice(0, 5000) // Truncate to avoid token limits if simulated
    };

    // Helper to mock getContext to prevent errors if dependencies are missing in this script scope
    const mockGetContext = () => ({});

    // 2. Define Agent Queue
    const agents = [
        { id: '06', name: 'Psychology', Class: CustomerPsychologyAgent },
        { id: '07', name: 'Brand', Class: BrandPositioningAgent },
        { id: '08', name: 'Content', Class: ContentPillarsAgent },
        { id: '09', name: 'Landing', Class: WebsiteNarrativeAgent },
        { id: '10', name: 'Ads', Class: PerformanceAdsAgent },
        { id: '11', name: 'Story', Class: StorytellingAgent },
        { id: '12', name: 'Email', Class: EmailSequencesAgent },
        { id: '13', name: 'Sales', Class: SalesProcessAgent },
        { id: '16', name: 'Finance', Class: FundraisingAgent },
        { id: '18', name: 'Talent', Class: TalentOrgAgent },
        { id: '20', name: 'Legal', Class: DataRoomAgent },
    ];

    // 3. Execute concurrently (with slight stagger to avoid log flood)
    for (const agentDef of agents) {
        console.log(`\n▶️  Running Agent ${agentDef.id} (${agentDef.name})...`);

        try {
            const agentInstance = new agentDef.Class();
            agentInstance.getContext = mockGetContext;

            const output = await agentInstance.execute(commonInput);

            // Save Output
            const filename = `output_${agentDef.id}_${agentDef.name.toLowerCase()}.json`;
            fs.writeFileSync(filename, JSON.stringify(output, null, 2));
            console.log(`   ✅ Succeeded! Saved to ${filename}`);

        } catch (err) {
            console.error(`   ❌ Failed Agent ${agentDef.id}:`, err.message);
        }
    }

    console.log("\n==================================================");
    console.log("🎉 TURBO-FILL COMPLETE. Agent Brain is now close to 100% full.");
}

runTurboFill().catch(console.error);
