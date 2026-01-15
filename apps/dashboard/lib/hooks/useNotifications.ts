'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';

/**
 * 🔔 Notifications Center Hook
 * 
 * Inspired by Frappe Framework Notification System
 * Centralized notification management
 */

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'mention' | 'reminder';
export type NotificationChannel = 'in-app' | 'email' | 'push' | 'sms';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    entityType?: string;
    entityId?: string;
    isRead: boolean;
    channels: NotificationChannel[];
    createdAt: string;
    readAt?: string;
}

export interface NotificationPreferences {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
    digest: 'instant' | 'hourly' | 'daily' | 'weekly';
    quietHoursStart?: string;
    quietHoursEnd?: string;
    mutedTypes: NotificationType[];
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>(getDemoNotifications());
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        inApp: true,
        email: true,
        push: true,
        sms: false,
        digest: 'instant',
        mutedTypes: [],
    });

    // Unread count
    const unreadCount = useMemo(() =>
        notifications.filter(n => !n.isRead).length, [notifications]);

    // Add notification
    const addNotification = useCallback((
        type: NotificationType,
        title: string,
        message: string,
        options?: {
            link?: string;
            entityType?: string;
            entityId?: string;
            channels?: NotificationChannel[];
        }
    ) => {
        const notification: Notification = {
            id: crypto.randomUUID(),
            type,
            title,
            message,
            link: options?.link,
            entityType: options?.entityType,
            entityId: options?.entityId,
            isRead: false,
            channels: options?.channels || ['in-app'],
            createdAt: new Date().toISOString(),
        };

        setNotifications(prev => [notification, ...prev]);
        return notification;
    }, []);

    // Mark as read
    const markAsRead = useCallback((notificationId: string) => {
        setNotifications(prev => prev.map(n =>
            n.id === notificationId
                ? { ...n, isRead: true, readAt: new Date().toISOString() }
                : n
        ));
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(() => {
        const now = new Date().toISOString();
        setNotifications(prev => prev.map(n =>
            n.isRead ? n : { ...n, isRead: true, readAt: now }
        ));
    }, []);

    // Delete notification
    const deleteNotification = useCallback((notificationId: string) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }, []);

    // Clear all
    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    // Update preferences
    const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
        setPreferences(prev => ({ ...prev, ...updates }));
    }, []);

    // Filter by type
    const getByType = useCallback((type: NotificationType) =>
        notifications.filter(n => n.type === type), [notifications]);

    // Toast helper
    const toast = useCallback((type: NotificationType, message: string, title?: string) => {
        return addNotification(type, title || type.toUpperCase(), message);
    }, [addNotification]);

    return {
        notifications,
        unreadCount,
        preferences,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        updatePreferences,
        getByType,
        toast,
    };
}

// Demo notifications
function getDemoNotifications(): Notification[] {
    return [
        { id: '1', type: 'success', title: 'Invoice Paid', message: 'Invoice #INV-2024-042 has been paid by Acme Corp', link: '/invoices/42', entityType: 'invoice', entityId: '42', isRead: false, channels: ['in-app', 'email'], createdAt: '2026-01-04T10:30:00Z' },
        { id: '2', type: 'mention', title: 'You were mentioned', message: 'John mentioned you in Project Alpha discussion', link: '/projects/alpha', isRead: false, channels: ['in-app'], createdAt: '2026-01-04T09:15:00Z' },
        { id: '3', type: 'reminder', title: 'Meeting in 30 minutes', message: 'Client call with Beta Corp at 11:00 AM', isRead: true, readAt: '2026-01-04T10:00:00Z', channels: ['in-app', 'push'], createdAt: '2026-01-04T10:00:00Z' },
        { id: '4', type: 'warning', title: 'Subscription Expiring', message: 'Figma subscription expires in 7 days', link: '/assets/subscriptions', isRead: false, channels: ['in-app', 'email'], createdAt: '2026-01-03T14:00:00Z' },
    ];
}

export default useNotifications;
