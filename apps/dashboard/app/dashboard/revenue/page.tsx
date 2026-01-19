'use client'

import React from 'react'
import { AgencyCard } from '@/components/ui/agency-card'
import { DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, Wallet } from 'lucide-react'

export default function RevenuePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Revenue Engine</h2>
                    <p className="text-neutral-400">Financial performance and forecasting</p>
                </div>
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors">
                    Add Transaction
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AgencyCard variant="neon" className="relative">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-neutral-400 text-sm">Monthly Recurring</p>
                            <h3 className="text-3xl font-bold text-white mt-2">$12,450</h3>
                        </div>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <DollarSign className="w-6 h-6 text-emerald-400" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-emerald-400">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        <span>+12.5% vs last month</span>
                    </div>
                </AgencyCard>

                <AgencyCard variant="glass-pro">
                     <div className="flex justify-between items-start">
                        <div>
                            <p className="text-neutral-400 text-sm">Expenses</p>
                            <h3 className="text-3xl font-bold text-white mt-2">$3,200</h3>
                        </div>
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <CreditCard className="w-6 h-6 text-red-400" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-red-400">
                        <ArrowDownRight className="w-4 h-4 mr-1" />
                        <span>+4.2% vs last month</span>
                    </div>
                </AgencyCard>

                <AgencyCard variant="glass-pro">
                     <div className="flex justify-between items-start">
                        <div>
                            <p className="text-neutral-400 text-sm">Net Profit</p>
                            <h3 className="text-3xl font-bold text-white mt-2">$9,250</h3>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Wallet className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-blue-400">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        <span>+8.1% margin</span>
                    </div>
                </AgencyCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AgencyCard variant="glass" className="h-[400px]">
                    <h3 className="text-lg font-bold text-white mb-4">Revenue Trend</h3>
                    <div className="h-full flex items-center justify-center text-neutral-500">
                        Chart Placeholder
                    </div>
                </AgencyCard>
                <AgencyCard variant="glass" className="h-[400px]">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Transactions</h3>
                    <div className="space-y-4">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-neutral-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Client Payment #{1000+i}</p>
                                        <p className="text-xs text-neutral-400">Today, 2:30 PM</p>
                                    </div>
                                </div>
                                <span className="text-emerald-400 font-medium">+$1,500.00</span>
                            </div>
                        ))}
                    </div>
                </AgencyCard>
            </div>
        </div>
    )
}
