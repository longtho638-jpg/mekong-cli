'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface AnalyticsData {
  period: string
  metrics: {
    issues_sent: number
    emails_sent: number
    total_opens: number
    total_clicks: number
    avg_open_rate: string
    avg_click_rate: string
    new_subscribers: number
    unsubscribed: number
    net_growth: number
  }
  issues: Array<{
    id: string
    subject: string
    sent_at: string
    recipients_count: number
    opens_count: number
    clicks_count: number
    open_rate: number
    click_rate: number
  }>
}

// Demo data
const demoAnalytics: AnalyticsData = {
  period: '30d',
  metrics: {
    issues_sent: 4,
    emails_sent: 4523,
    total_opens: 2167,
    total_clicks: 634,
    avg_open_rate: '47.9',
    avg_click_rate: '29.3',
    new_subscribers: 127,
    unsubscribed: 23,
    net_growth: 104,
  },
  issues: [
    {
      id: '1',
      subject: '🚀 AI Trends in 2025',
      sent_at: '2024-12-24',
      recipients_count: 1247,
      opens_count: 648,
      clicks_count: 225,
      open_rate: 0.52,
      click_rate: 0.18,
    },
    {
      id: '2',
      subject: 'Holiday Special Edition',
      sent_at: '2024-12-17',
      recipients_count: 1180,
      opens_count: 531,
      clicks_count: 142,
      open_rate: 0.45,
      click_rate: 0.12,
    },
    {
      id: '3',
      subject: 'Year in Review 2024',
      sent_at: '2024-12-10',
      recipients_count: 1098,
      opens_count: 527,
      clicks_count: 165,
      open_rate: 0.48,
      click_rate: 0.15,
    },
    {
      id: '4',
      subject: 'Weekly Update #47',
      sent_at: '2024-12-03',
      recipients_count: 998,
      opens_count: 461,
      clicks_count: 102,
      open_rate: 0.41,
      click_rate: 0.11,
    },
  ],
}

export default function AnalyticsPage() {
  const [data] = useState<AnalyticsData>(demoAnalytics)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    // In production, fetch from API
    // fetchAnalytics(period)
  }, [period])

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#12121a] border-r border-gray-800 p-6">
        <Link href="/dashboard" className="text-xl font-bold gradient-text block mb-10">
          📧 Mekong Mail
        </Link>

        <nav className="space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-400"
          >
            <span>📋</span> Newsletters
          </Link>
          <Link
            href="/dashboard/subscribers"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-400"
          >
            <span>👥</span> Subscribers
          </Link>
          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-500/10 text-indigo-400"
          >
            <span>📊</span> Analytics
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-400"
          >
            <span>⚙️</span> Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-gray-400 mt-1">Track your newsletter performance</p>
          </div>
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === p
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Emails Sent</div>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('en-US').format(data.metrics.emails_sent)}
            </div>
            <div className="text-green-400 text-sm mt-2">↑ {data.metrics.issues_sent} issues</div>
          </div>
          <div className="glass rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Avg Open Rate</div>
            <div className="text-3xl font-bold text-indigo-400">{data.metrics.avg_open_rate}%</div>
            <div className="text-gray-500 text-sm mt-2">Industry avg: 21%</div>
          </div>
          <div className="glass rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Avg Click Rate</div>
            <div className="text-3xl font-bold text-purple-400">{data.metrics.avg_click_rate}%</div>
            <div className="text-gray-500 text-sm mt-2">Industry avg: 2.5%</div>
          </div>
          <div className="glass rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Subscriber Growth</div>
            <div className="text-3xl font-bold text-green-400">+{data.metrics.net_growth}</div>
            <div className="text-gray-500 text-sm mt-2">
              +{data.metrics.new_subscribers} / -{data.metrics.unsubscribed}
            </div>
          </div>
        </div>

        {/* Chart placeholder */}
        <div className="glass rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Opens over time</h2>
          <div className="h-48 flex items-end justify-between gap-2 px-4">
            {[65, 42, 78, 85, 92, 56, 71, 88, 95, 67, 82, 90].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-sm transition-all hover:opacity-80"
                  style={{ height: `${h}%` }}
                />
                <span className="text-xs text-gray-500">
                  {[
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                  ][i].slice(0, 1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Issues */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold">Recent Issues</h2>
          </div>
          <table className="w-full">
            <thead className="bg-[#1a1a24]">
              <tr>
                <th className="text-left px-6 py-4 text-gray-400 font-medium">Subject</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium">Sent</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium">Recipients</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium">Opens</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium">Clicks</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium">Open Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.issues.map(issue => (
                <tr key={issue.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-6 py-4 font-medium">{issue.subject}</td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(issue.sent_at).toLocaleDateString('en-US')}
                  </td>
                  <td className="px-6 py-4">
                    {new Intl.NumberFormat('en-US').format(issue.recipients_count)}
                  </td>
                  <td className="px-6 py-4">
                    {new Intl.NumberFormat('en-US').format(issue.opens_count)}
                  </td>
                  <td className="px-6 py-4">
                    {new Intl.NumberFormat('en-US').format(issue.clicks_count)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        issue.open_rate >= 0.5
                          ? 'bg-green-500/20 text-green-400'
                          : issue.open_rate >= 0.3
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {(issue.open_rate * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
