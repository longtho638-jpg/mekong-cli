import { SERVICES } from '@/data/services'

const CATEGORY_LABELS: Record<string, string> = {
  founder: 'Founder',
  business: 'Business',
  product: 'Product',
  engineering: 'Engineering',
  marketing: 'Marketing',
}

const CATEGORY_COLORS: Record<string, string> = {
  founder: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  business: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  product: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
  engineering: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  marketing: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
}

export default function ServiceCards() {
  return (
    <section id="services" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            Super command packages
          </p>
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Pre-built{' '}
            <span className="gradient-text">workflow packages</span>
          </h2>
          <p className="text-slate-400">
            Each package runs a super command — parallel AI agents deliver results in minutes.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <div key={service.id} className="flex flex-col rounded-2xl glass-card p-6">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[service.category]}`}
                >
                  {CATEGORY_LABELS[service.category]}
                </span>
              </div>

              <h3 className="mb-1 font-semibold text-white">{service.title}</h3>
              <p className="mb-1 font-mono text-xs text-cyan-400/70">{service.superCommand}</p>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-400">
                {service.description}
              </p>

              <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                <div className="text-sm font-medium text-cyan-400">
                  {service.credits} credits
                  <span className="ml-1 text-slate-500">(~${service.priceUsd})</span>
                </div>
                <div className="text-xs text-slate-500">
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
