const STEPS = [
  {
    number: '01',
    title: 'Choose a workflow',
    desc: '101 super commands for 32 roles. Pick your role, pick your task.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
      </svg>
    ),
    color: 'from-blue-500 to-blue-600',
    glow: 'shadow-blue-500/30',
    accent: 'border-blue-500/30 bg-blue-500/5',
  },
  {
    number: '02',
    title: 'DAG executes',
    desc: 'Recipe splits into parallel groups. Multiple AI agents work simultaneously.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    color: 'from-purple-500 to-purple-600',
    glow: 'shadow-purple-500/30',
    accent: 'border-purple-500/30 bg-purple-500/5',
  },
  {
    number: '03',
    title: 'Auto-verify',
    desc: 'Each step verified. Failed? Auto-retry with self-healing.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
    color: 'from-cyan-500 to-cyan-600',
    glow: 'shadow-cyan-500/30',
    accent: 'border-cyan-500/30 bg-cyan-500/5',
  },
  {
    number: '04',
    title: 'Compiled output',
    desc: 'All agent outputs merged into one deliverable report.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'from-emerald-500 to-emerald-600',
    glow: 'shadow-emerald-500/30',
    accent: 'border-emerald-500/30 bg-emerald-500/5',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            DAG recipe flow
          </p>
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            From command to delivery in{' '}
            <span className="gradient-text">4 steps</span>
          </h2>
          <p className="text-slate-400">
            Pick a super command — the DAG engine handles the rest.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              className={`relative rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${step.accent}`}
            >
              {/* Step number + connector */}
              <div className="mb-5 flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} shadow-lg ${step.glow} text-white`}>
                  {step.icon}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent lg:block" />
                )}
              </div>

              {/* Step label */}
              <div className="mb-1.5 font-mono text-xs font-semibold tracking-widest text-slate-500">
                STEP {step.number}
              </div>

              <h3 className="mb-2 font-semibold text-white">{step.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom callout */}
        <div className="mt-10 rounded-xl border border-slate-800/60 bg-slate-900/40 px-6 py-4 text-center">
          <p className="text-sm text-slate-400">
            <span className="font-mono text-cyan-400">Plan → Execute → Verify</span>
            {' '}— every task is auditable. Full logs, no black boxes.
          </p>
        </div>

      </div>
    </section>
  )
}
