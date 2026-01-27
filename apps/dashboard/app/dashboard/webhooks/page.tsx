'use client'

import React from 'react'
import { WebhookManager } from '@/components/webhooks/WebhookManager'

export default function WebhooksPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Webhook Management</h2>
                    <p className="text-neutral-400">Manage incoming events and outgoing endpoints</p>
                </div>
            </div>

            <WebhookManager />
        </div>
    )
}
