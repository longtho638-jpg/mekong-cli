'use client'

import Link from 'next/link'

export function CTA() {
    return (
        <section className="py-32 relative overflow-hidden bg-black">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-transparent" />
            <div className="absolute inset-0 bg-noise opacity-20" />

            <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                {/* Headline */}
                <h2 className="text-h1 text-white mb-6">
                    Ready to <span className="text-gradient-gold">Deploy</span>?
                </h2>
                <p className="text-body-lg text-white/60 mb-12 max-w-2xl mx-auto">
                    Join 1,000+ agencies running on Agency OS.
                    <br />
                    15-minute setup. No credit card required.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/auth/signup"
                        className="px-8 py-4 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 transition-all duration-300 magnetic-hover text-lg shadow-lg shadow-white/20"
                    >
                        Start Free Trial
                    </Link>
                    <Link
                        href="#demo"
                        className="px-8 py-4 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-all duration-300 text-lg"
                    >
                        Schedule Demo
                    </Link>
                </div>

                {/* Trust Indicators */}
                <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/40 text-sm">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>No credit card</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>15-min setup</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Cancel anytime</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
