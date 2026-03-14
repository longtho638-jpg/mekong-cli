import { http, HttpResponse, HttpHandler } from 'msw';

const API_BASE = 'http://localhost:8000/api';

export const handlers: HttpHandler[] = [
  // Balance endpoint
  http.get(`${API_BASE}/workspaces/:workspaceId/billing/balance`, ({ params }) => {
    const { workspaceId } = params;
    return HttpResponse.json({
      workspace_id: workspaceId as string,
      workspace_name: 'Test Workspace',
      balance: 500,
      total_earned: 1000,
      total_spent: 500,
      updated_at: new Date().toISOString(),
    });
  }),

  // Usage endpoint
  http.get(`${API_BASE}/workspaces/:workspaceId/billing/usage`, ({ params }) => {
    const { workspaceId } = params;
    return HttpResponse.json({
      workspace_id: workspaceId as string,
      workspace_name: 'Test Workspace',
      tier: 'starter',
      daily_used: 5,
      daily_limit: 20,
      daily_remaining: 15,
      daily_percent: 25,
      monthly_used: 150,
      monthly_limit: 500,
      monthly_remaining: 350,
      monthly_percent: 30,
      overage_allowed: true,
    });
  }),

  // Alerts endpoint
  http.get(`${API_BASE}/workspaces/:workspaceId/billing/alerts`, ({ request }) => {
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unread_only') !== 'false';

    const alerts = unreadOnly
      ? [
          {
            id: 'alert-1',
            workspace_id: 'test-workspace',
            alert_type: 'warning',
            threshold_pct: 80,
            current_pct: 85,
            triggered_at: new Date().toISOString(),
            is_read: false,
            message: 'Usage exceeded 80% of monthly quota',
          },
        ]
      : [];

    return HttpResponse.json(alerts);
  }),

  // Acknowledge alert endpoint
  http.post(`${API_BASE}/workspaces/:workspaceId/billing/alerts/:alertId/acknowledge`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Alert acknowledged',
    });
  }),

  // Tier endpoint
  http.get(`${API_BASE}/workspaces/:workspaceId/billing/tier`, ({ params }) => {
    const { workspaceId } = params;
    return HttpResponse.json({
      workspace_id: workspaceId as string,
      workspace_name: 'Test Workspace',
      tier: 'starter',
      daily_limit: 20,
      monthly_limit: 500,
      overage_allowed: true,
    });
  }),

  // History endpoint
  http.get(`${API_BASE}/workspaces/:workspaceId/billing/history`, ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const transactions = [
      {
        id: 'tx-1',
        workspace_id: 'test-workspace',
        amount: 100,
        reason: 'Credit purchase',
        timestamp: new Date().toISOString(),
        metadata: { source: 'polar' },
      },
      {
        id: 'tx-2',
        workspace_id: 'test-workspace',
        amount: -50,
        reason: 'Mission execution',
        timestamp: new Date().toISOString(),
        metadata: { mission_id: 'mission-1' },
      },
    ].slice(0, limit);

    return HttpResponse.json(transactions);
  }),

  // Members endpoint
  http.get(`${API_BASE}/workspaces/:workspaceId/members`, () => {
    return HttpResponse.json([
      {
        email: 'owner@test.com',
        role: 'owner',
        joined_at: new Date().toISOString(),
      },
      {
        email: 'member@test.com',
        role: 'member',
        joined_at: new Date().toISOString(),
      },
    ]);
  }),

  // Add member endpoint
  http.post(`${API_BASE}/workspaces/:workspaceId/members`, async ({ request }) => {
    const body = await request.json() as { email: string; role: string };
    return HttpResponse.json({
      success: true,
      message: `Added ${body.email} as ${body.role}`,
    }, { status: 201 });
  }),

  // Remove member endpoint
  http.delete(`${API_BASE}/workspaces/:workspaceId/members/:email`, ({ params }) => {
    const { email } = params;
    return HttpResponse.json({
      success: true,
      message: `Removed ${email}`,
    });
  }),
];
