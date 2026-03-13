import SiteNav from '@/components/site-nav'
import { STATS } from '@/data/stats'

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      {/* Background radial glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-blue-600/8 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-[400px] w-[600px] -translate-y-1/2 rounded-full bg-indigo-600/6 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-[300px] w-[400px] rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <SiteNav />

      <section className="relative px-6 pb-20 pt-12 text-center">
        <div className="mx-auto max-w-4xl">

          {/* Badge */}
          <div className="mb-6 inline-flex animate-fade-in-down items-center gap-2 rounded-full border border-[var(--md-primary-container)] bg-[var(--md-primary-container)] px-4 py-1.5 text-xs font-medium text-[var(--md-primary)] shadow-lg backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--md-primary)]" />
            Mekong CLI v6.0 &nbsp;&middot;&nbsp; {STATS.recipes} DAG Recipes &nbsp;&middot;&nbsp; 百川入海 (Water Protocol)
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-[var(--md-on-surface)] sm:text-6xl lg:text-7xl">
            <span className="gradient-text">Run your entire company</span>
            <br />
            <span className="text-[var(--md-on-surface)]">from the terminal</span>
          </h1>

          {/* Sub-headline */}
          <p className="animate-fade-in-up delay-100 mx-auto mb-4 max-w-2xl text-lg leading-relaxed text-[var(--md-on-surface-variant)] sm:text-xl">
            <span className="font-mono text-[var(--md-primary)]">{STATS.commands} commands</span> &middot;{' '}
            <span className="font-mono text-indigo-300">{STATS.superCommands} super workflows</span> &middot;{' '}
            <span className="font-mono text-[var(--md-secondary)]">{STATS.roles} roles</span> &middot;{' '}
            <span className="font-mono text-emerald-300">{STATS.layers} business layers</span>{' '}
            <span className="font-mono text-violet-300">+ Studio Platform</span>.
            Open source.
          </p>

          {/* Social proof line */}
          <p className="animate-fade-in-up delay-200 mb-10 text-sm text-[var(--md-on-surface-variant)]">
            Universal LLM &nbsp;&middot;&nbsp; {STATS.agents} AI agents &nbsp;&middot;&nbsp; {STATS.skills} skills &nbsp;&middot;&nbsp; {STATS.hubs} domain hubs
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up delay-300 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#quickstart"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-3.5 font-semibold text-white shadow-xl shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-105"
            >
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get started free
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--md-outline)] bg-[var(--md-surface-container-low)] px-8 py-3.5 font-semibold text-[var(--md-on-surface-variant)] backdrop-blur-sm transition-all hover:border-[var(--md-outline-variant)] hover:text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container)]"
            >
              View pricing
            </a>
            <a
              href="https://github.com/longtho638-jpg/mekong-cli"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--md-outline)] bg-[var(--md-surface-container-low)] px-8 py-3.5 font-semibold text-[var(--md-on-surface-variant)] backdrop-blur-sm transition-all hover:border-[var(--md-outline-variant)] hover:text-[var(--md-on-surface)]"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              Star on GitHub
            </a>
          </div>

        </div>
      </section>
    </div>
  )
}
