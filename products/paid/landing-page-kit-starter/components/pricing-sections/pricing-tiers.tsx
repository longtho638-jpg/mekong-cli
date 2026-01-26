"use client";
import React from "react";
import Link from "next/link";

export function Pricing() {
  return (
    <section className="py-24 bg-neutral-950 border-y border-neutral-800" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-4 text-white">
          Simple, Transparent Pricing
        </h2>
        <p className="text-center text-neutral-400 mb-12 max-w-2xl mx-auto">
          Choose the plan that fits your needs. No hidden fees.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter */}
          <div className="p-8 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col">
            <h3 className="text-xl font-semibold mb-2 text-white">Starter</h3>
            <div className="text-4xl font-bold mb-4 text-white">
              $0<span className="text-base font-normal text-neutral-400">/mo</span>
            </div>
            <p className="text-sm text-neutral-400 mb-8">Perfect for hobby projects.</p>
            <ul className="space-y-4 text-sm text-neutral-300 mb-8 flex-1">
              {[
                "1 Project",
                "Community Support",
                "Basic Analytics",
                "Limited API Access"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>
             <Link href="#" className="w-full py-3 rounded-lg border border-neutral-700 text-white font-medium hover:bg-neutral-800 transition-colors text-center">
              Get Started
            </Link>
          </div>

          {/* Pro */}
          <div className="p-8 rounded-2xl bg-neutral-900 border-2 border-purple-500 relative flex flex-col">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 text-white text-xs font-bold rounded-full uppercase tracking-wide">
              Most Popular
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Pro</h3>
            <div className="text-4xl font-bold mb-4 text-white">
              $29<span className="text-base font-normal text-neutral-400">/mo</span>
            </div>
            <p className="text-sm text-neutral-400 mb-8">For growing businesses.</p>
            <ul className="space-y-4 text-sm text-neutral-300 mb-8 flex-1">
              {[
                "Unlimited Projects",
                "Priority Support",
                "Advanced Analytics",
                "Full API Access",
                "Custom Domain"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>
             <Link href="#" className="w-full py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors text-center shadow-lg shadow-purple-900/20">
              Get Started
            </Link>
          </div>

          {/* Enterprise */}
          <div className="p-8 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col">
            <h3 className="text-xl font-semibold mb-2 text-white">Enterprise</h3>
            <div className="text-4xl font-bold mb-4 text-white">
              Custom
            </div>
            <p className="text-sm text-neutral-400 mb-8">For large teams and organizations.</p>
            <ul className="space-y-4 text-sm text-neutral-300 mb-8 flex-1">
              {[
                "Everything in Pro",
                "Dedicated Account Manager",
                "SSO & SAML",
                "SLA Guarantee",
                "Custom Integrations"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href="#" className="w-full py-3 rounded-lg border border-neutral-700 text-white font-medium hover:bg-neutral-800 transition-colors text-center">
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const CheckIcon = () => (
  <svg
    className="w-5 h-5 text-green-500 flex-shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);
