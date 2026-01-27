import useSWR, { useSWRConfig } from 'swr'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

// Use relative URL for backend API via Next.js rewrites or proxy
const API_BASE = '/api/revenue'

export function useRevenueStats(tenantId?: string) {
  const { mutate } = useSWRConfig()
  const key = tenantId ? `${API_BASE}/metrics?tenant_id=${tenantId}` : `${API_BASE}/metrics`

  const { data, error, isLoading } = useSWR(
    key,
    fetcher,
    { refreshInterval: 60000 } // Refresh every minute
  )

  // Real-time subscription for subscriptions changes (affects MRR, ARR, Churn, LTV)
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('revenue-dashboard-subs')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'subscriptions',
          filter: tenantId ? `tenant_id=eq.${tenantId}` : undefined
        },
        () => {
          console.log('Real-time subscription update received')
          mutate(key)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, key, mutate])

  return {
    stats: data,
    isLoading,
    isError: error
  }
}

export function useRevenueTrend(tenantId?: string, days: number = 30) {
  const { data, error, isLoading } = useSWR(
    tenantId ? `${API_BASE}/trend?tenant_id=${tenantId}&days=${days}` : `${API_BASE}/trend?days=${days}`,
    fetcher
  )

  return {
    trend: data,
    isLoading,
    isError: error
  }
}

export function useRecentTransactions(tenantId?: string) {
  const { mutate } = useSWRConfig()
  const key = tenantId ? `${API_BASE}/payments/recent?tenant_id=${tenantId}` : `${API_BASE}/payments/recent`

  const { data, error, isLoading } = useSWR(
    key,
    fetcher
  )

  // Real-time subscription for payments
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('revenue-dashboard-payments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
          filter: tenantId ? `tenant_id=eq.${tenantId}` : undefined
        },
        (payload) => {
          console.log('Real-time payment received:', payload)
          mutate(key)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, key, mutate])

  return {
    transactions: data,
    isLoading,
    isError: error
  }
}
