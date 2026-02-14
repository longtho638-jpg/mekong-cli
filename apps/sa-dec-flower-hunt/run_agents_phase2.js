const fs = require('fs');
const path = require('path');

// Import Agents (compiled JS)
const { GapReportAgent } = require('./bizplan-cli-toolkit/dist/agents/04-agent');
const { BusinessModelAgent } = require('./bizplan-cli-toolkit/dist/agents/05-agent');
const { AgenticOKRAgent } = require('./bizplan-cli-toolkit/dist/agents/21-agent');
const { GTMExperimentsAgent } = require('./bizplan-cli-toolkit/dist/agents/14-agent'); // New
const { FundraisingAgent } = require('./bizplan-cli-toolkit/dist/agents/16-agent');   // New

async function run() {
    console.log("🚀 Starting PHASE 2 Execution: Growth & Capital...");

    // 1. Read Input
    const inputContent = fs.readFileSync('/Users/macbookprom1/Documents/sa-dec-flower-hunt/BUSINESS_PLAN_INPUT.md', 'utf-8');

    // Mock Context (Updated with "LIVE" status)
    const context = {
        '01': {
            summary: "Sa Dec Flower Hunt - AgriTech Platform connecting farmers to Gen Z.",
            analysis: "Strong potential. MVP (Climate Warrior) is LIVE. Traction phase." // Updated
        },
        '03': {
            stage: "Seed",
            score: 40, // Bumped score due to MVP launch
            gap_summary: "Need to prove retention and monetization of the App."
        },
        '05': { // Mocking output of 05 for speed if we skip it, but we can run it or reuse
            archetype: "Marketplace + SaaS",
            unit_economics: { cac: 5, ltv: 50 }
        },
        '06': {
            target_audience_summary: { who_they_are: "Gen Z Urban & Tech-Savvy Farmers" }
        },
        '07': { // Brand Positioning (Needed for Fundraising)
            brand_essence: "AgriTech for the Future",
            positioning_statement: "The 'Grab' for Vietnam's Flower Industry."
        }
    };

    // Shared Input Object
    const agentInput = {
        idea_or_plan_excerpt: inputContent,
        project_name: "Sa Dec Flower Hunt (AgriTech)",
        target_revenue: 500000,
        currency: "USD",
        timeline: "2026",
        stage_hint: "Early Traction / Pre-Series A", // Updated stage
        market_context_hint: "Vietnam AgriTech, Gen Z, Climate Change adaptation",
        segment_hint: "Urban Gen Z",
        b2b_or_b2c: "B2B2C",
        fundraising_goal: "$2M Seed+", // For Agent 16
        traction_data: "2 Apps Live, Viral 'Check-in' Feature deployed" // For Agent 16
    };

    // Initialize Agents
    const mockGetContext = (skillId) => context[skillId] || {};

    const agent14 = new GTMExperimentsAgent();
    agent14.getContext = mockGetContext;

    const agent16 = new FundraisingAgent();
    agent16.getContext = mockGetContext;

    // Execute
    console.log("👉 Agent 14: Designing GTM Experiments (Bullseye)...");
    const out14 = await agent14.execute(agentInput);
    fs.writeFileSync('output_14_gtm.json', JSON.stringify(out14, null, 2));

    console.log("👉 Agent 16: Crafting VC Narrative...");
    const out16 = await agent16.execute(agentInput);
    fs.writeFileSync('output_16_fundraising.json', JSON.stringify(out16, null, 2));

    console.log("✅ PHASE 2 COMPLETE! Strategy Generated.");
}

run().catch(console.error);
