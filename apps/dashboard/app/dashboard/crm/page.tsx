'use client'

import React from 'react'
import { AgencyCard } from '@/components/ui/agency-card'
import { Users, Mail, Phone, Calendar, MoreVertical } from 'lucide-react'

export default function CRMPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Client Magnet</h2>
                    <p className="text-neutral-400">Manage relationships and pipeline</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors">
                    Add Contact
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-4">
                     <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                        {['All Contacts', 'Leads', 'Prospects', 'Clients', 'Partners'].map((tab, i) => (
                            <button 
                                key={tab}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${i === 0 ? 'bg-white text-black' : 'bg-white/5 text-neutral-400 hover:text-white'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {[1, 2, 3, 4, 5].map((i) => (
                        <AgencyCard key={i} variant="glass-pro" className="flex items-center justify-between p-4 group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                                    {String.fromCharCode(64 + i)}
                                </div>
                                <div>
                                    <h4 className="text-white font-bold">Acme Corp {i}</h4>
                                    <p className="text-sm text-neutral-400">contact@acmecorp{i}.com</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="hidden md:block text-right">
                                    <p className="text-xs text-neutral-500 uppercase">Status</p>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                                        Active Client
                                    </span>
                                </div>
                                <div className="hidden md:block text-right">
                                    <p className="text-xs text-neutral-500 uppercase">Value</p>
                                    <p className="text-white font-medium">$12,000</p>
                                </div>
                                <button className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </AgencyCard>
                    ))}
                </div>

                <div className="space-y-6">
                    <AgencyCard variant="glass" className="sticky top-6">
                        <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-neutral-400">Total Contacts</span>
                                <span className="text-white font-bold">1,240</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-neutral-400">New This Week</span>
                                <span className="text-emerald-400 font-bold">+24</span>
                            </div>
                             <div className="h-px bg-white/10 my-4" />
                             <div className="space-y-2">
                                <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors">
                                    <Mail className="w-4 h-4 text-neutral-400" />
                                    <span className="text-sm text-white">Email Blast</span>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors">
                                    <Calendar className="w-4 h-4 text-neutral-400" />
                                    <span className="text-sm text-white">Schedule Meeting</span>
                                </button>
                             </div>
                        </div>
                    </AgencyCard>
                </div>
            </div>
        </div>
    )
}
