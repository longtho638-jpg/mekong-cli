import { NextRequest, NextResponse } from 'next/server';
import { AutonomousMasterAgent } from '@/bizplan-cli-toolkit/src/orchestrator/autonomous-master';

/**
 * Autonomous CEO Execution Endpoint
 * Triggered by Vercel Cron Job daily at 2am Vietnam time
 * 
 * Vercel Cron Syntax: 0 19 * * * (2am Vietnam = 7pm UTC previous day)
 */
export async function GET(request: NextRequest) {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('🤖 Autonomous CEO: Daily execution started');

        const autonomousCEO = new AutonomousMasterAgent();
        const result = await autonomousCEO.runDailyAutonomousCycle();

        console.log('✅ Autonomous CEO: Execution completed');

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            result: result
        });

    } catch (error) {
        console.error('❌ Autonomous CEO: Execution failed', error);

        return NextResponse.json({
            success: false,
            error: (error as Error).message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
