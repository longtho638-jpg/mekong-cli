'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function CheckoutForm() {
    const searchParams = useSearchParams();
    const tier = searchParams.get('tier') || 'pro';

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const prices = {
        pro: { amount: 497, name: 'Pro Agency' },
        enterprise: { amount: 2997, name: 'Enterprise Franchise' }
    };

    const selectedPrice = prices[tier as keyof typeof prices] || prices.pro;

    const handleCheckout = async () => {
        setLoading(true);

        try {
            const response = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier, email }),
            });

            const { checkoutUrl, error } = await response.json();

            if (error) {
                alert(`Error: ${error}`);
                return;
            }

            // Redirect to Polar checkout
            window.location.href = checkoutUrl;
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{selectedPrice.name}</h2>
                <div className="text-4xl font-bold text-emerald-400">
                    ${selectedPrice.amount}
                </div>
                <p className="text-slate-400 mt-2">Thanh toán 1 lần, sở hữu trọn đời</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:border-emerald-500 focus:outline-none"
                        placeholder="your@email.com"
                    />
                </div>

                <button
                    onClick={handleCheckout}
                    disabled={!email || loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 px-6 py-4 rounded-lg font-bold text-lg transition"
                >
                    {loading ? 'Đang xử lý...' : `Thanh Toán $${selectedPrice.amount}`}
                </button>
            </div>

            <p className="text-sm text-slate-400 mt-6 text-center">
                🔒 Thanh toán an toàn qua Stripe (Coming Soon)
            </p>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20">
            <div className="container mx-auto px-6 max-w-2xl">
                <h1 className="text-4xl font-bold mb-8 text-center">
                    Thanh Toán
                </h1>

                <Suspense fallback={<div className="text-center">Loading...</div>}>
                    <CheckoutForm />
                </Suspense>

                <div className="mt-8 text-center">
                    <a href="/" className="text-emerald-400 hover:underline">
                        ← Quay lại trang chủ
                    </a>
                </div>
            </div>
        </div>
    );
}
