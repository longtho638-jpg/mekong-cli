import Link from 'next/link'
import SiteNav from '@/components/site-nav'

const STEPS = [
  {
    num: 1,
    title: 'Prerequisites',
    desc: 'Ensure Python and Node.js are installed',
    code: `$ python --version  # Python 3.9+
$ node --version    # Node 18+ (for OpenClaw worker)`,
    copyText: null,
  },
  {
    num: 2,
    title: 'Install',
    desc: 'Install Mekong CLI via pip',
    code: `$ pip install mekong-cli
$ mekong version
→ Mekong CLI v5.0.0`,
    copyText: 'pip install mekong-cli',
  },
  {
    num: 3,
    title: 'Configure LLM Provider',
    desc: 'Set LLM_BASE_URL — works with OpenRouter, Qwen, DeepSeek, Ollama, or any provider',
    code: `$ mekong init
Select provider:
  1. OpenRouter (300+ models, $5 free)
  2. Qwen Coding Plan ($10/mo unlimited)
  3. DeepSeek (cheapest cloud)
  4. Ollama (local, free)
> 1
✓ Configured LLM provider (OpenRouter)`,
    copyText: 'mekong init',
  },
  {
    num: 4,
    title: 'First Command',
    desc: 'Run your first command with the PEV pipeline',
    code: `$ mekong cook "Create a Python calculator with tests"
📋 Planning 3 tasks...
⚡ Executing...
✅ Verified. 2 files created, 100% test pass.`,
    copyText: 'mekong cook "Create a Python calculator with tests"',
  },
  {
    num: 5,
    title: 'Explore Commands',
    desc: '319 commands available — explore the full command catalog',
    code: null,
    copyText: null,
    isLast: true,
  },
]

export default function QuickstartPage() {
  return (
    <main className="min-h-screen bg-[var(--md-surface)]">
      <SiteNav />
      <div className="px-4 pb-16 pt-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {/* Back nav */}
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)] transition-colors"
          >
            ← Home
          </Link>

          {/* Hero */}
          <div className="mb-12 text-center">
            <div className="mb-4 text-4xl">⚙️</div>
            <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
              <span className="gradient-text">Developer Quickstart</span>
            </h1>
            <p className="text-lg text-[var(--md-on-surface-variant)]">Setup in 5 minutes</p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {STEPS.map((step) => (
              <div key={step.num} className="glass-card rounded-xl p-6">
                {/* Step header */}
                <div className="mb-4 flex items-start gap-4">
                  <span className="glass-highlight flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[var(--md-primary)]">
                    {step.num}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-lg font-semibold text-[var(--md-on-surface)]">
                        {step.title}
                      </h2>
                      <span className="text-xs text-[var(--md-on-surface-variant)]">
                        {step.num}/5
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--md-on-surface-variant)]">{step.desc}</p>
                  </div>
                </div>

                {/* Terminal block */}
                {step.code && (
                  <div className="terminal-block">
                    <pre className="overflow-x-auto font-mono text-xs text-[var(--md-primary)] sm:text-sm whitespace-pre-wrap break-words">
                      {step.code}
                    </pre>
                  </div>
                )}

                {/* Copy hint */}
                {step.copyText && (
                  <p className="mt-3 text-xs text-[var(--md-on-surface-variant)]">
                    Copy:{' '}
                    <code className="rounded bg-[var(--md-surface-container)] px-2 py-0.5 text-[var(--md-primary)]">
                      {step.copyText}
                    </code>
                  </p>
                )}

                {/* CTA for last step */}
                {step.isLast && (
                  <Link
                    href="/dev/commands"
                    className="glass-highlight mt-2 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-[var(--md-primary)] transition-all hover:text-[var(--md-on-primary-container)]"
                  >
                    Explore 319 Commands →
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Footer nav */}
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link
              href="/dev/commands"
              className="glass-card rounded-lg px-5 py-2.5 text-sm text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)] transition-colors"
            >
              Command Explorer →
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
