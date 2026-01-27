'use client'

import { useState, useEffect } from 'react'
import { MD3Card } from '@/components/md3/MD3Card'
import { MD3Button } from '@/components/md3/MD3Button'
import { MD3Text } from '@/components/md3-dna/MD3Text'
import { Webhook, Plus, Trash2, Activity, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { developerApi } from '@/lib/developer-api'
import { WebhookConfigResponse, ApiKeyResponse } from '@/lib/types/developer-types'

export default function WebhooksPage() {
    const [webhooks, setWebhooks] = useState<WebhookConfigResponse[]>([])
    const [apiKeys, setApiKeys] = useState<ApiKeyResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [newUrl, setNewUrl] = useState('')
    const [selectedEvents, setSelectedEvents] = useState<string[]>([])
    const [selectedKeyId, setSelectedKeyId] = useState<string>('')

    const availableEvents = [
        'subscription.created',
        'subscription.updated',
        'subscription.cancelled',
        'invoice.paid',
        'invoice.failed',
        'usage.threshold_reached'
    ]

    const fetchData = async () => {
        try {
            setLoading(true)
            const [hooksData, keysData] = await Promise.all([
                developerApi.listWebhooks(),
                developerApi.listApiKeys()
            ])
            setWebhooks(hooksData)
            setApiKeys(keysData)
            if (keysData.length > 0) {
                setSelectedKeyId(keysData[0].id)
            }
        } catch (err) {
            console.error(err)
            setError('Failed to load webhooks data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleCreate = async () => {
        if (!selectedKeyId) {
            setError('Please select an API Key to associate with this webhook')
            return
        }

        setIsCreating(true)
        setError(null)
        try {
            const newHook = await developerApi.createWebhook({
                url: newUrl,
                events: selectedEvents.length > 0 ? selectedEvents : ['*']
            }, selectedKeyId)

            setWebhooks([newHook, ...webhooks])
            setIsCreating(false)
            setNewUrl('')
            setSelectedEvents([])
        } catch (err) {
            console.error(err)
            setError('Failed to create webhook')
        } finally {
            setIsCreating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this webhook?')) return

        try {
            await developerApi.deleteWebhook(id)
            setWebhooks(webhooks.filter(w => w.id !== id))
        } catch (err) {
            console.error(err)
            setError('Failed to delete webhook')
        }
    }

    const toggleEvent = (event: string) => {
        if (selectedEvents.includes(event)) {
            setSelectedEvents(selectedEvents.filter(e => e !== event))
        } else {
            setSelectedEvents([...selectedEvents, event])
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <MD3Text variant="display-small">Webhooks</MD3Text>
                    <MD3Text variant="body-large" className="text-[var(--md-sys-color-on-surface-variant)]">
                        Receive real-time notifications about events in your account.
                    </MD3Text>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 text-red-500 rounded border border-red-500/20">
                    {error}
                </div>
            )}

            {/* Create Form */}
            <MD3Card variant="filled" className="p-6">
                <MD3Text variant="title-large" className="mb-4">Add Endpoint</MD3Text>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Associated API Key</label>
                        <select
                            className="w-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded p-2"
                            value={selectedKeyId}
                            onChange={(e) => setSelectedKeyId(e.target.value)}
                            disabled={apiKeys.length === 0}
                        >
                            {apiKeys.length === 0 ? (
                                <option value="">No API Keys found (Create one first)</option>
                            ) : (
                                apiKeys.map(key => (
                                    <option key={key.id} value={key.id}>
                                        {key.name} ({key.prefix}...)
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Endpoint URL</label>
                        <input
                            type="url"
                            placeholder="https://api.yoursite.com/webhooks"
                            className="w-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded p-2"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Events to Subscribe</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {availableEvents.map(event => (
                                <label key={event} className="flex items-center space-x-2 cursor-pointer p-2 border border-[var(--md-sys-color-outline-variant)] rounded hover:bg-[var(--md-sys-color-surface-container-high)]">
                                    <input
                                        type="checkbox"
                                        checked={selectedEvents.includes(event)}
                                        onChange={() => toggleEvent(event)}
                                        className="rounded border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)]"
                                    />
                                    <span className="text-sm">{event}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <MD3Button
                            variant="filled"
                            disabled={!newUrl || isCreating || apiKeys.length === 0}
                            onClick={handleCreate}
                        >
                            {isCreating ? 'Adding...' : 'Add Endpoint'}
                        </MD3Button>
                    </div>
                </div>
            </MD3Card>

            {/* List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-10">Loading webhooks...</div>
                ) : webhooks.length === 0 ? (
                    <div className="text-center py-10 text-[var(--md-sys-color-on-surface-variant)]">
                        No webhooks configured.
                    </div>
                ) : (
                    webhooks.map((hook) => (
                        <WebhookRow key={hook.id} webhook={hook} onDelete={handleDelete} />
                    ))
                )}
            </div>
        </div>
    )
}

function WebhookRow({ webhook, onDelete }: { webhook: WebhookConfigResponse, onDelete: (id: string) => void }) {
    return (
        <MD3Card variant="outlined" className="p-4">
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]">
                        <Webhook className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <MD3Text variant="title-medium" className="font-mono">{webhook.url}</MD3Text>
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs uppercase">
                                {webhook.status}
                            </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {webhook.events.map(e => (
                                <span key={e} className="px-2 py-1 rounded bg-[var(--md-sys-color-surface-container)] text-xs font-mono border border-[var(--md-sys-color-outline-variant)]">
                                    {e}
                                </span>
                            ))}
                        </div>
                        <div className="mt-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                            Secret: <span className="font-mono blur-sm hover:blur-none transition-all cursor-pointer">{webhook.secret}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="p-2 hover:bg-red-500/20 rounded text-red-400"
                        onClick={() => onDelete(webhook.id)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Note: In a real app we'd fetch delivery logs for this webhook here */}
        </MD3Card>
    )
}
