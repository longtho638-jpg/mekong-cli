const FEATURES = [
  {
    icon: '⚙️',
    title: 'Plan-Execute-Verify Engine',
    desc: 'Every task goes through LLM-powered planning, atomic execution, and automated verification with quality gates before committing.',
  },
  {
    icon: '🧠',
    title: '80+ AI Skills',
    desc: 'Modular skill library covering frontend, backend, DevOps, testing, SEO, copywriting, and more. Auto-activated by context.',
  },
  {
    icon: '🤖',
    title: 'Multi-Agent Orchestration',
    desc: 'Spawn parallel agents — planner, developer, tester, reviewer — each owning distinct files. No conflicts, maximum velocity.',
  },
  {
    icon: '🔑',
    title: 'RaaS License Gating',
    desc: 'Engineering ROI built-in. Gate premium features with RAAS_LICENSE_KEY. Monetize your AI workflows from day one.',
  },
  {
    icon: '☁️',
    title: 'Cloudflare Edge Gateway',
    desc: 'FastAPI local gateway + Cloudflare Workers for global edge deployment. Antigravity Proxy routes all LLM calls with zero rate limits.',
  },
  {
    icon: '🔌',
    title: 'Community Plugins',
    desc: 'Extend with community skills and commands. Share, fork, and remix workflows. Open ecosystem, closed moat.',
  },
]

export default function FeaturesGrid() {
  return (
    <section id="features" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Everything you need to ship{' '}
            <span className="gradient-text">10x faster</span>
          </h2>
          <p className="text-slate-400">
            Binh Pháp strategy meets modern AI tooling. Sun Tzu would approve.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl glass-card p-6"
            >
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
