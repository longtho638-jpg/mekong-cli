/**
 * ============================================================================
 * GARDEN OS AGENTS API ENDPOINT
 * ============================================================================
 * Exposes Garden OS Framework agents: TikTok, SEO, Content, Lead Nurture
 * 
 * @author Minh Long
 * @copyright 2024 AGRIOS Tech
 * ============================================================================
 */

import { NextResponse } from 'next/server';

// Dynamic imports for Garden OS agents
async function getAgent(agentType: string) {
    switch (agentType) {
        case 'content':
            const { ContentGeneratorAgent } = await import('@/lib/agents/content-generator');
            return new ContentGeneratorAgent();
        case 'tiktok':
            const { TikTokViralAgent } = await import('@/lib/agents/tiktok-viral');
            return new TikTokViralAgent();
        case 'seo':
            const { SEOBlogAgent } = await import('@/lib/agents/seo-blog');
            return new SEOBlogAgent();
        case 'lead':
            const { LeadNurtureAgent } = await import('@/lib/agents/lead-nurture');
            return new LeadNurtureAgent();
        default:
            return null;
    }
}

/**
 * GET /api/admin/garden-os
 * 
 * Returns Garden OS capabilities and available agents
 */
export async function GET() {
    return NextResponse.json({
        success: true,
        coreIpName: 'Garden OS Framework',
        version: '1.0.0',
        author: 'Minh Long',
        agents: [
            { id: 'yield', name: 'Yield Predictor', endpoint: '/api/admin/yield-predictor' },
            { id: 'content', name: 'Content Generator', status: 'available' },
            { id: 'tiktok', name: 'TikTok Viral Agent', status: 'available' },
            { id: 'seo', name: 'SEO Blog Agent', status: 'available' },
            { id: 'lead', name: 'Lead Nurture Agent', status: 'available' }
        ],
        features: [
            'Demand Forecasting',
            'Dynamic Pricing',
            'Flash Sale Detection',
            'Multi-channel Content Generation',
            'Viral Content Strategy',
            'SEO Optimization',
            'Lead Nurturing Automation'
        ],
        status: 'operational',
        timestamp: new Date().toISOString()
    });
}

/**
 * POST /api/admin/garden-os
 * 
 * Execute specific Garden OS agent
 * 
 * @param {string} agent - One of: 'content', 'tiktok', 'seo', 'lead'
 * @param {object} input - Agent-specific input
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { agent: agentType, input } = body;

        console.log(`🌱 [Garden OS API] Executing ${agentType} agent...`);

        const startTime = Date.now();

        const agent = await getAgent(agentType);

        if (!agent) {
            return NextResponse.json({
                success: false,
                error: `Unknown agent: ${agentType}. Available: content, tiktok, seo, lead`
            }, { status: 400 });
        }

        // Execute agent
        let result;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const agentAny = agent as any;
        if (typeof agentAny.execute === 'function') {
            result = await agentAny.execute(input || {});
        } else if (typeof agentAny.generate === 'function') {
            result = await agentAny.generate(input || {});
        } else if (typeof agentAny.run === 'function') {
            result = await agentAny.run(input || {});
        } else if (typeof agentAny.generateDailyContent === 'function') {
            result = await agentAny.generateDailyContent();
        } else {
            // Return agent info if no execute method
            result = { info: 'Agent loaded, check methods', methods: Object.keys(agent) };
        }

        const executionTime = Date.now() - startTime;

        console.log(`✅ [Garden OS API] ${agentType} completed in ${executionTime}ms`);

        return NextResponse.json({
            success: true,
            coreIpVersion: '1.0.0',
            agent: agentType,
            executionTimeMs: executionTime,
            timestamp: new Date().toISOString(),
            result
        });

    } catch (error) {
        console.error('❌ [Garden OS API] Error:', error);

        return NextResponse.json({
            success: false,
            error: (error as Error).message,
            stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
