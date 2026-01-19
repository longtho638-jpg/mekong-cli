'use client'

import React from 'react'
import { AgencyCard } from '@/components/ui/agency-card'
import { AgencyButton } from '@/components/ui/agency-button'
import { User, Bell, Lock, Globe, Database, CreditCard } from 'lucide-react'

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Settings</h2>
                    <p className="text-neutral-400">Manage your agency preferences</p>
                </div>
                <AgencyButton variant="secondary">Save Changes</AgencyButton>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                    {[
                        { label: 'General', icon: User, active: true },
                        { label: 'Notifications', icon: Bell },
                        { label: 'Security', icon: Lock },
                        { label: 'Integrations', icon: Globe },
                        { label: 'Database', icon: Database },
                        { label: 'Billing', icon: CreditCard },
                    ].map((item) => (
                        <button
                            key={item.label}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                item.active 
                                    ? 'bg-white/10 text-white font-medium shadow-catalyst' 
                                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <item.icon className="w-4 h-4" />
                            <span className="text-sm">{item.label}</span>
                        </button>
                    ))}
                </div>

                <div className="lg:col-span-3 space-y-6">
                    <AgencyCard variant="glass-pro">
                        <h3 className="text-lg font-bold text-white mb-6">Profile Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-neutral-400 uppercase">Agency Name</label>
                                <input type="text" className="w-full bg-neutral-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 transition-colors" defaultValue="Saigon Digital Hub" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-neutral-400 uppercase">Contact Email</label>
                                <input type="email" className="w-full bg-neutral-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 transition-colors" defaultValue="hello@saigondigital.com" />
                            </div>
                            <div className="col-span-full space-y-2">
                                <label className="text-xs font-medium text-neutral-400 uppercase">Bio / Mission</label>
                                <textarea className="w-full bg-neutral-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 transition-colors h-32" defaultValue="To empower local businesses with AI-driven growth strategies." />
                            </div>
                        </div>
                    </AgencyCard>

                    <AgencyCard variant="glass">
                        <h3 className="text-lg font-bold text-white mb-4">Preferences</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Dark Mode', desc: 'Use system theme by default', checked: true },
                                { label: 'Email Notifications', desc: 'Receive daily summary', checked: true },
                                { label: 'Public Profile', desc: 'Allow search engines to index', checked: false },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-white">{item.label}</p>
                                        <p className="text-xs text-neutral-500">{item.desc}</p>
                                    </div>
                                    <div className={`w-11 h-6 rounded-full relative transition-colors ${item.checked ? 'bg-emerald-500' : 'bg-neutral-700'}`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.checked ? 'left-6' : 'left-1'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AgencyCard>
                </div>
            </div>
        </div>
    )
}
