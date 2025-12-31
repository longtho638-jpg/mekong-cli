"use client";
import Link from "next/link";
import { useState } from "react";

const plans = [
    {
        name: "Starter",
        id: "starter",
        price: { monthly: 29, yearly: 290 },
        description: "Perfect for freelancers and small agencies",
        features: [
            "3 newsletters",
            "2,500 subscribers",
            "10,000 emails/month",
            "100 AI writing credits",
            "2 team members",
            "Basic analytics",
            "Email support",
        ],
        popular: false,
    },
    {
        name: "Pro",
        id: "pro",
        price: { monthly: 99, yearly: 990 },
        description: "For growing agencies managing multiple clients",
        features: [
            "10 newsletters",
            "10,000 subscribers",
            "50,000 emails/month",
            "500 AI writing credits",
            "5 team members",
            "Advanced analytics",
            "Priority support",
            "Custom templates",
            "API access",
        ],
        popular: true,
    },
    {
        name: "Agency",
        id: "agency",
        price: { monthly: 299, yearly: 2990 },
        description: "Unlimited everything for large agencies",
        features: [
            "Unlimited newsletters",
            "Unlimited subscribers",
            "Unlimited emails",
            "Unlimited AI credits",
            "Unlimited team members",
            "White-label options",
            "Dedicated support",
            "Custom integrations",
            "SLA guarantee",
        ],
        popular: false,
    },
];

export default function PricingPage() {
    const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
    const [loading, setLoading] = useState<string | null>(null);

    const handleCheckout = async (planId: string) => {
        setLoading(planId);
        try {
            const res = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: planId, interval }),
            });
            const data = await res.json();

            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else if (data.demo) {
                alert(`Demo mode: Upgraded to ${planId}!\nIn production, you'd be redirected to Polar checkout.`);
            } else {
                alert(data.error || "Failed to create checkout");
            }
        } catch (error) {
            console.error("Checkout error:", error);
            alert("Failed to create checkout");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Header */}
            <header className="border-b border-gray-800">
                <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold gradient-text">
                        📧 Mekong Mail
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/login" className="text-gray-400 hover:text-white">
                            Login
                        </Link>
                        <Link href="/signup" className="btn-primary px-4 py-2">
                            Start Free
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero */}
            <section className="py-20 px-6 text-center">
                <h1 className="text-5xl font-bold mb-4">
                    Simple, transparent <span className="gradient-text">pricing</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                    Start free, upgrade when you grow. All plans include a 14-day free trial.
                </p>

                {/* Interval Toggle */}
                <div className="inline-flex items-center gap-4 bg-[#12121a] p-1 rounded-lg mb-12">
                    <button
                        onClick={() => setInterval("monthly")}
                        className={`px-6 py-2 rounded-md font-medium transition-all ${interval === "monthly"
                                ? "bg-indigo-500 text-white"
                                : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setInterval("yearly")}
                        className={`px-6 py-2 rounded-md font-medium transition-all ${interval === "yearly"
                                ? "bg-indigo-500 text-white"
                                : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Yearly
                        <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                            Save 17%
                        </span>
                    </button>
                </div>

                {/* Pricing Cards */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`glass rounded-2xl p-8 text-left relative ${plan.popular ? "border-2 border-indigo-500 scale-105" : ""
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-500 rounded-full text-sm font-medium">
                                    Most Popular
                                </div>
                            )}

                            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                            <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

                            <div className="mb-6">
                                <span className="text-4xl font-bold">
                                    ${plan.price[interval]}
                                </span>
                                <span className="text-gray-400">
                                    /{interval === "monthly" ? "mo" : "yr"}
                                </span>
                            </div>

                            <button
                                onClick={() => handleCheckout(plan.id)}
                                disabled={loading === plan.id}
                                className={`w-full py-3 rounded-lg font-semibold mb-8 transition-all ${plan.popular
                                        ? "btn-primary"
                                        : "bg-gray-800 hover:bg-gray-700"
                                    } disabled:opacity-50`}
                            >
                                {loading === plan.id ? "Loading..." : "Get Started"}
                            </button>

                            <ul className="space-y-3">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-gray-300">
                                        <span className="text-green-400">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 px-6 border-t border-gray-800">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                        <div className="glass rounded-xl p-6">
                            <h3 className="font-semibold mb-2">Can I change plans later?</h3>
                            <p className="text-gray-400">
                                Yes! You can upgrade or downgrade at any time. Changes take effect
                                immediately and we'll prorate your billing.
                            </p>
                        </div>
                        <div className="glass rounded-xl p-6">
                            <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                            <p className="text-gray-400">
                                We accept all major credit cards, PayPal, and bank transfers for
                                annual plans. Powered by Polar for secure payments.
                            </p>
                        </div>
                        <div className="glass rounded-xl p-6">
                            <h3 className="font-semibold mb-2">Is there a free trial?</h3>
                            <p className="text-gray-400">
                                Yes! All plans come with a 14-day free trial. No credit card
                                required to start.
                            </p>
                        </div>
                        <div className="glass rounded-xl p-6">
                            <h3 className="font-semibold mb-2">What happens if I exceed my limits?</h3>
                            <p className="text-gray-400">
                                We'll notify you when you're approaching limits. You can upgrade
                                anytime, or we'll pause sending until the next billing cycle.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-800 py-12 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="text-gray-400">
                        © 2025 Mekong Mail. Powered by{" "}
                        <a
                            href="https://polar.sh"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:underline"
                        >
                            Polar
                        </a>
                    </div>
                    <div className="flex gap-6 text-gray-400">
                        <Link href="/terms" className="hover:text-white">Terms</Link>
                        <Link href="/privacy" className="hover:text-white">Privacy</Link>
                        <Link href="/contact" className="hover:text-white">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
