'use client'

import { useState } from 'react'
import { MD3Card } from '@/components/md3/MD3Card'
import { MD3Button } from '@/components/md3/MD3Button'
import { MD3Text } from '@/components/md3-dna/MD3Text'
import { Copy, Check, Terminal, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function OverviewPage() {
    const [copied, setCopied] = useState(false)
    const apiUrl = "https://api.agencyos.dev/api/v1"

    const copyUrl = () => {
        navigator.clipboard.writeText(apiUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-8">
            <div>
                <MD3Text variant="display-small" className="mb-2">Developer Overview</MD3Text>
                <MD3Text variant="body-large" className="text-[var(--md-sys-color-on-surface-variant)]">
                    Manage your API integrations and webhooks.
                </MD3Text>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MD3Card variant="elevated" className="p-6">
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Terminal className="w-6 h-6 text-[var(--md-sys-color-primary)]" />
                                <MD3Text variant="headline-small">Quick Start</MD3Text>
                            </div>
                            <MD3Text variant="body-medium" className="mb-4">
                                Your API Base URL:
                            </MD3Text>
                            <div className="flex items-center gap-2 bg-[var(--md-sys-color-surface-container)] p-3 rounded-md mb-4 font-mono text-sm">
                                <span className="flex-1 truncate">{apiUrl}</span>
                                <button onClick={copyUrl} className="p-1 hover:bg-[var(--md-sys-color-surface-container-high)] rounded">
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/docs">
                                <MD3Button variant="filled">View Documentation</MD3Button>
                            </Link>
                            <Link href="/api-keys">
                                <MD3Button variant="outlined">Get API Key</MD3Button>
                            </Link>
                        </div>
                    </div>
                </MD3Card>

                <MD3Card variant="filled" className="p-6">
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <ExternalLink className="w-6 h-6 text-[var(--md-sys-color-tertiary)]" />
                                <MD3Text variant="headline-small">Resources</MD3Text>
                            </div>
                            <ul className="space-y-3">
                                <li>
                                    <a href="#" className="flex items-center gap-2 hover:underline text-[var(--md-sys-color-primary)]">
                                        Authentication Guide
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="flex items-center gap-2 hover:underline text-[var(--md-sys-color-primary)]">
                                        Rate Limiting Policies
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="flex items-center gap-2 hover:underline text-[var(--md-sys-color-primary)]">
                                        SDK Downloads (Python, Node.js)
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </MD3Card>
            </div>

            <MD3Text variant="headline-medium" className="mt-8 mb-4">Recent Activity</MD3Text>
            <MD3Card variant="outlined" className="p-0 overflow-hidden">
                <div className="p-8 text-center text-[var(--md-sys-color-on-surface-variant)]">
                    No recent API calls detected.
                </div>
                {/* We will hook this up to real data later */}
            </MD3Card>
        </div>
    )
}
