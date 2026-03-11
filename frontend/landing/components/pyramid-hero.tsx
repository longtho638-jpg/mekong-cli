'use client'

const LAYERS = [
  {
    id: 'founder',
    href: '/founder',
    icon: '👑',
    role: 'FOUNDER',
    desc: '46 commands · 6 super workflows — fundraise, validate, launch, negotiate, IPO',
    width: 'max-w-xs',
    border: 'border-yellow-500/30 hover:border-yellow-400/50',
    glow: 'hover:shadow-yellow-500/10',
    badge: 'text-yellow-400 bg-yellow-400/10',
  },
  {
    id: 'business',
    href: '/business',
    icon: '🏢',
    role: 'BUSINESS',
    desc: '32 commands · 6 super workflows — revenue engine, campaigns, hiring, financial close',
    width: 'max-w-sm',
    border: 'border-blue-500/30 hover:border-blue-400/50',
    glow: 'hover:shadow-blue-500/10',
    badge: 'text-blue-400 bg-blue-400/10',
  },
  {
    id: 'product',
    href: '/product',
    icon: '📦',
    role: 'PRODUCT',
    desc: '17 commands · 5 super workflows — discovery, sprint planning, feature launch',
    width: 'max-w-md',
    border: 'border-purple-500/30 hover:border-purple-400/50',
    glow: 'hover:shadow-purple-500/10',
    badge: 'text-purple-400 bg-purple-400/10',
  },
  {
    id: 'engineering',
    href: '/engineering',
    icon: '⚙️',
    role: 'ENGINEERING',
    desc: '47 commands · 4 super workflows — ship, refactor, incident response, new service',
    width: 'max-w-lg',
    border: 'border-cyan-500/30 hover:border-cyan-400/50',
    glow: 'hover:shadow-cyan-500/10',
    badge: 'text-cyan-400 bg-cyan-400/10',
  },
  {
    id: 'operations',
    href: '/ops',
    icon: '🔧',
    role: 'OPERATIONS',
    desc: '27 commands · 4 super workflows — health sweep, security audit, deployment',
    width: 'max-w-2xl',
    border: 'border-emerald-500/30 hover:border-emerald-400/50',
    glow: 'hover:shadow-emerald-500/10',
    badge: 'text-emerald-400 bg-emerald-400/10',
  },
]

export default function PyramidHero() {
  return (
    <section className="relative overflow-hidden px-6 py-20 text-center">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/4 blur-3xl" />
        <div className="absolute left-1/4 top-1/3 h-[300px] w-[300px] rounded-full bg-cyan-600/4 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">

        {/* Badge */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1.5 text-xs text-slate-400 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
          5-Layer Pyramid — Founder to Operations
        </div>

        {/* Headline */}
        <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl pyramid-fade-in">
          Run your business with AI —{' '}
          <span className="gradient-text">from strategy to code</span>
        </h1>

        {/* Stats row */}
        <p className="mx-auto mb-14 max-w-2xl text-base text-slate-400 sm:text-lg pyramid-fade-in">
          <span className="font-mono font-semibold text-cyan-400">319 commands.</span>{' '}
          <span className="font-mono font-semibold text-indigo-400">463 skills.</span>{' '}
          <span className="font-mono font-semibold text-purple-400">127 AI agents.</span>{' '}
          One unified system.
        </p>

        {/* Pyramid layers */}
        <div className="flex flex-col items-center gap-2.5">
          {LAYERS.map((layer, i) => (
            <a
              key={layer.id}
              href={layer.href}
              className={[
                'group w-full rounded-2xl border bg-slate-900/40 p-4 backdrop-blur-sm',
                'transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-900/60 hover:shadow-lg',
                layer.width,
                layer.border,
                layer.glow,
                'pyramid-layer-anim',
              ].join(' ')}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{layer.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-bold tracking-widest text-white">
                      {layer.role}
                    </div>
                    <div className="text-xs text-slate-400">{layer.desc}</div>
                  </div>
                </div>
                <svg
                  className="h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#quickstart"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-3.5 font-semibold text-white shadow-xl shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-105"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Get started free
          </a>
          <a
            href="https://github.com/longtho638-jpg/mekong-cli"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-8 py-3.5 font-semibold text-slate-300 transition-all hover:border-slate-500 hover:text-white"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            Star on GitHub
          </a>
        </div>
      </div>

      <style>{`
        @keyframes pyramidFadeIn {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pyramid-fade-in {
          animation: pyramidFadeIn 0.7s ease both;
        }
        .pyramid-layer-anim {
          opacity: 0;
          animation: pyramidFadeIn 0.5s ease both;
        }
      `}</style>
    </section>
  )
}
