import { TESTIMONIALS } from '@/data/testimonials'
import { STATS } from '@/data/stats'

export default function SocialProof() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--md-primary)]">
            Trusted by builders
          </p>
          <h2 className="text-3xl font-bold text-[var(--md-on-surface)] sm:text-4xl">
            <span className="gradient-text">{STATS.commands}+ commands</span>{' '}
            powering solo founders &amp; teams
          </h2>
        </div>

        {/* Testimonial cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="group relative flex flex-col rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6 transition-all duration-300 hover:border-[var(--md-outline)] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
            >
              {/* Quote mark */}
              <div className="mb-3 text-3xl font-serif leading-none text-[var(--md-outline)] select-none">&ldquo;</div>

              <p className="mb-5 flex-1 text-sm leading-relaxed text-[var(--md-on-surface)]">
                {t.quote}
              </p>

              {/* Divider */}
              <div className="mb-4 h-px bg-[var(--md-outline-variant)]" />

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 text-xs font-bold text-white shadow-md">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--md-on-surface)]">{t.name}</p>
                  <p className="text-xs text-[var(--md-on-surface-variant)]">
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>

              {/* Hover accent */}
              <div className="absolute inset-x-0 bottom-0 h-px rounded-b-xl bg-gradient-to-r from-transparent via-[var(--md-primary)]/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
