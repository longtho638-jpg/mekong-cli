const fs = require('fs');
const { PerformanceAdsAgent } = require('./bizplan-cli-toolkit/dist/agents/10-agent');
const { StorytellingAgent } = require('./bizplan-cli-toolkit/dist/agents/11-agent');
const { ContentPillarsAgent } = require('./bizplan-cli-toolkit/dist/agents/08-agent');

async function run() {
    console.log("🚀 STARTING MARKETING AUTOPILOT (AGENT 25)...");
    console.log("🤖 Mode: 100% Automation | Context: Viral Launch Phase 2");

    // Load the Launch Kit Context
    const launchKit = fs.readFileSync('VIRAL_LAUNCH_KIT_PHASE2.md', 'utf-8');

    // MOCK CONTEXT (Simulating the 'Brain' of the project)
    const context = {
        '07': { brand_voice: "Gen Z, Sustainability, High-Tech, witty" },
        '14': { gtm_strategy: "Viral Loop + Facebook Ads Bullseye" }
    };
    const mockGetContext = (skillId) => context[skillId] || {};

    // INITIALIZE AGENTS
    const agent10 = new PerformanceAdsAgent(); // Ads
    const agent11 = new StorytellingAgent();   // Stories/PR
    const agent08 = new ContentPillarsAgent(); // Social Posts

    agent10.getContext = mockGetContext;
    agent11.getContext = mockGetContext;
    agent08.getContext = mockGetContext;

    const baseInput = {
        idea_or_plan_excerpt: launchKit,
        project_name: "Sa Dec Flower Hunt",
        target_revenue: 500000
    };

    // --- STEP 1: GENERATE AD VARIATIONS (Day 2 & 3) ---
    console.log("👉 [AUTOPILOT] Generating 5 Ad Variations for 'Heat Audit'...");
    const adOutput = await agent10.execute({
        ...baseInput,
        stage_hint: "Viral Launch"
    });
    fs.writeFileSync('autopilot_ads.json', JSON.stringify(adOutput, null, 2));

    // --- STEP 2: GENERATE FOUNDER STORIES (Day 1 & 6) ---
    console.log("👉 [AUTOPILOT] Drafting Founder Story & PR Angles...");
    const storyOutput = await agent11.execute({
        ...baseInput,
        stage_hint: "Founder Narrative"
    });
    fs.writeFileSync('autopilot_stories.json', JSON.stringify(storyOutput, null, 2));

    // --- STEP 3: GENERATE DAILY SOCIAL POSTS (Day 4, 5, 7) ---
    console.log("👉 [AUTOPILOT] Creating 7-Day Social Content Calendar...");
    const contentOutput = await agent08.execute({
        ...baseInput,
        stage_hint: "Facebook/TikTok Seeding"
    });
    fs.writeFileSync('autopilot_content_cal.json', JSON.stringify(contentOutput, null, 2));

    console.log("✅ Marketing Autopilot Complete! All assets generated in JSON.");
    console.log("   - Ads: autopilot_ads.json");
    console.log("   - Stories: autopilot_stories.json");
    console.log("   - Content: autopilot_content_cal.json");
}

run().catch(console.error);
