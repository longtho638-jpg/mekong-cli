/**
 * Accounting API Routes
 * RESTful endpoints for Chart of Accounts, Journal Entries, Reports
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { AccountingService } from '@/lib/accounting';

// Force dynamic for SSR
export const dynamic = 'force-dynamic';

// Initialize service lazily
function getService() {
    return new AccountingService();
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/accounting
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');
        const action = searchParams.get('action') || 'chart';

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }

        const service = getService();

        switch (action) {
            case 'chart':
                const accounts = await service.getChartOfAccounts(tenantId);
                return NextResponse.json({
                    success: true,
                    data: accounts,
                    count: accounts.length
                });

            case 'trial-balance':
                const trialBalance = await service.getTrialBalance(tenantId, new Date());
                return NextResponse.json({
                    success: true,
                    data: trialBalance
                });

            case 'pnl':
                const fromDate = searchParams.get('from')
                    ? new Date(searchParams.get('from')!)
                    : new Date(new Date().getFullYear(), 0, 1);
                const toDate = searchParams.get('to')
                    ? new Date(searchParams.get('to')!)
                    : new Date();
                const pnl = await service.getProfitAndLoss(tenantId, fromDate, toDate);
                return NextResponse.json({
                    success: true,
                    data: pnl
                });

            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Accounting API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch accounting data' },
            { status: 500 }
        );
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/accounting
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tenantId, action, ...data } = body;

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }

        const service = getService();

        switch (action) {
            case 'initialize':
                await service.initializeChartOfAccounts(tenantId);
                return NextResponse.json({
                    success: true,
                    message: 'Chart of accounts initialized'
                });

            case 'create-account':
                const account = await service.createAccount(tenantId, data.account);
                return NextResponse.json({
                    success: true,
                    data: account
                });

            case 'create-journal':
                const journal = await service.createJournalEntry(
                    tenantId,
                    {
                        date: new Date(data.date),
                        reference: data.reference,
                        description: data.description,
                        lines: data.lines,
                    },
                    data.userId
                );
                return NextResponse.json({
                    success: true,
                    data: journal
                });

            case 'post-journal':
                await service.postJournalEntry(tenantId, data.journalId);
                return NextResponse.json({
                    success: true,
                    message: 'Journal entry posted'
                });

            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Accounting API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Operation failed' },
            { status: 500 }
        );
    }
}
