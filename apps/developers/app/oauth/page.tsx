'use client'

import { useState, useEffect } from 'react'
import { MD3Card } from '@/components/md3/MD3Card'
import { MD3Button } from '@/components/md3/MD3Button'
import { MD3Text } from '@/components/md3-dna/MD3Text'
import { Code, Plus, Trash2, Eye, Copy, RefreshCw, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

// Mock Data Types - in real app, import from lib/api-client
interface OAuthClient {
    client_id: string
    client_name: string
    redirect_uris: string[]
    scopes: string[]
    is_confidential: boolean
    created_at: string
    client_secret?: string // Only visible on creation
}

export default function OAuthAppsPage() {
    const [apps, setApps] = useState<OAuthClient[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [newAppSecret, setNewAppSecret] = useState<string | null>(null)

    // Form State
    const [newAppName, setNewAppName] = useState('')
    const [newAppRedirectUri, setNewAppRedirectUri] = useState('')
    const [showCreateForm, setShowCreateForm] = useState(false)

    // Simulate Fetching
    useEffect(() => {
        // In real app: fetch('/api/oauth/clients').then(...)
        // Since we don't have a list endpoint yet (only register), we'll mock initial state
        setTimeout(() => {
            setApps([
                {
                    client_id: 'cli_sample_123456789',
                    client_name: 'Sample App',
                    redirect_uris: ['http://localhost:3000/callback'],
                    scopes: ['read', 'write'],
                    is_confidential: true,
                    created_at: new Date().toISOString()
                }
            ])
            setLoading(false)
        }, 1000)
    }, [])

    const handleCreateApp = async () => {
        if (!newAppName || !newAppRedirectUri) return

        setIsCreating(true)

        // Simulate API Call to /api/oauth/register
        try {
            // Mock response
            const newClient: OAuthClient = {
                client_id: 'cli_' + Math.random().toString(36).substr(2, 12),
                client_name: newAppName,
                redirect_uris: [newAppRedirectUri],
                scopes: ['read', 'write'],
                is_confidential: true,
                created_at: new Date().toISOString(),
                client_secret: 'sec_' + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)
            }

            // In real implementation:
            /*
            const res = await fetch('/api/oauth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_name: newAppName,
                    redirect_uris: [newAppRedirectUri],
                    scopes: ['read', 'write'],
                    is_confidential: true
                })
            })
            const newClient = await res.json()
            */

            setApps([newClient, ...apps])
            setNewAppSecret(newClient.client_secret || null)
            setShowCreateForm(false)
            setNewAppName('')
            setNewAppRedirectUri('')
        } catch (error) {
            console.error("Failed to create app", error)
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <MD3Text variant="display-small">OAuth Apps</MD3Text>
                    <MD3Text variant="body-large" className="text-[var(--md-sys-color-on-surface-variant)]">
                        Create and manage OAuth 2.0 applications for integrations.
                    </MD3Text>
                </div>
                {!showCreateForm && (
                    <MD3Button variant="filled" onClick={() => setShowCreateForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        New App
                    </MD3Button>
                )}
            </div>

            {newAppSecret && (
                <MD3Card variant="filled" className="p-6 border border-green-500/50 bg-green-500/10">
                    <MD3Text variant="headline-small" className="text-green-500 mb-2">App Created Successfully</MD3Text>
                    <MD3Text variant="body-medium" className="mb-4">
                        Please save your Client Secret now. It will <strong>never</strong> be shown again.
                    </MD3Text>

                    <div className="space-y-4">
                        <div>
                            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1">Client ID</div>
                            <div className="flex items-center gap-2 bg-black/20 p-2 rounded font-mono text-sm">
                                <span className="flex-1">{apps[0].client_id}</span>
                                <button onClick={() => navigator.clipboard.writeText(apps[0].client_id)} className="p-1 hover:bg-white/10 rounded">
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1">Client Secret</div>
                            <div className="flex items-center gap-2 bg-black/20 p-2 rounded font-mono text-sm">
                                <span className="flex-1 break-all text-green-400">{newAppSecret}</span>
                                <button onClick={() => navigator.clipboard.writeText(newAppSecret)} className="p-1 hover:bg-white/10 rounded">
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <MD3Button variant="text" onClick={() => setNewAppSecret(null)}>I have saved it</MD3Button>
                    </div>
                </MD3Card>
            )}

            {showCreateForm && (
                <MD3Card variant="outlined" className="p-6">
                    <MD3Text variant="title-large" className="mb-4">Register New Application</MD3Text>
                    <div className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium mb-1">App Name</label>
                            <input
                                type="text"
                                className="w-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] rounded p-2 text-[var(--md-sys-color-on-surface)]"
                                placeholder="My Integration"
                                value={newAppName}
                                onChange={(e) => setNewAppName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Redirect URI</label>
                            <input
                                type="url"
                                className="w-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] rounded p-2 text-[var(--md-sys-color-on-surface)]"
                                placeholder="https://myapp.com/callback"
                                value={newAppRedirectUri}
                                onChange={(e) => setNewAppRedirectUri(e.target.value)}
                            />
                            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                                Where we should redirect users after they authorize your app.
                            </p>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <MD3Button variant="text" onClick={() => setShowCreateForm(false)}>Cancel</MD3Button>
                            <MD3Button variant="filled" onClick={handleCreateApp} disabled={isCreating || !newAppName || !newAppRedirectUri}>
                                {isCreating ? 'Registering...' : 'Register App'}
                            </MD3Button>
                        </div>
                    </div>
                </MD3Card>
            )}

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-10">Loading apps...</div>
                ) : apps.length === 0 && !showCreateForm ? (
                    <div className="text-center py-10 text-[var(--md-sys-color-on-surface-variant)]">
                        No OAuth apps found. Create one to get started.
                    </div>
                ) : (
                    apps.map((app) => (
                        <MD3Card key={app.client_id} variant="outlined" className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
                                        <Code className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <MD3Text variant="title-medium">{app.client_name}</MD3Text>
                                            {app.is_confidential && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                                                    Confidential
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 space-y-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-[var(--md-sys-color-on-surface-variant)] w-20">Client ID:</span>
                                                <span className="font-mono bg-[var(--md-sys-color-surface-variant)] px-1.5 rounded">{app.client_id}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-[var(--md-sys-color-on-surface-variant)] w-20">Redirect:</span>
                                                <span className="font-mono text-[var(--md-sys-color-on-surface-variant)]">{app.redirect_uris[0]}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <button className="p-2 hover:bg-red-500/20 rounded text-red-400" title="Delete App">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </MD3Card>
                    ))
                )}
            </div>
        </div>
    )
}
