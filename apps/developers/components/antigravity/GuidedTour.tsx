'use client';

import React, { useState } from 'react';

/**
 * Guided Tour Component
 * Step-by-step walkthrough of AntigravityKit
 */

interface TourStep {
    id: number;
    module: string;
    icon: string;
    title: string;
    description: string;
    highlight: string;
    tips: string[];
}

const tourSteps: TourStep[] = [
    {
        id: 1,
        module: 'Welcome',
        icon: '🚀',
        title: 'Welcome to AntigravityKit',
        description: 'The toolkit that transforms solo agencies into one-person unicorns. Let\'s explore the 7 core modules.',
        highlight: 'header',
        tips: [
            'Built with Binh Pháp (Art of War) principles',
            'Designed for Southeast Asian markets',
            'From solo agency → VC-ready platform'
        ]
    },
    {
        id: 2,
        module: 'AgencyDNA',
        icon: '🧬',
        title: 'Your Agency Identity',
        description: 'AgencyDNA defines who you are: your niche, location, tone, and services. This is your unique positioning.',
        highlight: 'agency-dna',
        tips: [
            'Vietnamese tone support (Miền Tây, Miền Bắc, etc.)',
            'Tiered pricing (Starter → Enterprise)',
            'Service catalog with pricing'
        ]
    },
    {
        id: 3,
        module: 'ClientMagnet',
        icon: '🧲',
        title: 'Lead Generation Engine',
        description: 'ClientMagnet tracks leads from multiple sources, qualifies them, and converts them into paying clients.',
        highlight: 'client-magnet',
        tips: [
            'Multi-channel tracking (Facebook, Zalo, Referral)',
            'Lead scoring and qualification',
            'Pipeline value calculation',
            'Conversion rate analytics'
        ]
    },
    {
        id: 4,
        module: 'RevenueEngine',
        icon: '💰',
        title: 'Revenue Tracking',
        description: 'Track MRR, ARR, invoices, and collection rates. The financial backbone of your agency.',
        highlight: 'revenue-engine',
        tips: [
            'Multi-currency support (VND, USD)',
            'MRR/ARR auto-calculation',
            'Invoice lifecycle management',
            'Collection rate optimization'
        ]
    },
    {
        id: 5,
        module: 'ContentFactory',
        icon: '🎨',
        title: 'Content Production',
        description: 'Generate unlimited content ideas and track virality scores. From ideation to publication.',
        highlight: 'content-factory',
        tips: [
            'AI-powered idea generation',
            'Virality score prediction',
            'Content calendar integration',
            'Niche-specific trends'
        ]
    },
    {
        id: 6,
        module: 'FranchiseManager',
        icon: '🏢',
        title: 'Scale Your Network',
        description: 'Turn your agency into a territory-based franchise network. 20% royalties on all revenue.',
        highlight: 'franchise-manager',
        tips: [
            '8 pre-defined territories',
            'Automatic royalty calculation (20%)',
            'Network revenue tracking',
            'Franchisee performance metrics'
        ]
    },
    {
        id: 7,
        module: 'VCMetrics',
        icon: '📊',
        title: 'VC Readiness Score',
        description: 'The holy grail: 83/100 VC readiness score. Track LTV/CAC, Rule of 40, NRR, and more.',
        highlight: 'vc-metrics',
        tips: [
            'Real-time readiness scoring (0-100)',
            'LTV/CAC ratio tracking',
            'Rule of 40 calculation',
            'Stage-based benchmarks (Seed → Series A)'
        ]
    },
    {
        id: 8,
        module: 'DataMoat',
        icon: '🛡️',
        title: 'Proprietary Intelligence',
        description: 'Build defensibility through data. Record success patterns and generate best practices.',
        highlight: 'data-moat',
        tips: [
            '1,247+ proprietary data points',
            'Platform-specific best practices',
            'Defensibility scoring',
            'Competitive moat building'
        ]
    },
    {
        id: 9,
        module: 'Complete',
        icon: '🎊',
        title: 'You\'re Ready!',
        description: 'You now understand all 7 AntigravityKit modules. Time to build your one-person unicorn!',
        highlight: 'complete',
        tips: [
            'Start with AgencyDNA (identity)',
            'Use ClientMagnet (leads)',
            'Track with RevenueEngine (money)',
            'Scale with FranchiseManager',
            'Monitor with VCMetrics',
            'Build moat with DataMoat'
        ]
    }
];

export function GuidedTour() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isActive, setIsActive] = useState(false);

    const step = tourSteps[currentStep];
    const progress = ((currentStep + 1) / tourSteps.length) * 100;

    const startTour = () => {
        setIsActive(true);
        setCurrentStep(0);
    };

    const nextStep = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setIsActive(false);
            setCurrentStep(0);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const skipTour = () => {
        setIsActive(false);
        setCurrentStep(0);
    };

    if (!isActive) {
        return (
            <button
                onClick={startTour}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
            >
                🎓 Start Guided Tour
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl max-w-2xl w-full mx-4 shadow-2xl">
                {/* Progress Bar */}
                <div className="h-2 bg-muted rounded-t-2xl overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <span className="text-5xl">{step.icon}</span>
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">
                                Step {currentStep + 1} of {tourSteps.length}
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">{step.title}</h2>
                        </div>
                    </div>

                    <p className="text-lg text-foreground mb-6">{step.description}</p>

                    <div className="bg-muted/50 rounded-lg p-4 mb-6">
                        <h4 className="font-semibold text-foreground mb-3">💡 Key Features:</h4>
                        <ul className="space-y-2">
                            {step.tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={skipTour}
                            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Skip Tour
                        </button>

                        <div className="flex gap-2">
                            {currentStep > 0 && (
                                <button
                                    onClick={prevStep}
                                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    ← Previous
                                </button>
                            )}
                            <button
                                onClick={nextStep}
                                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                            >
                                {currentStep === tourSteps.length - 1 ? 'Finish 🎊' : 'Next →'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GuidedTour;
