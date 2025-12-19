'use client'

export function BinhPhap() {
    const principles = [
        {
            title: '不戰而屈人之兵',
            translation: 'Win without fighting',
            description: 'Strategy beats force. Leverage, not labor.',
        },
        {
            title: '知己知彼',
            translation: 'Know yourself, know the enemy',
            description: 'Data-driven decisions. Market intelligence.',
        },
        {
            title: '勢',
            translation: 'Momentum',
            description: 'Timing and positioning create unstoppable force.',
        },
    ]

    return (
        <section className="py-32 relative overflow-hidden bg-black" id="philosophy">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-transparent" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-20">
                    <h2 className="text-h1 text-white mb-6 stagger-item">
                        Built on <span className="text-gradient-gold">孫子兵法</span>
                    </h2>
                    <p className="text-body-lg text-white/60 max-w-2xl mx-auto stagger-item">
                        13 chapters of ancient wisdom, translated into modern agency operating principles.
                    </p>
                </div>

                {/* Principles Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {principles.map((principle, idx) => (
                        <div
                            key={idx}
                            className="glass-card-pro rounded-2xl p-8 text-center stagger-item"
                        >
                            <div className="text-4xl font-bold text-purple-400 mb-4 font-serif">
                                {principle.title}
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">
                                {principle.translation}
                            </h3>
                            <p className="text-white/60 text-sm">
                                {principle.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* CTA Link */}
                <div className="text-center mt-16 stagger-item">
                    <a
                        href="#"
                        className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors group"
                    >
                        <span>Read all 13 chapters</span>
                        <svg
                            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </a>
                </div>
            </div>
        </section>
    )
}
