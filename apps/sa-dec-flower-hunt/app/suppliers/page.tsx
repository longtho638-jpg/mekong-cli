'use client';

import React from 'react';
import {
    Package,
    Leaf,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    Clock,
    AlertCircle,
    Truck,
    Star,
    Phone,
    MapPin
} from 'lucide-react';

export default function SuppliersPortal() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                        Agrios Supplier Network
                    </h1>
                    <p className="text-sm text-slate-500">Input Layer • Seeds, Fertilizers, Equipment</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                        🌱 Supply Chain: HEALTHY
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Supplier Categories */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Package className="h-5 w-5 text-emerald-500" />
                            Supplier Categories
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Category 1 */}
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer">
                                <Leaf className="h-8 w-8 text-emerald-400 mb-3" />
                                <h3 className="font-bold text-white">Seeds & Seedlings</h3>
                                <p className="text-xs text-slate-400 mt-1">12 Verified Suppliers</p>
                                <div className="mt-3 flex items-center gap-2 text-xs">
                                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">Roses</span>
                                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">Chrysanthemums</span>
                                </div>
                            </div>
                            {/* Category 2 */}
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer">
                                <Package className="h-8 w-8 text-blue-400 mb-3" />
                                <h3 className="font-bold text-white">Fertilizers</h3>
                                <p className="text-xs text-slate-400 mt-1">8 Verified Suppliers</p>
                                <div className="mt-3 flex items-center gap-2 text-xs">
                                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400">Organic</span>
                                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400">NPK</span>
                                </div>
                            </div>
                            {/* Category 3 */}
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer">
                                <Truck className="h-8 w-8 text-amber-400 mb-3" />
                                <h3 className="font-bold text-white">Equipment</h3>
                                <p className="text-xs text-slate-400 mt-1">5 Verified Suppliers</p>
                                <div className="mt-3 flex items-center gap-2 text-xs">
                                    <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400">Pots</span>
                                    <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400">Tools</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Orders */}
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                        <h2 className="text-lg font-bold text-white mb-4">Active Purchase Orders</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-400">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-800/50">
                                    <tr>
                                        <th className="px-4 py-3">PO Number</th>
                                        <th className="px-4 py-3">Supplier</th>
                                        <th className="px-4 py-3">Items</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">ETA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-800 hover:bg-slate-800/30">
                                        <td className="px-4 py-3 font-medium text-white">PO-2024-001</td>
                                        <td className="px-4 py-3">Nông Trại Xanh Co.</td>
                                        <td className="px-4 py-3">1,000 Rose Seeds</td>
                                        <td className="px-4 py-3">
                                            <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="h-3 w-3" /> Delivered</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">Completed</td>
                                    </tr>
                                    <tr className="border-b border-slate-800 hover:bg-slate-800/30">
                                        <td className="px-4 py-3 font-medium text-white">PO-2024-002</td>
                                        <td className="px-4 py-3">Phân Bón Cửu Long</td>
                                        <td className="px-4 py-3">500 kg Organic NPK</td>
                                        <td className="px-4 py-3">
                                            <span className="flex items-center gap-1 text-amber-400"><Clock className="h-3 w-3" /> In Transit</span>
                                        </td>
                                        <td className="px-4 py-3">Dec 15</td>
                                    </tr>
                                    <tr className="border-b border-slate-800 hover:bg-slate-800/30">
                                        <td className="px-4 py-3 font-medium text-white">PO-2024-003</td>
                                        <td className="px-4 py-3">Chậu Hoa Minh Đức</td>
                                        <td className="px-4 py-3">2,000 Ceramic Pots</td>
                                        <td className="px-4 py-3">
                                            <span className="flex items-center gap-1 text-blue-400"><Package className="h-3 w-3" /> Processing</span>
                                        </td>
                                        <td className="px-4 py-3">Dec 20</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Top Suppliers */}
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/50 to-slate-900 border border-emerald-500/20">
                        <h2 className="text-lg font-bold text-white mb-4">🏆 Top Suppliers</h2>
                        <div className="space-y-4">
                            {[
                                { name: 'Nông Trại Xanh', rating: 4.9, orders: 156 },
                                { name: 'Phân Bón Cửu Long', rating: 4.7, orders: 89 },
                                { name: 'Hạt Giống Sa Đéc', rating: 4.8, orders: 124 }
                            ].map((supplier, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-white/5 hover:bg-slate-800 cursor-pointer">
                                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <span className="text-xs font-bold text-emerald-400">#{i + 1}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white">{supplier.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" /> {supplier.rating}</span>
                                            <span>• {supplier.orders} orders</span>
                                        </div>
                                    </div>
                                    <Phone className="h-4 w-4 text-slate-500 hover:text-white" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                        <h2 className="text-sm font-bold text-slate-400 mb-4 uppercase">Supply Health</h2>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400">On-Time Delivery</span>
                                    <span className="text-emerald-400 font-bold">96%</span>
                                </div>
                                <div className="w-full bg-slate-700 h-2 rounded-full">
                                    <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '96%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400">Quality Compliance</span>
                                    <span className="text-blue-400 font-bold">98%</span>
                                </div>
                                <div className="w-full bg-slate-700 h-2 rounded-full">
                                    <div className="bg-blue-400 h-2 rounded-full" style={{ width: '98%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400">Stock Level</span>
                                    <span className="text-amber-400 font-bold">78%</span>
                                </div>
                                <div className="w-full bg-slate-700 h-2 rounded-full">
                                    <div className="bg-amber-400 h-2 rounded-full" style={{ width: '78%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
