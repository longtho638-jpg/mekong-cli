'use client'

import { useState, useEffect } from 'react'
import { MD3Card } from '@/components/md3/MD3Card'
import { MD3Button } from '@/components/md3/MD3Button'
import { MD3Text } from '@/components/md3-dna/MD3Text'
import { Key, Plus, Trash2, RefreshCw, Copy, Check, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'
import { developerApi } from '@/lib/developer-api'
import { ApiKeyResponse } from '@/lib/types/developer-types'

export default function ApiKeysPage() {
    const [keys, setKeys] = useState<ApiKeyResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [newKey, setNewKey] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchKeys = async () => {
        try {
            setLoading(true)
            const data = await developerApi.listApiKeys()
            setKeys(data)
        } catch (err) {
            console.error(err)
            setError('Failed to load API keys')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchKeys()
    }, [])

    const handleCreateKey = async () => {
        setIsCreating(true)
        setError(null)
        try {
            const createdKey = await developerApi.createApiKey({
                name: `API Key ${keys.length + 1}`,
                scopes: ['full_access'] // Default scope for now
            })
            setKeys([createdKey, ...keys])
            if (createdKey.key) {
                setNewKey(createdKey.key)
            }
        } catch (err) {
            console.error(err)
            setError('Failed to create API key')
        } finally {
            setIsCreating(false)
        }
    }

    const handleRevoke = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this key? This action cannot be undone.')) return

        try {
            await developerApi.revokeApiKey(id)
            setKeys(keys.map(k => k.id === id ? { ...k, status: 'revoked' } : k))
        } catch (err) {
            console.error(err)
            setError('Failed to revoke key')
        }
    }

    const handleRotate = async (id: string) => {
         if (!confirm('Are you sure you want to rotate this key? The old key will stop working immediately.')) return

         try {
             const updatedKey = await developerApi.rotateApiKey(id)
             setKeys(keys.map(k => k.id === id ? updatedKey : k))
             if (updatedKey.key) {
                 setNewKey(updatedKey.key)
             }
         } catch (err) {
             console.error(err)
             setError('Failed to rotate key')
         }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <MD3Text variant="display-small">API Keys</MD3Text>
                    <MD3Text variant="body-large" className="text-[var(--md-sys-color-on-surface-variant)]">
                        Manage authentication keys for your applications.
                    </MD3Text>
                </div>
                <MD3Button variant="filled" onClick={handleCreateKey} disabled={isCreating}>
                    <Plus className="w-4 h-4 mr-2" />
                    {isCreating ? 'Creating...' : 'Create New Key'}
                </MD3Button>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 text-red-500 rounded border border-red-500/20">
                    {error}
                </div>
            )}

            {newKey && (
                <MD3Card variant="filled" className="p-6 border border-green-500/50 bg-green-500/10">
                    <MD3Text variant="headline-small" className="text-green-500 mb-2">Key Created Successfully</MD3Text>
                    <MD3Text variant="body-medium" className="mb-4">
                        This is the only time you will see the full key. Please copy it now.
                    </MD3Text>
                    <div className="flex items-center gap-2 bg-black/20 p-3 rounded font-mono text-sm">
                        <span className="flex-1 break-all">{newKey}</span>
                        <button
                            onClick={() => navigator.clipboard.writeText(newKey)}
                            className="p-2 hover:bg-white/10 rounded"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <MD3Button variant="text" onClick={() => setNewKey(null)}>Done</MD3Button>
                    </div>
                </MD3Card>
            )}

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-10">Loading keys...</div>
                ) : keys.length === 0 ? (
                    <div className="text-center py-10 text-[var(--md-sys-color-on-surface-variant)]">
                        No API keys found. Create one to get started.
                    </div>
                ) : (
                    keys.map((key) => (
                        <ApiKeyRow key={key.id} apiKey={key} onRevoke={handleRevoke} onRotate={handleRotate} />
                    ))
                )}
            </div>
        </div>
    )
}

function ApiKeyRow({ apiKey, onRevoke, onRotate }: { apiKey: ApiKeyResponse, onRevoke: (id: string) => void, onRotate: (id: string) => void }) {
    return (
        <MD3Card variant="outlined" className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${apiKey.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    <Key className="w-6 h-6" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <MD3Text variant="title-medium">{apiKey.name}</MD3Text>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            apiKey.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                            {apiKey.status.toUpperCase()}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                        <span className="font-mono">{apiKey.prefix}••••••••••••••••</span>
                        <span>Created: {format(new Date(apiKey.created_at), 'MMM d, yyyy')}</span>
                        {apiKey.last_used_at && (
                            <span>Last used: {format(new Date(apiKey.last_used_at), 'MMM d, HH:mm')}</span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {apiKey.status === 'active' && (
                    <>
                        <button
                            onClick={() => onRotate(apiKey.id)}
                            className="p-2 hover:bg-[var(--md-sys-color-surface-container-high)] rounded text-[var(--md-sys-color-on-surface-variant)]"
                            title="Rotate Key"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onRevoke(apiKey.id)}
                            className="p-2 hover:bg-red-500/20 rounded text-red-400"
                            title="Revoke Key"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
        </MD3Card>
    )
}
