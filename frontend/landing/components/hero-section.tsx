'use client'

import { useEffect, useState } from 'react'

const TERMINAL_LINES = [
  { prompt: '$ ', text: 'mekong cook "build auth system"', delay: 0 },
  { prompt: '  ', text: '▸ Planning 7 tasks...', delay: 800 },
  { prompt: '  ', text: '▸ [1/7] Scaffold user model ✓', delay: 1400 },
  { prompt: '  ', text: '▸ [2/7] JWT middleware ✓', delay: 1900 },
  { prompt: '  ', text: '▸ [3/7] Auth routes ✓', delay: 2400 },
  { prompt: '  ', text: '▸ [4/7] Tests (100% pass) ✓', delay: 2900 },
  { prompt: '  ', text: '✅ Verified. 4 files, 0 errors.', delay: 3500 },
]

export default function HeroSection() {
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    const timers = TERMINAL_LINES.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay + 600)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-24 text-center">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      {/* nav */}
      <nav className="relative mx-auto mb-16 flex max-w-5xl items-center justify-between rounded-2xl glass px-6 py-3">
        <span className="text-lg font-bold tracking-tight text-white">
          <span className="text-cyan-400">Agency</span>OS
        </span>
        <div className="flex items-center gap-6 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="https://github.com/agencyos/mekong-cli" className="hover:text-white transition-colors">GitHub</a>
          <a
            href="#pricing"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-500 transition-colors"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* headline */}
      <div className="relative mx-auto max-w-4xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 py-1.5 text-xs text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          v0.2.0 — Now with 80+ AI Skills
        </div>

        <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
          AGI Vibe{' '}
          <span className="gradient-text">Coding Factory</span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 sm:text-xl">
          <span className="font-mono text-cyan-400">Plan → Execute → Verify.</span>{' '}
          Autonomous code generation with quality gates. Build 10x faster with
          multi-agent orchestration powered by Binh Pháp strategy.
        </p>

        <div className="mb-14 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#pricing"
            className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3.5 font-semibold text-white shadow-lg hover:opacity-90 transition-opacity"
          >
            Get Started Free
          </a>
          <a
            href="https://github.com/agencyos/mekong-cli"
            className="rounded-xl border border-slate-700 bg-slate-900 px-8 py-3.5 font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
          >
            ★ View on GitHub
          </a>
        </div>

        {/* terminal */}
        <div className="mx-auto max-w-2xl rounded-2xl glass glow-blue overflow-hidden text-left">
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
            <span className="ml-2 text-xs text-slate-500">mekong-cli — zsh</span>
          </div>
          <div className="p-5 font-mono text-sm min-h-[180px]">
            {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
              <div
                key={i}
                className={`leading-7 ${
                  line.text.startsWith('✅')
                    ? 'text-green-400'
                    : line.text.startsWith('▸')
                    ? 'text-slate-400'
                    : 'text-cyan-300'
                }`}
              >
                <span className="text-slate-600">{line.prompt}</span>
                {line.text}
              </div>
            ))}
            {visibleLines < TERMINAL_LINES.length && (
              <span className="terminal-cursor text-cyan-400" />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
