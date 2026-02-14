import { NextRequest, NextResponse } from 'next/server';
import { agentService, AgentRole } from '@/lib/agents/agent-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { role, query, context } = body;

        // Validate inputs
        if (!role || !query) {
            return NextResponse.json(
                { error: 'Missing required fields: role, query' },
                { status: 400 }
            );
        }

        // Validate role (Value Chain OS Upgrade)
        const validRoles: AgentRole[] = ['yield-predictor', 'hunter-guide', 'kpi-dashboard', 'garden-os', 'customer', 'finance-ops'];
        if (!validRoles.includes(role as AgentRole)) {
            return NextResponse.json(
                { error: `Invalid agent role. Valid roles: ${validRoles.join(', ')}` },
                { status: 400 }
            );
        }

        // Run agent
        const output = await agentService.runAgent(role as AgentRole, {
            query,
            context
        });

        return NextResponse.json({
            success: true,
            data: output
        });

    } catch (error: any) {
        console.error('Agent API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    // Return list of available agents
    const agents = agentService.getAllAgents();

    return NextResponse.json({
        success: true,
        agents: agents.map(a => ({
            id: a.id,
            role: a.role,
            name: a.name,
            nameVi: a.nameVi,
            owner: a.owner
        }))
    });
}
