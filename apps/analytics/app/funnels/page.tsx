'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Filter, ArrowRight } from 'lucide-react'

// --- Components ---

interface FunnelStepProps {
    step: number;
    label: string;
    count: number;
    conversion: number;
    isLast?: boolean;
}

function FunnelStep({ step, label, count, conversion, isLast }: FunnelStepProps) {
    // Calculate width based on percentage relative to start (mock logic for visual)
    // Assume step 1 is 100% width
    const widthPercent = Math.max(20, (count / 5000) * 100) // Mock base of 5000

    return (
        <div className="relative mb-2">
            <div className="flex items-center gap-4 mb-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 font-bold text-white">
                    {step}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-white font-medium">{label}</h4>
                        <span className="text-neutral-400 text-sm">{count.toLocaleString()} users</span>
                    </div>
                    <div className="h-12 bg-white/5 rounded-r-xl relative overflow-hidden" style={{ width: `${widthPercent}%` }}>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/50 to-purple-500/50 border-r-2 border-purple-400/50" />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white drop-shadow-md">
                            {isLast ? 'WIN' : `${conversion}% conv`}
                        </div>
                    </div>
                </div>
            </div>
            {!isLast && (
                <div className="ml-4 pl-4 border-l border-white/10 h-6 flex items-center">
                    <div className="text-xs text-neutral-500 ml-4 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        Drop-off: {100 - conversion}%
                    </div>
                </div>
            )}
        </div>
    )
}

// --- Page ---

export default function FunnelsPage() {
    // Mock Funnel Data for MVP
    const funnelSteps = [
        { label: 'Website Visit', count: 5000, conversion: 100 },
        { label: 'Sign Up', count: 1200, conversion: 24 },
        { label: 'Activated (Created Project)', count: 800, conversion: 66 },
        { label: 'Trial Started', count: 300, conversion: 37 },
        { label: 'Paid Subscription', count: 120, conversion: 40 },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Conversion Funnels</h1>
                <p className="text-neutral-400">Track user journey from visitor to paid customer.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Funnel Visualization */}
                <div className="lg:col-span-2 p-8 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Filter className="w-5 h-5 text-purple-400" />
                            Primary Acquisition Funnel
                        </h3>
                        <div className="text-sm text-neutral-400">Last 30 Days</div>
                    </div>

                    <div className="space-y-1">
                        {funnelSteps.map((step, i) => (
                            <FunnelStep
                                key={i}
                                step={i + 1}
                                label={step.label}
                                count={step.count}
                                conversion={step.conversion}
                                isLast={i === funnelSteps.length - 1}
                            />
                        ))}
                    </div>
                </div>

                {/* Insights Panel */}
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Funnel Insights</h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <p className="text-sm font-medium text-emerald-400 mb-1">Strong Activation</p>
                                <p className="text-sm text-neutral-300">66% of signups create a project. This is above industry benchmark (40-50%).</p>
                            </div>
                            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                <p className="text-sm font-medium text-rose-400 mb-1">Trial Bottleneck</p>
                                <p className="text-sm text-neutral-300">Only 37% of activated users start a trial. Consider adding "Pro Feature" teasers earlier.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Overall Conversion</h3>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-white">2.4%</span>
                            <span className="text-sm text-neutral-400 mb-1">Visitor to Paid</span>
                        </div>
                        <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 w-[2.4%]" />
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">Target: 3.0%</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
