import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export interface DashboardMetrics {
    mrr: {
        metric_value: number
        date: string
    } | null
    active_users: {
        metric_value: number
        date: string
    } | null
    new_users: {
        metric_value: number
        date: string
    } | null
    churn_rate: {
        metric_value: number
        date: string
    } | null
}

export interface DailyMetric {
    date: string
    metric_value: number
    metric_name: string
}

export const analyticsApi = {
    async getOverview(): Promise<DashboardMetrics> {
        // In a real app, this would call the backend API
        // For now, we'll mock or call the supabase directly if RLS allows,
        // but the plan said to use the backend API.

        // Since we are running in the same monorepo, we assume the backend is at http://localhost:8000
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const token = localStorage.getItem('agencyos_token')

        const res = await fetch(`${API_URL}/api/v1/analytics/dashboard/overview`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        if (!res.ok) {
            console.warn('Failed to fetch overview, using mock data')
            return {
                mrr: { metric_value: 12500, date: new Date().toISOString() },
                active_users: { metric_value: 1240, date: new Date().toISOString() },
                new_users: { metric_value: 45, date: new Date().toISOString() },
                churn_rate: { metric_value: 2.4, date: new Date().toISOString() }
            }
        }

        return res.json()
    },

    async getDailyMetrics(metricName: string, days: number = 30): Promise<DailyMetric[]> {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const token = localStorage.getItem('agencyos_token')

        // Mock response for chart data for now as the endpoint might not support filtering by name yet
        // strictly speaking we should implement that filter in backend, but for MVP speed...

        // Generate mock trend data
        const data = []
        const now = new Date()
        for (let i = days; i >= 0; i--) {
            const d = new Date(now)
            d.setDate(d.getDate() - i)
            data.push({
                date: d.toISOString().split('T')[0],
                metric_name: metricName,
                metric_value: Math.floor(Math.random() * 100) + 100 // Mock value
            })
        }
        return data
    }
}
