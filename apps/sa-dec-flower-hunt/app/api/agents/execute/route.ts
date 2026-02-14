import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase';

/**
 * Agent Execution API
 * 🔒 SECURITY: Requires authentication for POST requests
 * GET: List all available agents (public info)
 * POST: Execute an agent (authenticated only)
 */

// Dynamically import to avoid build-time issues with Node.js modules
async function getAgentRouter() {
    const { AgentRouter } = await import('@/bizplan-cli-toolkit/src/orchestrator/agent-router');
    return new AgentRouter();
}

// GET: List agents (public - just capabilities listing)
export async function GET(req: NextRequest) {
    try {
        const router = await getAgentRouter();
        const capabilities = router.getCapabilities();

        return NextResponse.json({
            success: true,
            totalAgents: capabilities.length,
            agents: capabilities.map(agent => ({
                id: agent.id,
                name: agent.name,
                description: agent.description,
                dependencies: agent.dependencies
            }))
        });
    } catch (error: any) {
        console.error('Agent list error:', error);
        return NextResponse.json(
            { error: 'Failed to list agents', details: error.message },
            { status: 500 }
        );
    }
}

// POST: Execute agent (🔒 AUTHENTICATED ONLY)
export async function POST(req: NextRequest) {
    try {
        // 🔒 SECURITY: Require authentication
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required to execute agents' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { agentId, input = {} } = body;

        // 🔒 Input validation
        if (!agentId || typeof agentId !== 'string') {
            return NextResponse.json(
                { error: 'agentId is required and must be a string' },
                { status: 400 }
            );
        }

        // Validate agentId format (prevent injection)
        if (!/^[a-zA-Z0-9_-]+$/.test(agentId)) {
            return NextResponse.json(
                { error: 'Invalid agentId format' },
                { status: 400 }
            );
        }

        // Validate agent exists
        const router = await getAgentRouter();

        if (!router.hasAgent(agentId)) {
            return NextResponse.json({
                error: `Agent ${agentId} not found`,
                availableAgents: router.listAgentIds()
            }, { status: 404 });
        }

        const agent = router.getAgent(agentId);
        const startTime = Date.now();

        console.log(`🤖 [${user.email}] Executing Agent ${agentId}: ${agent.name}`);

        // Prepare input with context
        const agentInput = {
            ...input,
            context: {
                previousOutputs: new Map(),
                userId: user.id,  // 🔒 Pass user context
                ...(input.context || {})
            }
        };

        // Execute with timeout (30 seconds max)
        const result = await Promise.race([
            agent.execute(agentInput),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Agent execution timeout (30s)')), 30000)
            )
        ]);

        const executionTime = Date.now() - startTime;
        console.log(`✅ Agent ${agentId} completed in ${executionTime}ms for user ${user.email}`);

        return NextResponse.json({
            success: true,
            agentId,
            agentName: agent.name,
            executionTimeMs: executionTime,
            output: result,
            executedBy: user.email,
            executedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Agent execution error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Agent execution failed',
                details: error.message
            },
            { status: 500 }
        );
    }
}
