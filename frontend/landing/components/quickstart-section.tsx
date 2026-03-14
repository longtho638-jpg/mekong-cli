'use client'

import { useState } from 'react'

const TERMINAL_LINES = [
  { text: '$ git clone https://github.com/longtho638-jpg/mekong-cli.git', color: 'text-[var(--md-on-surface-variant)]' },
  { text: '$ cd mekong-cli && pip install -e .', color: 'text-[var(--md-on-surface-variant)]' },
  { text: '$ mekong init', color: 'text-[var(--md-primary)]' },
  { text: '', color: '' },
  { text: '  🏯 Choose template: standard (4 agents, hybrid LLM)', color: 'text-[var(--md-outline)]' },
  { text: '  ✅ Workspace created: .mekong/studio/my-studio/', color: 'text-emerald-400' },
  { text: '', color: '' },
  { text: '$ mekong up', color: 'text-[var(--md-primary)]' },
  { text: '  ✅ gateway: online (port 8000)', color: 'text-emerald-400' },
  { text: '  ✅ heartbeat-scheduler: online', color: 'text-emerald-400' },
  { text: '  ✅ cto-daemon: online', color: 'text-emerald-400' },
  { text: '', color: '' },
  { text: '$ mekong studio:launch:full "AI tools"', color: 'text-violet-400' },
  { text: '  ⚡ DAG: thesis → terrain → source ×3 → screen → five-factors', color: 'text-[var(--md-tertiary)]' },
  { text: '  ✅ Done: 5 deals sourced, top 3 evaluated', color: 'text-emerald-400' },
]

const INSTALL_CMD = 'git clone https://github.com/longtho638-jpg/mekong-cli.git && cd mekong-cli && pip install -e . && mekong init'

export default function QuickstartSection() {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(INSTALL_CMD).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section id="quickstart" className="px-6 py-20">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--md-primary)]">
            Quick start
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[var(--md-on-surface)] sm:text-4xl">
            Up and running in{' '}
            <span className="gradient-text">30 seconds</span>
          </h2>
          <p className="text-[var(--md-on-surface-variant)]">
            Install, set your LLM key, run a super command. No complex configuration.
          </p>
        </div>

        {/* Terminal window */}
        <div className="overflow-hidden rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)] shadow-2xl shadow-black/40 mekong-glow">

          {/* Title bar */}
          <div className="flex items-center justify-between border-b border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 text-xs text-[var(--md-on-surface-variant)]">mekong-cli — zsh</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] px-3 py-1.5 text-xs text-[var(--md-on-surface-variant)] transition-all hover:border-[var(--md-outline)] hover:text-[var(--md-on-surface)]"
            >
              {copied ? (
                <>
                  <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                  Copy install
                </>
              )}
            </button>
          </div>

          {/* Terminal body */}
          <div className="p-5 font-mono text-sm leading-6">
            {TERMINAL_LINES.map((line, i) => (
              <div key={i} className={line.color}>
                {line.text || '\u00A0'}
              </div>
            ))}
            <span className="terminal-cursor text-[var(--md-primary)]" />
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-[var(--md-on-surface-variant)]">
          Python 3.9+ required &nbsp;&middot;&nbsp; macOS, Linux, Windows (WSL)
        </p>

      </div>
    </section>
  )
}
