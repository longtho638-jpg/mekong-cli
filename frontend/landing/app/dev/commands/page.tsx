'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import SiteNav from '@/components/site-nav'
import { COMMANDS } from '@/data/commands'
import { LAYERS } from '@/data/layers'

const CREDIT_DOTS: Record<number, string> = {
  0: 'Free',
  1: '●',
  2: '●●',
  3: '●●●',
  4: '●●●●',
  5: '●●●●●',
}

const COMPLEXITY_COLOR: Record<string, string> = {
  trivial: 'text-[var(--md-on-surface-variant)] bg-[var(--md-surface-container)]',
  simple: 'text-emerald-400 bg-emerald-900/30',
  standard: 'text-blue-400 bg-blue-900/30',
  complex: 'text-[var(--md-secondary)] bg-[var(--md-secondary-container)]',
}

const LAYER_COLOR: Record<string, string> = {
  founder: 'text-[var(--md-tertiary)]',
  business: 'text-blue-400',
  product: 'text-[var(--md-secondary)]',
  engineering: 'text-[var(--md-primary)]',
  ops: 'text-orange-400',
}

const ALL_TAB = { id: 'all', icon: '⊞', role: 'All' }

export default function CommandsPage() {
  const [search, setSearch] = useState('')
  const [activeLayer, setActiveLayer] = useState('all')

  const tabs = [ALL_TAB, ...LAYERS.map((l) => ({ id: l.id, icon: l.icon, role: l.role }))]

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return COMMANDS.filter((cmd) => {
      const matchLayer = activeLayer === 'all' || cmd.layer === activeLayer
      const matchSearch =
        !q ||
        cmd.id.toLowerCase().includes(q) ||
        cmd.displayName.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q)
      return matchLayer && matchSearch
    })
  }, [search, activeLayer])

  return (
    <main className="min-h-screen bg-[var(--md-surface)]">
      <SiteNav />
      <div className="px-4 pb-16 pt-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {/* Back nav */}
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)] transition-colors"
          >
            ← Home
          </Link>

          {/* Hero */}
          <div className="mb-10 text-center">
            <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
              <span className="gradient-text">Command Explorer</span>
            </h1>
            <p className="text-[var(--md-on-surface-variant)]">
              {COMMANDS.length} commands — search by name, description, or layer
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search commands... (cook, deploy, fundraise...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass rounded-xl px-5 py-3 text-sm text-[var(--md-on-surface)] placeholder-[var(--md-on-surface-variant)] outline-none focus:border-[var(--md-primary-container)] border border-transparent transition-colors bg-[var(--md-surface-container-low)]"
            />
          </div>

          {/* Layer tabs */}
          <div className="mb-8 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveLayer(tab.id)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition-all ${
                  activeLayer === tab.id
                    ? 'glass-highlight text-[var(--md-primary)] font-semibold'
                    : 'glass-card text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.role.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Count */}
          <p className="mb-4 text-xs text-[var(--md-on-surface-variant)]">
            Showing {filtered.length} / {COMMANDS.length} commands
          </p>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="glass-card rounded-xl p-10 text-center text-[var(--md-on-surface-variant)]">
              No matching commands found — try a different keyword
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((cmd) => (
                <div key={cmd.id} className="glass-card rounded-xl p-4">
                  {/* Name + layer */}
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-[var(--md-on-surface)]">
                      {cmd.id}
                    </span>
                    <span
                      className={`shrink-0 text-xs font-medium ${LAYER_COLOR[cmd.layer] ?? 'text-[var(--md-on-surface-variant)]'}`}
                    >
                      {LAYERS.find((l) => l.id === cmd.layer)?.icon ?? ''}{' '}
                      {cmd.layer}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mb-3 text-xs text-[var(--md-on-surface-variant)] leading-relaxed">
                    {cmd.description}
                  </p>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${COMPLEXITY_COLOR[cmd.complexity] ?? 'text-[var(--md-on-surface-variant)] bg-[var(--md-surface-container)]'}`}
                    >
                      {cmd.complexity}
                    </span>
                    <span className="text-xs text-[var(--md-on-surface-variant)]">
                      {cmd.creditCost === 0 ? (
                        <span className="text-emerald-400">Free</span>
                      ) : (
                        <span className="text-[var(--md-tertiary)] tracking-widest">
                          {CREDIT_DOTS[cmd.creditCost] ?? cmd.creditCost}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer nav */}
          <div className="mt-12 flex flex-wrap gap-4 justify-center">
            <Link
              href="/dev/quickstart"
              className="glass-card rounded-lg px-5 py-2.5 text-sm text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)] transition-colors"
            >
              ← Quickstart
            </Link>
            <Link
              href="/dev/architecture"
              className="glass-card rounded-lg px-5 py-2.5 text-sm text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)] transition-colors"
            >
              Architecture →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
