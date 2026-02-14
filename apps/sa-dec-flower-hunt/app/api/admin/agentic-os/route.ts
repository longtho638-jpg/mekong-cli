/**
 * ============================================================================
 * AGENTIC OS API ENDPOINT
 * ============================================================================
 * Exposes the MasterAgent (CEO) Core IP functionality via REST API
 * 
 * @author Minh Long
 * @copyright 2024 AGRIOS Tech
 * ============================================================================
 */

import { NextResponse } from 'next/server';

// Dynamic import to handle client/server boundaries
async function getMasterAgent() {
    const { MasterAgent } = await import('@/bizplan-cli-toolkit/src/orchestrator/master-agent');
    return new MasterAgent();
}

/**
 * GET /api/admin/agentic-os
 * 
 * Returns Agentic OS capabilities and status
 */
export async function GET() {
    return NextResponse.json({
        success: true,
        coreIpName: 'Agentic OS Engine',
        version: '1.0.0',
        author: 'Minh Long',
        capabilities: {
            orchestrator: 'MasterAgent (CEO)',
            departments: ['Marketing', 'Sales', 'Finance'],
            agents: [
                { id: 2, name: 'Agentic Mapping Agent' },
                { id: 3, name: 'IPO Readiness Agent' },
                { id: 4, name: 'Gap Report Agent' },
                { id: 5, name: 'Business Model Agent' },
                { id: 6, name: 'Customer Psychology Agent' },
                { id: 11, name: 'Storytelling Agent' },
                { id: 13, name: 'Sales Process Agent' },
                { id: 16, name: 'Fundraising Agent' },
                { id: 21, name: 'OKR Agent' },
                // ... 24 total agents
            ],
            workflows: ['marketing', 'sales', 'gtm', 'fundraising', 'custom']
        },
        status: 'operational',
        timestamp: new Date().toISOString()
    });
}

/**
 * POST /api/admin/agentic-os
 * 
 * Execute Agentic OS workflow via MasterAgent
 * 
 * @param {string} workflow - One of: 'marketing', 'sales', 'gtm', 'fundraising'
 * @param {object} data - Additional context data
 * @returns {Object} CEO report with department outputs
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { workflow, data } = body;

        console.log(`🎯 [Agentic OS API] Executing workflow: ${workflow}`);

        const startTime = Date.now();

        // Get MasterAgent (CEO)
        const masterAgent = await getMasterAgent();

        // Create strategic directive
        const directive = {
            type: workflow || 'gtm',
            workflowPreset: workflow || 'gtm',
            data: data || {
                idea_or_offer: 'Sa Dec Flower Hunt Platform',
                target_persona_hint: 'Gen Z & Millennials, eco-tourism',
                primary_goal: 'growth'
            }
        };

        // Execute orchestration
        const result = await masterAgent.orchestrate(directive);

        const executionTime = Date.now() - startTime;

        console.log(`✅ [Agentic OS API] Workflow complete in ${executionTime}ms`);

        return NextResponse.json({
            success: true,
            coreIpVersion: '1.0.0',
            executionTimeMs: executionTime,
            timestamp: new Date().toISOString(),
            workflow,
            result
        });

    } catch (error) {
        console.error('❌ [Agentic OS API] Error:', error);

        return NextResponse.json({
            success: false,
            error: (error as Error).message,
            stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
