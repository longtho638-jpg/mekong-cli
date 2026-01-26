"use client";

import Link from "next/link";

export function CTA() {
  return (
    <section className="py-32 relative overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-transparent" />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('data:image/svg+xml,...')" }} />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        {/* Headline */}
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Ready to <span className="text-purple-500">Launch</span>?
        </h2>
        <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
          Join 1,000+ founders building on our platform.
          <br />
          Ship your landing page today.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="#"
            className="px-8 py-4 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg shadow-white/20"
          >
            Get Started Now
          </Link>
          <Link
            href="#"
            className="px-8 py-4 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-all duration-300"
          >
            View Demo
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/40 text-sm">
          <div className="flex items-center gap-2">
            <CheckIcon />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);
