'use client'
import { useState } from 'react'
import AnimatedCounter, { AnimatedStatCard } from '@/components/AnimatedCounter'
import AnimatedProgressRing from '@/components/AnimatedProgressRing'
import Tooltip from '@/components/Tooltip'
import RippleButton from '@/components/RippleButton'
import { ConfettiButton } from '@/components/Confetti'
import Accordion, { Collapsible } from '@/components/Accordion'
import AnimatedBadge, { StatusBadge, CountBadge } from '@/components/AnimatedBadge'
import AnimatedTabs from '@/components/AnimatedTabs'
import Modal, { ConfirmModal } from '@/components/Modal'
import Skeleton, { HubCardSkeleton, DashboardSkeleton } from '@/components/Skeleton'

export default function ShowcasePage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)

    return (
        <div className="min-h-screen bg-[#0a0118] text-white relative overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-cyan-900/20 to-pink-900/20"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full filter blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/30 rounded-full filter blur-[120px] animate-pulse delay-1000"></div>
            </div>

            {/* Hero Header */}
            <div className="relative z-10 border-b border-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-cyan-600/10 to-pink-600/10 backdrop-blur-2xl"></div>
                <div className="relative mx-auto max-w-7xl px-6 py-24 text-center">
                    <div className="mb-6 inline-block">
                        <div className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 backdrop-blur-xl">
                            <span className="text-sm font-medium bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                ✨ Premium Component Library
                            </span>
                        </div>
                    </div>
                    <h1 className="text-7xl md:text-8xl font-black mb-6 leading-none">
                        <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl">
                            WOW Components
                        </span>
                    </h1>
                    <p className="text-2xl text-white/60 mb-10 font-light">
                        Agency OS v2.0 - Built with <span className="text-purple-400 font-semibold">Framer Motion</span>
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <div className="group px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 border border-cyan-500/30 backdrop-blur-xl hover:border-cyan-400/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                            <span className="text-cyan-400 font-semibold">10 Components</span>
                        </div>
                        <div className="group px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/30 backdrop-blur-xl hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                            <span className="text-purple-400 font-semibold">Framer Motion</span>
                        </div>
                        <div className="group px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500/10 to-pink-500/5 border border-pink-500/30 backdrop-blur-xl hover:border-pink-400/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                            <span className="text-pink-400 font-semibold">Glassmorphism</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - 2 Column Grid Layout */}
            <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">

                {/* Full Width Header Section */}
                <div className="mb-8">
                    <section className="premium-card rounded-3xl p-8 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                        <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4 relative z-10">
                            <span className="text-5xl filter drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">📊</span>
                            <span className="bg-gradient-to-r from-cyan-400 via-white to-purple-400 bg-clip-text text-transparent animate-gradient-x">
                                Animated Counters
                            </span>
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                            <AnimatedStatCard label="Total Revenue" value={1234567} prefix="$" icon="💰" color="cyan" trend={{ value: 12.5, positive: true }} />
                            <AnimatedStatCard label="Active Users" value={45678} icon="👥" color="purple" trend={{ value: 8.2, positive: true }} />
                            <AnimatedStatCard label="Deals Closed" value={234} icon="🎯" color="green" />
                            <AnimatedStatCard label="Win Rate" value={78} suffix="%" icon="📈" color="orange" />
                        </div>
                    </section>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-8">

                        {/* Progress Rings */}
                        <section className="premium-card rounded-3xl p-8 relative overflow-hidden group hover:neon-glow-purple transition-all duration-500">
                            <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4 relative z-10">
                                <span className="text-5xl filter drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">🎯</span>
                                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                                    Progress Rings
                                </span>
                            </h2>
                            <div className="flex flex-wrap gap-8 justify-center items-center relative z-10">
                                <AnimatedProgressRing progress={75} color="cyan" label="Completion" />
                                <AnimatedProgressRing progress={45} color="purple" label="Pipeline" size={100} />
                                <AnimatedProgressRing progress={90} color="green" label="Goals" size={120} strokeWidth={10} />
                                <div className="hidden sm:block">
                                    <AnimatedProgressRing progress={60} color="gradient" label="Growth" />
                                </div>
                            </div>
                        </section>

                        {/* Animated Tabs */}
                        <section className="premium-card rounded-3xl p-8 relative overflow-hidden group hover:shadow-[0_0_40px_rgba(59,130,246,0.2)]">
                            <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4 relative z-10">
                                <span className="text-5xl filter drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">📑</span>
                                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                                    Animated Tabs
                                </span>
                            </h2>
                            <div className="space-y-8 relative z-10">
                                <AnimatedTabs
                                    variant="underline"
                                    tabs={[
                                        { id: '1', label: 'Overview', icon: '📊', content: <div className="p-6 ultra-glass rounded-2xl">Overview analytics.</div> },
                                        { id: '2', label: 'Analytics', icon: '📈', content: <div className="p-6 ultra-glass rounded-2xl">Performance data.</div> },
                                        { id: '3', label: 'Settings', icon: '⚙️', content: <div className="p-6 ultra-glass rounded-2xl">User config.</div> },
                                    ]}
                                />
                                <AnimatedTabs
                                    variant="pills"
                                    tabs={[
                                        { id: 'a', label: 'All', content: <div className="text-white/60 p-2">All items</div> },
                                        { id: 'b', label: 'Active', content: <div className="text-white/60 p-2">Active items</div> },
                                        { id: 'c', label: 'Archived', content: <div className="text-white/60 p-2">Archived items</div> },
                                    ]}
                                />
                            </div>
                        </section>

                        {/* Accordion */}
                        <section className="premium-card rounded-3xl p-8 relative overflow-hidden group hover:shadow-[0_0_40px_rgba(249,115,22,0.2)]">
                            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 relative z-10">
                                <span className="text-4xl filter drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]">📂</span>
                                <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                                    Accordion
                                </span>
                            </h2>
                            <div className="relative z-10">
                                <Accordion
                                    variant="card"
                                    items={[
                                        { id: '1', title: 'Agency OS?', icon: '🏯', content: 'Comprehensive platform for venture studio ops.' },
                                        { id: '2', title: 'The Shield?', icon: '🛡️', content: 'Anti-dilution protection for founders.' },
                                    ]}
                                />
                            </div>
                        </section>

                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">

                        {/* Animated Badges */}
                        <section className="premium-card rounded-3xl p-8 relative overflow-hidden group hover:neon-glow-cyan transition-all duration-500">
                            <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4 relative z-10">
                                <span className="text-5xl filter drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">🏷️</span>
                                <span className="bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                    Animated Badges
                                </span>
                            </h2>
                            <div className="flex flex-wrap gap-3 relative z-10 content-start">
                                <AnimatedBadge>Default</AnimatedBadge>
                                <AnimatedBadge variant="success" pulse glow>Live</AnimatedBadge>
                                <AnimatedBadge variant="warning">Pending</AnimatedBadge>
                                <AnimatedBadge variant="error">Failed</AnimatedBadge>
                                <AnimatedBadge variant="info" glow>New</AnimatedBadge>
                                <AnimatedBadge variant="premium" glow>Premium</AnimatedBadge>
                                <div className="w-full h-2"></div> {/* Spacer */}
                                <StatusBadge status="active" />
                                <StatusBadge status="pending" />
                                <StatusBadge status="completed" />
                                <CountBadge count={5} />
                                <CountBadge count={150} />
                            </div>
                        </section>

                        {/* Interactive Buttons */}
                        <section className="premium-card rounded-3xl p-8 relative overflow-hidden group hover:neon-glow-pink transition-all duration-500">
                            <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4 relative z-10">
                                <span className="text-5xl filter drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">🔘</span>
                                <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 bg-clip-text text-transparent">
                                    Interactive
                                </span>
                            </h2>
                            <div className="flex flex-wrap gap-4 relative z-10">
                                <Tooltip content="Click for ripple effect!" position="top">
                                    <RippleButton variant="primary">Primary</RippleButton>
                                </Tooltip>
                                <Tooltip content="Secondary action" position="bottom">
                                    <RippleButton variant="secondary">Secondary</RippleButton>
                                </Tooltip>
                                <RippleButton variant="ghost">Ghost</RippleButton>
                                <div className="w-full"></div>
                                <RippleButton variant="danger" icon="⚠️">Danger</RippleButton>
                                <ConfettiButton>🎉 Celebrate!</ConfettiButton>
                            </div>
                        </section>

                        {/* Modals & Skeletons Stacked or Combined to fill space */}
                        <section className="premium-card rounded-3xl p-8 relative overflow-hidden group hover:shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 relative z-10">
                                <span className="text-4xl filter drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">💬</span>
                                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                                    Modals
                                </span>
                            </h2>
                            <div className="flex flex-col gap-4 relative z-10 justify-center pb-4">
                                <p className="text-white/60 text-sm mb-2">Click to experience ultra-glass overlays.</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <RippleButton onClick={() => setIsModalOpen(true)} className="w-full justify-center">Open Modal</RippleButton>
                                    <RippleButton variant="danger" onClick={() => setIsConfirmOpen(true)} className="w-full justify-center">Confirm</RippleButton>
                                </div>
                            </div>
                        </section>

                        <section className="premium-card rounded-3xl p-8 relative overflow-hidden group hover:shadow-[0_0_40px_rgba(234,179,8,0.2)]">
                            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 relative z-10">
                                <span className="text-4xl filter drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">💀</span>
                                <span className="bg-gradient-to-r from-yellow-400 to-red-400 bg-clip-text text-transparent">
                                    Skeletons
                                </span>
                            </h2>
                            <div className="space-y-6 relative z-10">
                                <div>
                                    <HubCardSkeleton />
                                </div>
                                <div className="space-y-3">
                                    <Skeleton variant="text" lines={2} />
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Example Modal" size="md">
                <p className="text-white/70 mb-4">This is a beautiful modal dialog with backdrop blur and smooth animations.</p>
                <div className="flex gap-3 justify-end">
                    <RippleButton variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</RippleButton>
                    <RippleButton onClick={() => setIsModalOpen(false)}>Save Changes</RippleButton>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => console.log('Confirmed!')}
                title="Confirm Delete"
                message="Are you sure you want to delete this item? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    )
}
