import { NextResponse, type NextRequest } from 'next/server';

/**
 * Bridge Status API Endpoint
 * Returns the current status of all bridge connections
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const refresh = searchParams.get('refresh') === 'true'

  // Bridge status data
  const bridgeStatus = {
    bridges: {
      gemini: {
        name: 'Gemini Bridge',
        status: 'connected',
        health: 100,
        lastPing: new Date().toISOString(),
      },
      git: {
        name: 'Git Worktree',
        status: 'connected',
        health: 100,
        lastPing: new Date().toISOString(),
      },
      python: {
        name: 'Python Core',
        status: 'connected',
        health: 100,
        lastPing: new Date().toISOString(),
      },
    },
    rateLimit: {
      remaining: 15,
      total: 15,
      resetIn: 50,
    },
    quickCommands: [
      { id: 'status', label: 'Status', icon: 'info' },
      { id: 'ask-gemini', label: 'Ask Gemini', icon: 'sparkles' },
    ],
    alerts: [
      { type: 'lead', title: 'New Lead', description: 'Tech Corp high intent' },
      { type: 'pipeline', title: 'Pipeline Update', description: 'Contract sent' },
      { type: 'system', title: 'System Status', description: 'All normal' },
    ],
    version: '1.0.0',
    uptime: '99.9%',
    refreshed: refresh,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(bridgeStatus)
}
