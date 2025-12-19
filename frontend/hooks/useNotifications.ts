'use client'
import { useState, useEffect, useCallback } from 'react'

export interface Notification {
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    timestamp: number
    read: boolean
    icon?: string
    link?: string
}

const STORAGE_KEY = 'agencyos-notifications'
const MAX_NOTIFICATIONS = 20

// Sample notifications for demo
const SAMPLE_NOTIFICATIONS: Omit<Notification, 'id' | 'timestamp' | 'read'>[] = [
    { title: 'New Deal', message: 'Startup X entered pipeline - $500K seed round', type: 'success', icon: '🎯' },
    { title: 'War Room Alert', message: 'MRR target 95% achieved', type: 'info', icon: '🏯' },
    { title: 'Security Alert', message: 'New login from unknown device', type: 'warning', icon: '🔐' },
    { title: 'AgentOps', message: 'Scout completed market analysis', type: 'success', icon: '🤖' },
    { title: 'Binh Pháp', message: 'Chapter 3 training complete', type: 'info', icon: '📜' },
]

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                setNotifications(JSON.parse(stored))
            } else {
                // Add sample notifications for demo
                const samples = SAMPLE_NOTIFICATIONS.map((n, i) => ({
                    ...n,
                    id: `sample-${i}`,
                    timestamp: Date.now() - (i * 60000 * (i + 1)), // Stagger times
                    read: i > 2, // First 3 unread
                }))
                setNotifications(samples)
            }
        } catch (e) {
            console.error('Failed to load notifications', e)
        }
        setIsLoaded(true)
    }, [])

    // Save to localStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
        }
    }, [notifications, isLoaded])

    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: Notification = {
            ...notification,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            read: false,
        }
        setNotifications(prev => [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS))
        return newNotification
    }, [])

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
    }, [])

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }, [])

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }, [])

    const clearAll = useCallback(() => {
        setNotifications([])
    }, [])

    const unreadCount = notifications.filter(n => !n.read).length

    return {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
    }
}
