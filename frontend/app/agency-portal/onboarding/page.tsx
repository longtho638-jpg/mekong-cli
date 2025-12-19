'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AgencyProfile {
    name: string
    email: string
    website: string
    niche: string
    size: string
    location: string
    services: string[]
}

const NICHES = [
    'Digital Marketing',
    'Social Media',
    'SEO/SEM',
    'Content Marketing',
    'Branding',
    'Web Development',
    'Full Service',
    'Other'
]

const SIZES = [
    'Solo (1 person)',
    'Small (2-5)',
    'Medium (6-15)',
    'Large (16+)'
]

const SERVICES = [
    'SEO',
    'PPC',
    'Social Media',
    'Content Creation',
    'Email Marketing',
    'Web Design',
    'Branding',
    'Video Production',
    'Analytics',
    'Consulting'
]

export default function AgencyOnboarding() {
    const [step, setStep] = useState(1)
    const [profile, setProfile] = useState<AgencyProfile>({
        name: '',
        email: '',
        website: '',
        niche: '',
        size: '',
        location: '',
        services: []
    })

    const updateProfile = (field: keyof AgencyProfile, value: string | string[]) => {
        setProfile(prev => ({ ...prev, [field]: value }))
    }

    const toggleService = (service: string) => {
        const services = profile.services.includes(service)
            ? profile.services.filter(s => s !== service)
            : [...profile.services, service]
        updateProfile('services', services)
    }

    const nextStep = () => setStep(s => Math.min(s + 1, 5))
    const prevStep = () => setStep(s => Math.max(s - 1, 1))

    const StepIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map(s => (
                <div
                    key={s}
                    className={`w-3 h-3 rounded-full transition-all ${s === step
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 w-8'
                            : s < step
                                ? 'bg-green-500'
                                : 'bg-gray-600'
                        }`}
                />
            ))}
        </div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                        🏯 Welcome to Agency OS
                    </h1>
                    <p className="text-gray-400 mt-2">Let&apos;s set up your professional agency in 5 minutes</p>
                </div>

                <StepIndicator />

                {/* Card */}
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Basic Info */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-2xl font-semibold text-white">Agency Basics</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Agency Name</label>
                                        <input
                                            type="text"
                                            value={profile.name}
                                            onChange={e => updateProfile('name', e.target.value)}
                                            placeholder="Your Agency Name"
                                            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            onChange={e => updateProfile('email', e.target.value)}
                                            placeholder="you@agency.com"
                                            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Website (optional)</label>
                                        <input
                                            type="url"
                                            value={profile.website}
                                            onChange={e => updateProfile('website', e.target.value)}
                                            placeholder="https://your-agency.com"
                                            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Niche */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-2xl font-semibold text-white">Your Niche</h2>
                                <p className="text-gray-400">What type of agency are you?</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {NICHES.map(niche => (
                                        <button
                                            key={niche}
                                            onClick={() => updateProfile('niche', niche)}
                                            className={`px-4 py-3 rounded-xl border transition-all ${profile.niche === niche
                                                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                                    : 'bg-gray-700/30 border-gray-600 text-gray-300 hover:border-gray-500'
                                                }`}
                                        >
                                            {niche}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Size & Location */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-2xl font-semibold text-white">Team Size & Location</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-3">Team Size</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {SIZES.map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => updateProfile('size', size)}
                                                    className={`px-4 py-3 rounded-xl border transition-all ${profile.size === size
                                                            ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                                            : 'bg-gray-700/30 border-gray-600 text-gray-300 hover:border-gray-500'
                                                        }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Location</label>
                                        <input
                                            type="text"
                                            value={profile.location}
                                            onChange={e => updateProfile('location', e.target.value)}
                                            placeholder="City, Country"
                                            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Services */}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-2xl font-semibold text-white">Services You Offer</h2>
                                <p className="text-gray-400">Select all that apply</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {SERVICES.map(service => (
                                        <button
                                            key={service}
                                            onClick={() => toggleService(service)}
                                            className={`px-4 py-3 rounded-xl border transition-all ${profile.services.includes(service)
                                                    ? 'bg-green-500/20 border-green-500 text-green-300'
                                                    : 'bg-gray-700/30 border-gray-600 text-gray-300 hover:border-gray-500'
                                                }`}
                                        >
                                            {profile.services.includes(service) ? '✓ ' : ''}{service}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 5: Confirmation */}
                        {step === 5 && (
                            <motion.div
                                key="step5"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 text-center"
                            >
                                <div className="text-6xl mb-4">🎉</div>
                                <h2 className="text-2xl font-semibold text-white">You&apos;re All Set!</h2>
                                <p className="text-gray-400">Welcome to Agency OS, {profile.name || 'Agency'}!</p>

                                <div className="bg-gray-700/30 rounded-xl p-4 text-left space-y-2">
                                    <p className="text-sm text-gray-400">Your Profile:</p>
                                    <p className="text-white">🏢 {profile.name}</p>
                                    <p className="text-gray-300">📧 {profile.email}</p>
                                    <p className="text-gray-300">🎯 {profile.niche}</p>
                                    <p className="text-gray-300">👥 {profile.size}</p>
                                    <p className="text-gray-300">📍 {profile.location}</p>
                                    <p className="text-gray-300">🛠️ {profile.services.join(', ')}</p>
                                </div>

                                <a
                                    href="/agency-portal"
                                    className="inline-block mt-4 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
                                >
                                    Go to Dashboard →
                                </a>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation */}
                    {step < 5 && (
                        <div className="flex justify-between mt-8">
                            <button
                                onClick={prevStep}
                                disabled={step === 1}
                                className="px-6 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={nextStep}
                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
                            >
                                {step === 4 ? 'Complete Setup' : 'Next →'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-4">
                    Powered by Agency OS v2.0 • WIN-WIN-WIN
                </p>
            </motion.div>
        </div>
    )
}
