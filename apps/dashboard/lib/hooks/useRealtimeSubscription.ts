'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * 🔴 Supabase Real-time Subscription Hook
 *
 * Subscribe to database changes and get live updates
 */

/** Generic database record type */
type DatabaseRecord = Record<string, unknown>

interface UseRealtimeOptions<T extends DatabaseRecord = DatabaseRecord> {
  table: string
  onInsert?: (data: T) => void
  onUpdate?: (data: T) => void
  onDelete?: (data: T) => void
}

export function useRealtimeSubscription<T extends DatabaseRecord = DatabaseRecord>({
  table,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeOptions<T>) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<{ type: string; data: T } | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload: RealtimePostgresChangesPayload<T>) => {
          const newData = payload.new as T
          const oldData = payload.old as T

          setLastEvent({
            type: payload.eventType,
            data: newData || oldData,
          })

          if (payload.eventType === 'INSERT') onInsert?.(newData)
          if (payload.eventType === 'UPDATE') onUpdate?.(newData)
          if (payload.eventType === 'DELETE') onDelete?.(oldData)
        }
      )
      .subscribe(status => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table])

  return { isConnected, lastEvent }
}

/**
 * 🔴 Real-time Presence Hook
 */
export function useRealtimePresence(roomId: string, userData: Record<string, unknown>) {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`presence-${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineUsers(Object.values(state).flat() as Record<string, unknown>[])
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await channel.track(userData)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  return { onlineUsers, count: onlineUsers.length }
}

export default useRealtimeSubscription
