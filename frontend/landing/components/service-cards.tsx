import { SERVICES } from '@/data/services'

const CATEGORY_LABELS: Record<string, string> = {
  studio: 'Studio',
  founder: 'Founder',
  business: 'Business',
  product: 'Product',
  engineering: 'Engineering',
  marketing: 'Marketing',
}

const CATEGORY_COLORS: Record<string, string> = {
  studio: 'text-violet-400 border-violet-400/30 bg-violet-400/10',
  founder: 'text-[var(--md-tertiary)] border-[var(--md-tertiary-container)] bg-[var(--md-tertiary-container)]',
  business: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  product: 'text-[var(--md-secondary)] border-[var(--md-secondary-container)] bg-[var(--md-secondary-container)]',
  engineering: 'text-[var(--md-primary)] border-[var(--md-primary-container)] bg-[var(--md-primary-container)]',
  marketing: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
}

export default function ServiceCards() {
  return (
    <section id="services" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--md-primary)]">
            Super command packages
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[var(--md-on-surface)] sm:text-4xl">
            Pre-built{' '}
            <span className="gradient-text">workflow packages</span>
          </h2>
          <p className="text-[var(--md-on-surface-variant)]">
            Each package runs a super command — parallel AI agents deliver results in minutes.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <div key={service.id} className="flex flex-col rounded-xl glass-card p-6">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[service.category]}`}
                >
                  {CATEGORY_LABELS[service.category]}
                </span>
              </div>

              <h3 className="mb-1 font-semibold text-[var(--md-on-surface)]">{service.title}</h3>
              <p className="mb-1 font-mono text-xs text-[var(--md-primary)]">{service.superCommand}</p>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-[var(--md-on-surface-variant)]">
                {service.description}
              </p>

              <div className="flex items-center justify-between border-t border-[var(--md-outline-variant)] pt-4">
                <div className="text-sm font-medium text-[var(--md-primary)]">
                  {service.credits} credits
                  <span className="ml-1 text-[var(--md-on-surface-variant)]">(~${service.priceUsd})</span>
                </div>
                <div className="text-xs text-[var(--md-on-surface-variant)]">
                  ~{service.durationMin} min
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
