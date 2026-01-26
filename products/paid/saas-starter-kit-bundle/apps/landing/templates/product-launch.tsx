import React from "react";
import { Hero } from "../components/hero-sections/hero-scroll";
import { Features } from "../components/feature-sections/features-grid";
import { CTA } from "../components/cta-sections/cta-centered";
import { Footer } from "../components/footer/footer-full";

export default function ProductLaunchPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white antialiased">
      {/* Product Launch typically focuses on the Hero (Visual) and Call to Action */}
      <Hero />

      <div className="py-12 bg-neutral-900 border-y border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-xl font-medium text-neutral-300">Used by world-class engineering teams</p>
            <div className="mt-8 flex flex-wrap justify-center gap-8 opacity-50 grayscale">
                {/* Placeholders for logos */}
                <span className="text-2xl font-bold">ACME</span>
                <span className="text-2xl font-bold">Globex</span>
                <span className="text-2xl font-bold">Soylent</span>
                <span className="text-2xl font-bold">Initech</span>
                <span className="text-2xl font-bold">Umbrella</span>
            </div>
        </div>
      </div>

      <Features />

      {/* Simple Text Content Section for Launch Details */}
      <section className="py-24 bg-black">
          <div className="max-w-3xl mx-auto px-6">
              <h2 className="text-3xl font-bold mb-6">Why we built this</h2>
              <p className="text-lg text-neutral-400 mb-6 leading-relaxed">
                  We realized that most developers spend too much time building the same landing page components over and over again.
                  We wanted to change that.
              </p>
              <p className="text-lg text-neutral-400 mb-6 leading-relaxed">
                  Our kit is designed to be dropped into any Next.js project and just work.
                  It's built with the technologies you already know and love: React, TypeScript, and Tailwind CSS.
              </p>
          </div>
      </section>

      <CTA />
      <Footer />
    </main>
  );
}
