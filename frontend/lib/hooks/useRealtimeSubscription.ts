'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * 🔴 Supabase Real-time Subscription Hook
 * 
 * Subscribe to database changes and get live updates
 */

interface UseRealtimeOptions {
    table: string;
    onInsert?: (data: any) => void;
    onUpdate?: (data: any) => void;
    onDelete?: (data: any) => void;
}

export function useRealtimeSubscription({
    table,
    onInsert,
    onUpdate,
    onDelete,
}: UseRealtimeOptions) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<{ type: string; data: any } | null>(null);

    useEffect(() => {
        const supabase = createClient();

        const channel = supabase
            .channel(`realtime-${table}`)
            .on(
                'postgres_changes' as any,
                { event: '*', schema: 'public', table },
                (payload: any) => {
                    setLastEvent({
                        type: payload.eventType,
                        data: payload.new || payload.old,
                    });

                    if (payload.eventType === 'INSERT') onInsert?.(payload.new);
                    if (payload.eventType === 'UPDATE') onUpdate?.(payload.new);
                    if (payload.eventType === 'DELETE') onDelete?.(payload.old);
                }
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
            });

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table]);

    return { isConnected, lastEvent };
}

/**
 * 🔴 Real-time Presence Hook
 */
export function useRealtimePresence(roomId: string, userData: Record<string, any>) {
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

    useEffect(() => {
        const supabase = createClient();

        const channel = supabase.channel(`presence-${roomId}`)
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                setOnlineUsers(Object.values(state).flat());
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track(userData);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    return { onlineUsers, count: onlineUsers.length };
}

export default useRealtimeSubscription;
