'use client'

import { useState } from 'react'

interface Workspace {
  id: string
  name: string
  tier: string
}

// Mock workspaces - will be replaced with real data from API
const MOCK_WORKSPACES: Workspace[] = [
  { id: '1', name: 'Default Workspace', tier: 'Pro' },
  { id: '2', name: 'Side Project', tier: 'Starter' },
]

export default function WorkspaceSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentWorkspace] = useState<Workspace>(MOCK_WORKSPACES[0])

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] px-3 py-2.5 text-sm font-medium text-[var(--md-on-surface)] transition-colors hover:border-[var(--md-outline)] hover:bg-[var(--md-surface-container-high)]"
        aria-label="Select workspace"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--md-primary)] text-xs font-bold text-[var(--md-on-primary)]">
            {currentWorkspace.name.charAt(0)}
          </div>
          <div className="text-left">
            <div className="truncate text-sm font-medium">{currentWorkspace.name}</div>
            <div className="text-xs text-[var(--md-on-surface-variant)]">{currentWorkspace.tier}</div>
          </div>
        </div>
        <svg
          className={`h-4 w-4 text-[var(--md-on-surface-variant)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 z-20 mt-2 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-1 shadow-lg">
            <div className="space-y-1">
              {MOCK_WORKSPACES.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => {
                    // TODO: Implement workspace switch
                    setIsOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    workspace.id === currentWorkspace.id
                      ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)]'
                      : 'text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container)] hover:text-[var(--md-on-surface)]'
                  }`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--md-outline-variant)] text-xs font-bold">
                    {workspace.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{workspace.name}</div>
                    <div className="text-xs opacity-75">{workspace.tier}</div>
                  </div>
                  {workspace.id === currentWorkspace.id && (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-1 border-t border-[var(--md-outline-variant)] pt-1">
              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--md-on-surface-variant)] transition-colors hover:bg-[var(--md-surface-container)] hover:text-[var(--md-on-surface)]">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Workspace
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
