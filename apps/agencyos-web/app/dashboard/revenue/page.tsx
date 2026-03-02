import { getRevenueData } from '@/lib/fetch-dashboard-data'

const STATUS_STYLES: Record<string, string> = {
  Completed: 'bg-green-500/10 text-green-400 border border-green-500/20',
  Failed:    'bg-red-500/10 text-red-400 border border-red-500/20',
}

export default async function RevenuePage() {
  const { totalRevenue, mrr, activeSubscriptions, transactions } = await getRevenueData()

  const stats = [
    { label: 'Total Revenue (est.)', value: `${totalRevenue.toLocaleString()} MCU` },
    { label: 'MRR (est.)',           value: `${mrr.toLocaleString()} MCU` },
    { label: 'Active Projects',      value: String(activeSubscriptions) },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Revenue</h1>
        <p className="mt-1 text-sm text-zinc-500">MCU-based mission cost estimates from real execution history.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Transactions table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-200">Recent Missions</h2>
        </div>
        {transactions.length === 0 ? (
          <p className="px-5 py-6 text-sm text-zinc-600">No mission history available.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-500 uppercase tracking-wide border-b border-zinc-800">
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Project</th>
                <th className="px-5 py-3 text-left">MCU Used</th>
                <th className="px-5 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3 text-zinc-400">{tx.date}</td>
                  <td className="px-5 py-3 text-zinc-200">{tx.product}</td>
                  <td className="px-5 py-3 text-zinc-200 font-medium">{tx.amount}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[tx.status] ?? 'bg-zinc-700 text-zinc-400'}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
