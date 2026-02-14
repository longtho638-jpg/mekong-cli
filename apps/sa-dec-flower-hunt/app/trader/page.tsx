'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    ShoppingCart,
    Truck,
    ArrowRight,
    Package,
    Phone,
    MapPin
} from 'lucide-react';

// Types for market opportunities
interface MarketOpportunity {
    id: string;
    name: string;
    supply: string;
    quality: string;
    price: number;
    original_price?: number;
    expires_in?: string;
    badge: 'HIGH YIELD' | 'FLASH SALE' | 'PRE-ORDER';
    color: 'emerald' | 'rose' | 'blue';
}

// Pre-order items type
interface PreOrderItem {
    id: string;
    name: string;
    harvest_date: string;
    min_qty: number;
    price: number;
}

export default function TraderPortal() {
    const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
    const [preOrders, setPreOrders] = useState<PreOrderItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch products and set up realtime subscription
    useEffect(() => {
        const fetchProducts = async () => {
            if (!supabase) {
                setIsLoading(false);
                return;
            }

            try {
                // Fetch products for market opportunities
                const { data: products, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (!error && products) {
                    // Transform products to opportunities format
                    const ops: MarketOpportunity[] = products.slice(0, 4).map((p: any, idx: number) => ({
                        id: p.id,
                        name: p.name || 'Hoa Sa Đéc',
                        supply: p.stock > 100 ? 'High' : p.stock > 50 ? 'Medium' : 'Low',
                        quality: 'A+',
                        price: p.price || 150000,
                        badge: idx === 0 ? 'HIGH YIELD' : idx === 1 ? 'FLASH SALE' : 'PRE-ORDER',
                        color: idx === 0 ? 'emerald' : idx === 1 ? 'rose' : 'blue'
                    }));
                    setOpportunities(ops);
                }

                // Set up realtime subscription
                const channel = supabase
                    .channel('trader_products')
                    .on('postgres_changes',
                        { event: '*', schema: 'public', table: 'products' },
                        () => fetchProducts()
                    )
                    .subscribe();

                return () => {
                    supabase?.removeChannel(channel);
                };
            } catch (err) {
                console.error('Trader fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                        Agrios Trader Portal
                    </h1>
                    <p className="text-sm text-slate-500">B2B Procurement System • Powered by Yield Predictor AI</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                        Live Market Status: 🟢 ACTIVE
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Yield Predictor: Market Opportunities */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-amber-500" />
                                Market Opportunities (Yield Predictor)
                            </h2>
                            <span className="text-xs text-slate-400">Updated: Just now</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Opportunity Card 1 */}
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                                <div className="absolute top-0 right-0 p-2 bg-emerald-500 text-slate-900 text-xs font-bold rounded-bl-xl">
                                    HIGH YIELD
                                </div>
                                <h3 className="font-bold text-lg text-white">Cúc Mâm Xôi (Vàng)</h3>
                                <div className="mt-2 flex items-center gap-4 text-sm">
                                    <span className="text-slate-400">Supply: <span className="text-white">High</span></span>
                                    <span className="text-slate-400">Quality: <span className="text-white">A+</span></span>
                                </div>
                                <div className="mt-4 flex items-end justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500">Market Price</p>
                                        <p className="text-xl font-bold text-emerald-400">₫150,000<span className="text-xs text-slate-500">/pair</span></p>
                                    </div>
                                    <button className="px-4 py-2 rounded-lg bg-emerald-500 text-emerald-950 font-bold text-sm hover:bg-emerald-400 transition-colors">
                                        Bulk Buy
                                    </button>
                                </div>
                            </div>

                            {/* Opportunity Card 2 */}
                            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 relative overflow-hidden group hover:border-rose-500/40 transition-all">
                                <div className="absolute top-0 right-0 p-2 bg-rose-500 text-white text-xs font-bold rounded-bl-xl flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> FLASH SALE
                                </div>
                                <h3 className="font-bold text-lg text-white">Hồng Tường Vi</h3>
                                <div className="mt-2 flex items-center gap-4 text-sm">
                                    <span className="text-slate-400">Supply: <span className="text-white">Excess</span></span>
                                    <span className="text-slate-400">Expires: <span className="text-rose-400">2 Days</span></span>
                                </div>
                                <div className="mt-4 flex items-end justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 decoration-line-through">₫120,000</p>
                                        <p className="text-xl font-bold text-rose-400">₫85,000<span className="text-xs text-slate-500">/pair</span></p>
                                    </div>
                                    <button className="px-4 py-2 rounded-lg bg-rose-500 text-white font-bold text-sm hover:bg-rose-400 transition-colors">
                                        Rescue Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pre-Order Section */}
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Package className="h-5 w-5 text-blue-500" />
                            Pre-Order for Tet 2026
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-400">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-800/50">
                                    <tr>
                                        <th className="px-4 py-3">Product</th>
                                        <th className="px-4 py-3">Harvest Date</th>
                                        <th className="px-4 py-3">Min Qty</th>
                                        <th className="px-4 py-3">Pre-order Price</th>
                                        <th className="px-4 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-800 hover:bg-slate-800/30">
                                        <td className="px-4 py-3 font-medium text-white">Mai Vàng Bình Lợi</td>
                                        <td className="px-4 py-3">25/01/2026</td>
                                        <td className="px-4 py-3">10</td>
                                        <td className="px-4 py-3 text-emerald-400">₫1,200,000</td>
                                        <td className="px-4 py-3">
                                            <button className="text-blue-400 hover:text-blue-300">Reserve</button>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-800 hover:bg-slate-800/30">
                                        <td className="px-4 py-3 font-medium text-white">Vạn Thọ Pháp</td>
                                        <td className="px-4 py-3">20/01/2026</td>
                                        <td className="px-4 py-3">100</td>
                                        <td className="px-4 py-3 text-emerald-400">₫25,000</td>
                                        <td className="px-4 py-3">
                                            <button className="text-blue-400 hover:text-blue-300">Reserve</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 2. Procurement Dashboard */}
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/20">
                        <h2 className="text-lg font-bold text-white mb-4">Your Procurement</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                        <Truck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Order #TR-2401</p>
                                        <p className="text-xs text-slate-500">In Transit • 500 items</p>
                                    </div>
                                </div>
                                <span className="text-amber-400 text-xs font-bold">Arriving 2pm</span>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                        <ShoppingCart className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Cart</p>
                                        <p className="text-xs text-slate-500">12 items saved</p>
                                    </div>
                                </div>
                                <button className="p-1 hover:bg-white/10 rounded"><ArrowRight className="h-4 w-4 text-slate-400" /></button>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/10">
                            <h3 className="text-sm font-bold text-slate-400 mb-3">Quick Logistics Quote</h3>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-slate-950 rounded-lg p-2 border border-slate-700 text-sm flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-slate-500" />
                                        <span className="text-slate-400">Sa Dec</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-600 self-center" />
                                    <div className="flex-1 bg-slate-950 rounded-lg p-2 border border-slate-700 text-sm flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-slate-500" />
                                        <span className="text-white">HCMC</span>
                                    </div>
                                </div>
                                <button className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors">
                                    Get Quote
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                        <h2 className="text-lg font-bold text-white mb-4">Garden Network (Garden OS)</h2>
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg cursor-pointer">
                                    <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
                                        <span className="text-xs font-bold text-slate-400">VF{i}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white">Vườn Hoa {i == 1 ? 'Út Mười' : i == 2 ? 'Hoàng Lan' : 'Bình Minh'}</p>
                                        <p className="text-xs text-emerald-400">Verified Partner</p>
                                    </div>
                                    <Phone className="h-4 w-4 text-slate-500 hover:text-white" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
