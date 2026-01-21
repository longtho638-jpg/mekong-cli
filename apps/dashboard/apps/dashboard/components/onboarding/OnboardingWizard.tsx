'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, User, CreditCard, Building, Flag } from 'lucide-react'
import { MD3Button } from '@/components/md3/MD3Button'
import { AgencyCard } from '@/components/ui/agency-card'

const STEPS = [
    { id: 1, title: 'Welcome', icon: Flag },
    { id: 2, title: 'Profile', icon: User },
    { id: 3, title: 'Workspace', icon: Building },
    { id: 4, title: 'Payment', icon: CreditCard },
    { id: 5, title: 'Complete', icon: Check }
]

export function OnboardingWizard() {
    const [currentStep, setCurrentStep] = useState(1)
    const [completed, setCompleted] = useState<number[]>([])

    const handleNext = () => {
        if (currentStep < STEPS.length) {
            setCompleted([...completed, currentStep])
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Progress Indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-800 -z-10" />
                    {STEPS.map((step) => {
                        const isCompleted = completed.includes(step.id)
                        const isCurrent = currentStep === step.id
                        const Icon = step.icon

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-background p-2">
                                <div
                                    className={`
                                        w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                        ${isCompleted || isCurrent
                                            ? 'border-blue-500 bg-blue-500 text-white'
                                            : 'border-neutral-600 bg-neutral-900 text-neutral-400'}
                                    `}
                                >
                                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <span className={`text-xs font-medium ${isCurrent ? 'text-blue-500' : 'text-neutral-500'}`}>
                                    {step.title}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Content Area */}
            <AgencyCard className="min-h-[400px] flex flex-col p-8">
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {currentStep === 1 && (
                                <div className="text-center space-y-4">
                                    <h2 className="text-3xl font-bold">Welcome to AgencyOS</h2>
                                    <p className="text-neutral-400">Let's get your agency set up for success in just a few minutes.</p>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold">Your Profile</h2>
                                    <div className="grid gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="text" placeholder="First Name" className="bg-neutral-900 border border-neutral-800 rounded-lg p-3" />
                                            <input type="text" placeholder="Last Name" className="bg-neutral-900 border border-neutral-800 rounded-lg p-3" />
                                        </div>
                                        <input type="email" placeholder="Work Email" className="bg-neutral-900 border border-neutral-800 rounded-lg p-3" />
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold">Workspace Setup</h2>
                                    <div className="space-y-4">
                                        <input type="text" placeholder="Agency Name" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3" />
                                        <select className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3">
                                            <option>1-10 Employees</option>
                                            <option>11-50 Employees</option>
                                            <option>50+ Employees</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold">Billing Information</h2>
                                    <div className="p-4 border border-dashed border-neutral-700 rounded-lg text-center text-neutral-400">
                                        Payment integration placeholder
                                    </div>
                                </div>
                            )}

                            {currentStep === 5 && (
                                <div className="text-center space-y-6">
                                    <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                                        <Check className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-3xl font-bold">You're All Set!</h2>
                                    <p className="text-neutral-400">Your workspace is ready. Let's start building.</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-4 border-t border-white/5">
                    <MD3Button
                        variant="outlined"
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className={currentStep === 1 ? 'invisible' : ''}
                    >
                        Back
                    </MD3Button>

                    <MD3Button
                        variant="filled"
                        onClick={handleNext}
                    >
                        {currentStep === STEPS.length ? 'Go to Dashboard' : 'Continue'}
                        {currentStep !== STEPS.length && <ChevronRight className="w-4 h-4 ml-2" />}
                    </MD3Button>
                </div>
            </AgencyCard>
        </div>
    )
}
