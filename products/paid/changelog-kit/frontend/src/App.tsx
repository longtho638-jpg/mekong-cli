import React from 'react'
import { ChangelogPage } from './components/ChangelogPage'
import { ChangelogWidget } from './components/ChangelogWidget'

function App() {
  // Simple routing for preview
  const path = window.location.pathname;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation for Preview */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex gap-4 items-center shadow-sm sticky top-0 z-10">
        <span className="font-bold text-gray-800">Changelog Kit</span>
        <div className="h-4 w-px bg-gray-300 mx-2"></div>
        <a href="/" className={`text-sm ${path === '/' ? 'text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-800'}`}>
          Home (Widget Demo)
        </a>
        <a href="/changelog" className={`text-sm ${path === '/changelog' ? 'text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-800'}`}>
          Page Demo
        </a>
      </nav>

      {/* Content */}
      {path === '/changelog' ? (
        <ChangelogPage />
      ) : (
        <div className="p-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Your SaaS</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            This is a demo landing page. Look at the bottom right corner to see the
            <strong> Changelog Widget</strong> in action.
          </p>
          <div className="mt-12 p-8 bg-white rounded-2xl shadow-sm border border-gray-100 inline-block text-left">
            <h3 className="font-semibold mb-2">Integration Features:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Responsive Widget</li>
              <li>Unread indicator</li>
              <li>Animated transitions</li>
              <li>Markdown rendering</li>
            </ul>
          </div>
        </div>
      )}

      {/* Widget is always available (unless hidden) */}
      <ChangelogWidget />
    </div>
  )
}

export default App
