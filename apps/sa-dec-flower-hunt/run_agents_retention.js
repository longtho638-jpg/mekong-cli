const fs = require('fs');
const { WebsiteNarrativeAgent } = require('./bizplan-cli-toolkit/dist/agents/09-agent');
const { EmailSequencesAgent } = require('./bizplan-cli-toolkit/dist/agents/12-agent');

async function run() {
    console.log("🚀 Starting PHASE 5 Execution: Retention & Conversion...");

    const inputContent = fs.readFileSync('/Users/macbookprom1/Documents/sa-dec-flower-hunt/BUSINESS_PLAN_INPUT.md', 'utf-8');

    // Mock Context (Updated with Phase 4 Assets)
    const context = {
        '06': { // Personas
            customer_personas: [
                { name: "Urban Gen Z", pain: "Plants die in heat", motivation: "Green aesthetics, Low effort" }
            ]
        },
        '07': { // Brand
            brand_essence: "AgriTech / Future of Farming",
            positioning_statement: "We solve the Heat Island effect with biology."
        },
        '08': { // Content Pillars
            pillars: ["Heat Resilience", "Urban Farming Tech", "Sa Dec Heritage"]
        },
        '14': { // GTM
            acquisition_channels: ["Viral Check-in", "Climate Scanner"] // Key context for emails
        }
    };

    const agentInput = {
        idea_or_plan_excerpt: inputContent,
        project_name: "Sa Dec Flower Hunt",
        target_revenue: 500000,
        timeline: "2026",
        stage_hint: "Expansion"
    };

    const mockGetContext = (skillId) => context[skillId] || {};

    // Initialize Agents
    const agent09 = new WebsiteNarrativeAgent();
    agent09.getContext = mockGetContext;

    const agent12 = new EmailSequencesAgent();
    agent12.getContext = mockGetContext;

    // Execute
    console.log("👉 Agent 09: Designing 'High-Tech' Landing Page Copy...");
    const out09 = await agent09.execute(agentInput);
    fs.writeFileSync('output_09_web.json', JSON.stringify(out09, null, 2));

    console.log("👉 Agent 12: Drafting 'Climate Warrior' Onboarding Emails...");
    const out12 = await agent12.execute(agentInput);
    fs.writeFileSync('output_12_email.json', JSON.stringify(out12, null, 2));

    console.log("✅ PHASE 5 COMPLETE! Retention Assets Ready.");
}

run().catch(console.error);
