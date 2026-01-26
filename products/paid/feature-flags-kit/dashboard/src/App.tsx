import React, { useEffect, useState } from 'react'
import { Flag, Activity } from 'lucide-react'

function App() {
  const [status, setStatus] = useState<string>('checking...')

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
    fetch(`${backendUrl}/health`)
      .then(res => res.json())
      .then(data => setStatus(data.status))
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-indigo-600">
          <Flag className="h-8 w-8" />
          Feature Flags Kit
        </h1>
        <p className="text-gray-500 mt-2">Manage your feature toggles and rollouts.</p>
      </header>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-sm">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">System Status</span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
            ${status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <Activity className="h-3 w-3" />
            {status}
          </span>
        </div>
      </div>
    </div>
  )
}

export default App
