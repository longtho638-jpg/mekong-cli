'use client'

export function Testimonials() {
    const testimonials = [
        {
            name: 'Sarah Chen',
            role: 'Founder',
            company: 'PixelPerfect Studio',
            avatar: '👩‍💼',
            quote: 'We went from 3 clients to 15 in 4 months. The CLI alone saves us 10 hours a week.',
        },
        {
            name: 'Marcus Rodriguez',
            role: 'CEO',
            company: 'GrowthLabs',
            avatar: '👨‍💼',
            quote: 'The Binh Pháp strategy framework helped us win a $500K contract. Game changer.',
        },
        {
            name: 'Linh Nguyen',
            role: 'Managing Director',
            company: 'Mekong Digital',
            avatar: '👩‍💻',
            quote: 'Finally, an OS that understands both Silicon Valley and Southeast Asia markets.',
        },
    ]

    return (
        <section className="py-32 relative overflow-hidden bg-black">
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-h2 text-white mb-4">
                        Built by Agencies, for Agencies
                    </h2>
                    <p className="text-white/60 text-body">
                        Trusted by boutique studios and growth agencies worldwide
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, idx) => (
                        <div
                            key={idx}
                            className="glass-card-pro rounded-2xl p-6 stagger-item"
                        >
                            {/* Avatar */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <div className="font-semibold text-white">{testimonial.name}</div>
                                    <div className="text-sm text-white/60">
                                        {testimonial.role}, {testimonial.company}
                                    </div>
                                </div>
                            </div>

                            {/* Quote */}
                            <p className="text-white/80 text-sm leading-relaxed">
                                "{testimonial.quote}"
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
