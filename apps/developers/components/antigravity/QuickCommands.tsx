'use client';

import React, { useState } from 'react';

/**
 * Quick Commands Panel
 * IDE-friendly command interface for AgencyEr
 */

interface Command {
    name: string;
    cmd: string;
    description: string;
    category: 'dev' | 'test' | 'deploy' | 'sync';
}

const commands: Command[] = [
    { name: 'Cook', cmd: 'mekong cook', description: 'Start dev server', category: 'dev' },
    { name: 'Cook Fast', cmd: 'mekong cook:fast', description: 'Fast mode', category: 'dev' },
    { name: 'Test', cmd: 'mekong test', description: 'Run all tests', category: 'test' },
    { name: 'Test WOW', cmd: 'mekong test:wow', description: 'AntigravityKit tests', category: 'test' },
    { name: 'Ship', cmd: 'mekong ship', description: 'Deploy to production', category: 'deploy' },
    { name: 'Ship Staging', cmd: 'mekong ship:staging', description: 'Deploy to staging', category: 'deploy' },
    { name: 'Sync', cmd: 'mekong sync', description: 'Sync AntigravityKit', category: 'sync' }
];

const categoryColors = {
    dev: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500',
    test: 'bg-green-500/10 border-green-500/30 text-green-500',
    deploy: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
    sync: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
};

export function QuickCommands() {
    const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

    const copyCommand = (cmd: string) => {
        navigator.clipboard.writeText(cmd);
        setCopiedCmd(cmd);
        setTimeout(() => setCopiedCmd(null), 2000);
    };

    return (
        <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-foreground">⚡ Quick Commands</h3>
                    <p className="text-sm text-muted-foreground">Dễ như ăn kẹo</p>
                </div>
                <span className="text-xs text-muted-foreground">Click to copy</span>
            </div>

            <div className="space-y-2">
                {commands.map((c) => (
                    <button
                        key={c.cmd}
                        onClick={() => copyCommand(c.cmd)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:scale-[1.02] ${categoryColors[c.category]}`}
                    >
                        <div className="flex items-center gap-3">
                            <code className="font-mono text-sm">{c.cmd}</code>
                            <span className="text-xs opacity-70">{c.description}</span>
                        </div>
                        <span className="text-xs">
                            {copiedCmd === c.cmd ? '✓ Copied' : '📋'}
                        </span>
                    </button>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                    🏯 cook → test → ship
                </p>
            </div>
        </div>
    );
}

export default QuickCommands;
