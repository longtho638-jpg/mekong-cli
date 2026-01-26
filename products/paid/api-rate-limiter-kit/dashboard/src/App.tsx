import React, { useEffect, useState } from 'react'
import { Activity, Shield, AlertTriangle, ExternalLink } from 'lucide-react'
import { getHealth } from './lib/api'
import { RuleList } from './components/RuleList'

function App() {
  const [status, setStatus] = useState<{status: string, redis: string} | null>(null)

  useEffect(() => {
    getHealth()
      .then(data => setStatus(data))
      .catch(err => console.error("Failed to fetch health", err))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      <header className="mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-indigo-600">
            <Shield className="h-8 w-8" />
            API Rate Limiter Kit
            </h1>
            <p className="text-gray-500 mt-2">Real-time monitoring and configuration</p>
        </div>
        <div className="flex gap-4">
            <a
                href="http://localhost:8000/docs"
                target="_blank"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
            >
                <ExternalLink className="h-4 w-4" />
                API Docs
            </a>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Status Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">System Status</p>
              <h3 className="text-2xl font-bold mt-1">
                {status ? (
                  <span className="text-green-600 capitalize">{status.status}</span>
                ) : (
                  <span className="text-gray-400">Checking...</span>
                )}
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${status?.status === 'ok' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Redis: <span className={status?.redis === 'connected' ? 'text-green-600 font-medium' : 'text-red-500'}>
              {status?.redis || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Placeholder Stat 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 opacity-60">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Requests (24h)</p>
              <h3 className="text-2xl font-bold mt-1">--</h3>
            </div>
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Waiting for data...</p>
        </div>

        {/* Placeholder Stat 2 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 opacity-60">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Blocked Requests</p>
              <h3 className="text-2xl font-bold mt-1">--</h3>
            </div>
            <div className="bg-amber-100 text-amber-600 p-2 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Waiting for data...</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <RuleList />
      </div>
    </div>
  )
}

export default App
