'use client'

import React from 'react'
import { AgencyCard } from '@/components/ui/agency-card'
import { AgencyButton } from '@/components/ui/agency-button'
import { Twitter, Instagram, Linkedin, Video, Sparkles } from 'lucide-react'

export default function ContentPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Content Factory</h2>
                    <p className="text-neutral-400">AI-powered content generation</p>
                </div>
                <AgencyButton variant="primary" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generate Ideas
                </AgencyButton>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Twitter Thread', icon: Twitter, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'LinkedIn Post', icon: Linkedin, color: 'text-blue-600', bg: 'bg-blue-600/10' },
                    { label: 'Instagram Reel', icon: Instagram, color: 'text-pink-500', bg: 'bg-pink-500/10' },
                    { label: 'YouTube Short', icon: Video, color: 'text-red-500', bg: 'bg-red-500/10' },
                ].map((item) => (
                    <AgencyCard key={item.label} variant="glass-pro" className="flex flex-col items-center justify-center py-8 gap-3 cursor-pointer hover:border-emerald-500/30 group">
                        <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <item.icon className={`w-6 h-6 ${item.color}`} />
                        </div>
                        <span className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors">{item.label}</span>
                    </AgencyCard>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <AgencyCard variant="glass" className="min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white">Content Calendar</h3>
                            <div className="flex gap-2">
                                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                <span className="text-xs text-neutral-400">Scheduled</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-px bg-white/10 border border-white/10 rounded-lg overflow-hidden">
                            {Array.from({ length: 35 }).map((_, i) => (
                                <div key={i} className="aspect-square bg-neutral-900/50 p-2 hover:bg-white/5 transition-colors relative group">
                                    <span className="text-xs text-neutral-500">{i + 1}</span>
                                    {i % 5 === 0 && (
                                        <div className="absolute inset-x-1 bottom-1 p-1 rounded bg-blue-500/20 text-[10px] text-blue-300 truncate">
                                            New Feature
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </AgencyCard>
                </div>

                <div className="space-y-6">
                    <AgencyCard variant="neon">
                        <h3 className="text-lg font-bold text-white mb-4">Trending Topics</h3>
                        <div className="flex flex-wrap gap-2">
                            {['#AgencyLife', '#AI', '#SaaS', '#GrowthHacking', '#NoCode'].map(tag => (
                                <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300 hover:text-white hover:border-emerald-500/50 cursor-pointer transition-all">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </AgencyCard>

                     <AgencyCard variant="glass-pro">
                        <h3 className="text-lg font-bold text-white mb-4">Drafts</h3>
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group">
                                    <h4 className="text-sm font-medium text-white mb-1 group-hover:text-emerald-400">10 Ways to Scale...</h4>
                                    <p className="text-xs text-neutral-500">Last edited 2h ago</p>
                                </div>
                            ))}
                        </div>
                    </AgencyCard>
                </div>
            </div>
        </div>
    )
}
