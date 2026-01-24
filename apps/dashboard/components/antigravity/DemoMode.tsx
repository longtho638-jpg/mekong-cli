'use client';

import React, { useState } from 'react';
import { antigravityAPI } from '../../lib/api/antigravity';

/**
 * Demo Mode Component
 * Provides interactive demo with simulated data flow
 */

interface DemoStep {
    id: number;
    title: string;
    description: string;
    icon: string;
    action: string;
    duration: number;
}

const demoSteps: DemoStep[] = [
    {
        id: 1,
        title: 'Reset Data',
        description: 'Clear all data and start fresh',
        icon: '🔄',
        action: 'reset',
        duration: 1000
    },
    {
        id: 2,
        title: 'Setup Agency',
        description: 'Configure AgencyDNA identity',
        icon: '🧬',
        action: 'setup_dna',
        duration: 2000
    },
    {
        id: 3,
        title: 'Generate Leads',
        description: 'ClientMagnet attracts 127 leads',
        icon: '🧲',
        action: 'generate_leads',
        duration: 3000
    },
    {
        id: 4,
        title: 'Convert Clients',
        description: '15 leads become paying clients',
        icon: '💰',
        action: 'convert_clients',
        duration: 2000
    },
    {
        id: 5,
        title: 'Create Content',
        description: 'ContentFactory generates 87 ideas',
        icon: '🎨',
        action: 'create_content',
        duration: 2000
    },
    {
        id: 6,
        title: 'Add Franchises',
        description: '3 franchisees join network',
        icon: '🏢',
        action: 'add_franchises',
        duration: 2000
    },
    {
        id: 7,
        title: 'Calculate VC Score',
        description: 'VCMetrics: 83/100 readiness',
        icon: '📊',
        action: 'calculate_vc',
        duration: 2000
    },
    {
        id: 8,
        title: 'Build Data Moat',
        description: 'Record 1,247 proprietary insights',
        icon: '🛡️',
        action: 'build_moat',
        duration: 2000
    }
];

export function DemoMode() {
    const [isRunning, setIsRunning] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [isPaused, setIsPaused] = useState(false);

    const runDemo = async () => {
        setIsRunning(true);
        setCurrentStep(0);
        setCompletedSteps([]);
        setIsPaused(false);

        // Reset data first
        await antigravityAPI.resetDemoData();

        // Run through each step
        for (let i = 0; i < demoSteps.length; i++) {
            if (isPaused) {
                setIsRunning(false);
                return;
            }

            setCurrentStep(i);
            const step = demoSteps[i];

            // Simulate step execution
            await new Promise(resolve => setTimeout(resolve, step.duration));

            setCompletedSteps(prev => [...prev, step.id]);
        }

        setIsRunning(false);
        setCurrentStep(demoSteps.length);
    };

    const stopDemo = () => {
        setIsPaused(true);
        setIsRunning(false);
    };

    const resetDemo = async () => {
        setCompletedSteps([]);
        setCurrentStep(0);
        await antigravityAPI.resetDemoData();
    };

    return (
        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-foreground">🎬 Interactive Demo</h3>
                    <p className="text-sm text-muted-foreground">
                        See AntigravityKit in action - from zero to VC-ready
                    </p>
                </div>
                <div className="flex gap-2">
                    {!isRunning ? (
                        <>
                            <button
                                onClick={runDemo}
                                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                            >
                                ▶️ Start Demo
                            </button>
                            {completedSteps.length > 0 && (
                                <button
                                    onClick={resetDemo}
                                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    🔄 Reset
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={stopDemo}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                        >
                            ⏸️ Stop
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {demoSteps.map((step, index) => {
                    const isCompleted = completedSteps.includes(step.id);
                    const isCurrent = currentStep === index && isRunning;

                    return (
                        <div
                            key={step.id}
                            className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${isCompleted
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : isCurrent
                                        ? 'bg-purple-500/10 border-purple-500/50 animate-pulse'
                                        : 'bg-background/50 border-border'
                                }`}
                        >
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isCompleted
                                    ? 'bg-green-500 text-white'
                                    : isCurrent
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-muted text-muted-foreground'
                                }`}>
                                {isCompleted ? '✓' : step.icon}
                            </div>

                            <div className="flex-1">
                                <h4 className="font-semibold text-foreground">{step.title}</h4>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>

                            {isCurrent && (
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm text-purple-500 font-medium">Running...</span>
                                </div>
                            )}

                            {isCompleted && (
                                <span className="text-sm text-green-500 font-medium">Complete</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {completedSteps.length === demoSteps.length && !isRunning && (
                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                    <p className="text-green-500 font-semibold mb-2">🎊 Demo Complete!</p>
                    <p className="text-sm text-muted-foreground mb-4">
                        You now have a fully populated AntigravityKit with:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div className="bg-background/50 p-2 rounded">
                            <div className="font-semibold">127</div>
                            <div className="text-muted-foreground">Leads</div>
                        </div>
                        <div className="bg-background/50 p-2 rounded">
                            <div className="font-semibold">15</div>
                            <div className="text-muted-foreground">Clients</div>
                        </div>
                        <div className="bg-background/50 p-2 rounded">
                            <div className="font-semibold">87</div>
                            <div className="text-muted-foreground">Ideas</div>
                        </div>
                        <div className="bg-background/50 p-2 rounded">
                            <div className="font-semibold">83/100</div>
                            <div className="text-muted-foreground">VC Score</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DemoMode;
