'use client'

import React, { Suspense } from 'react'
import { CommandCenter, StatusLine } from '@/components/CommandCenter'
import { UnifiedBridgeWidget } from '@/components/antigravity'
import { RevenueOverview } from '@/components/dashboard/RevenueOverview'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function DashboardPage() {
    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Header with Status and Theme Toggle */}
            <div className="flex items-center justify-between gap-4">
                <StatusLine />
                <div className="hidden md:block">
                    <ThemeToggle />
                </div>
            </div>

            <Suspense fallback={<DashboardSkeleton />}>
                {/* Revenue Overview Cards */}
                <RevenueOverview />

                {/* Quick Actions */}
                <QuickActions />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Command Center - Takes 2 columns */}
                    <div className="lg:col-span-2 space-y-6">
                        <CommandCenter />
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        <UnifiedBridgeWidget />
                        <RecentActivity />
                    </div>
                </div>
            </Suspense>
        </div>
    )
}
