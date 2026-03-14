export default function WaterProtocolSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-400">
            Water Protocol 水
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[var(--md-on-surface)] sm:text-4xl">
            Multi-agent collaboration —{' '}
            <span className="gradient-text">like water flowing downhill</span>
          </h2>
          <p className="mx-auto max-w-xl text-[var(--md-on-surface-variant)]">
            Agents pass context to each other. Output from one becomes input for the next.
            No repeated work. No lost context.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { icon: '🌊', title: 'Context Flow', desc: "Agent A's output flows into Agent B. Like water — always downhill, never back." },
            { icon: '🔍', title: 'Two-Stage Review', desc: 'SubagentReviewer checks spec compliance first, then quality. Nothing ships unchecked.' },
            { icon: '⚡', title: 'Smart Routing', desc: 'Simple tasks → cheap model. Complex decisions → Claude. model_selector picks automatically.' },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
              <div className="mb-3 text-2xl">{f.icon}</div>
              <h3 className="mb-2 font-semibold text-[var(--md-on-surface)]">{f.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--md-on-surface-variant)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
