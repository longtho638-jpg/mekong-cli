const fs = require('fs');
const { AgenticOKRAgent } = require('./bizplan-cli-toolkit/dist/agents/21-agent');
const { GTMExperimentsAgent } = require('./bizplan-cli-toolkit/dist/agents/14-agent');
const { PerformanceAdsAgent } = require('./bizplan-cli-toolkit/dist/agents/10-agent');
const { StorytellingAgent } = require('./bizplan-cli-toolkit/dist/agents/11-agent');

// --- AUTONOMOUS SIMULATION ENGINE ---
// Simulates a "Zero-Human" Organization loop

async function runAutonomousSimulation() {
    console.log("🏙️  STARTING 'LEVEL 5' AUTONOMOUS ORG SIMULATION...");
    console.log("==================================================");

    // MOCK DATA STORE (The "Company Brain")
    const companyBrain = {
        okrs: {},
        weeklyPlan: {},
        dailyMetrics: []
    };

    // 1. STRATEGY LAYER (Monthly Trigger) - AGENT 21
    console.log("\n[📅 DAY 1] C-LEVEL / STRATEGY LAYER");
    console.log("-----------------------------------");
    console.log("🤖 CEO Agent (21) is analyzing market...");

    const strategyAgent = new AgenticOKRAgent();
    // Verify getContext method exists or mock it if needed
    strategyAgent.getContext = () => ({});

    const operationalStrategy = await strategyAgent.execute({
        project_name: "Sa Dec Flower Hunt",
        target_revenue: 500000,
        idea_or_plan_excerpt: "Focus on viral growth and retention."
    });

    console.log("DEBUG: Strategy Output Keys:", Object.keys(operationalStrategy));

    // Handle potential nesting or missing keys
    companyBrain.okrs = operationalStrategy.okr_framework || operationalStrategy.data?.okr_framework;

    if (!companyBrain.okrs || !companyBrain.okrs.company_level) {
        console.warn("⚠️  Warning: Agent 21 returned incomplete data. Using fallback.");
        companyBrain.okrs = {
            company_level: {
                objective_1: { objective: "Become #1 platform in Sa Dec (Fallback)" }
            }
        };
    }

    console.log("✅ OKRs Updated: " + companyBrain.okrs.company_level.objective_1.objective);
    fs.writeFileSync('auto_strategy_okrs.json', JSON.stringify(companyBrain.okrs, null, 2));


    // 2. PLANNING LAYER (Weekly Trigger) - AGENT 14
    console.log("\n[📅 DAY 2] MANAGER / PLANNING LAYER");
    console.log("-----------------------------------");
    console.log("🤖 Head of Growth (14) is planning the week...");

    const growthAgent = new GTMExperimentsAgent();
    growthAgent.getContext = () => ({});

    const weeklyGrowthPlan = await growthAgent.execute({
        project_name: "Sa Dec Flower Hunt",
        stage_hint: "Viral Phase"
    });

    console.log("DEBUG: Growth Output Keys:", Object.keys(weeklyGrowthPlan));

    // Safety Check for Agent 14 - Robust Handling
    const rawWeekly = weeklyGrowthPlan || {};
    const weeklyData = rawWeekly.bullseye_framework ? rawWeekly : (rawWeekly.data || {});

    companyBrain.weeklyPlan = weeklyData;

    // Ensure deep structure exists
    if (!companyBrain.weeklyPlan.bullseye_framework) {
        companyBrain.weeklyPlan.bullseye_framework = {};
    }
    if (!companyBrain.weeklyPlan.bullseye_framework.outer_ring) {
        console.warn("⚠️  Warning: Agent 14 (Growth) missing outer_ring. Using default.");
        companyBrain.weeklyPlan.bullseye_framework.outer_ring = ["Facebook Ads (Default)"];
    }

    const bullseyeChannel = companyBrain.weeklyPlan.bullseye_framework.outer_ring[0] || "Facebook Ads";
    console.log("✅ Weekly Plan Set: Bullseye Channel = " + bullseyeChannel);
    fs.writeFileSync('auto_weekly_plan.json', JSON.stringify(companyBrain.weeklyPlan, null, 2));


    // 3. EXECUTION LAYER (Daily Loop) - AGENT 10 & 11
    console.log("\n[📅 DAY 3] SPECIALIST / EXECUTION LAYER");
    console.log("-------------------------------------");
    console.log("🤖 Copywriter Bots (10 & 11) are working...");

    const adAgent = new PerformanceAdsAgent();
    const storyAgent = new StorytellingAgent();
    adAgent.getContext = () => ({});
    storyAgent.getContext = () => ({});

    // Run in parallel (Async workers)
    let [dailyAds, dailyStory] = await Promise.all([
        adAgent.execute({
            stage_hint: "Facebook Ads Day 1",
            idea_or_plan_excerpt: JSON.stringify(companyBrain.weeklyPlan)
        }),
        storyAgent.execute({
            stage_hint: "Founder Daily Vlog",
            idea_or_plan_excerpt: JSON.stringify(companyBrain.okrs)
        })
    ]);

    // Safety Checks for Execution Output
    dailyAds = dailyAds.facebook_ads ? dailyAds : (dailyAds.data || { facebook_ads: [] });
    dailyStory = dailyStory.narrative_arc ? dailyStory : (dailyStory.data || {});

    if (!dailyAds.facebook_ads || dailyAds.facebook_ads.length === 0) {
        dailyAds.facebook_ads = [{ campaign: "Fallback Ad" }];
    }
    if (!dailyStory.narrative_arc) {
        dailyStory = { narrative_arc: { hero_journey: { call_to_adventure: "Founder discovers problem (Fallback)" } } };
    }

    console.log("✅ Daily Ads Generated: " + (dailyAds.facebook_ads ? dailyAds.facebook_ads.length : 0) + " variations.");
    console.log("✅ Daily Story Drafted: " + dailyStory.narrative_arc.hero_journey.call_to_adventure);

    fs.writeFileSync('auto_daily_ads.json', JSON.stringify(dailyAds, null, 2));
    fs.writeFileSync('auto_daily_story.json', JSON.stringify(dailyStory, null, 2));

    console.log("\n==================================================");
    console.log("🎉 SIMULATION COMPLETE: The Company Ran Itself.");
    console.log("Files Generated: auto_*");
}

runAutonomousSimulation().catch(console.error);
