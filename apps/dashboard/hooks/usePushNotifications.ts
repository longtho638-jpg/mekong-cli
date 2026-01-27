import { useState, useEffect, useCallback } from 'react';

// VAPID Public Key - Should come from env
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export const usePushNotifications = () => {
    const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setPermission(Notification.permission);
            // Register SW if not already registered
            registerServiceWorker().then(() => checkSubscription());
        }
    }, []);

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            return registration;
        } catch (e) {
            console.error('Service Worker registration failed:', e);
        }
    };

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            if (sub) {
                setIsSubscribed(true);
                setSubscription(sub.toJSON() as PushSubscription);
            } else {
                setIsSubscribed(false);
            }
        } catch (e) {
            console.error("Error checking subscription:", e);
        }
    };

    const subscribeToPush = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!('serviceWorker' in navigator)) {
                throw new Error('Service Worker not supported');
            }

            if (!VAPID_PUBLIC_KEY) {
                throw new Error('VAPID Public Key not configured');
            }

            const registration = await navigator.serviceWorker.ready;

            // Request permission
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== 'granted') {
                throw new Error('Notification permission denied');
            }

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            const subscriptionJSON = sub.toJSON();

            // Send to backend via Next.js Proxy
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    endpoint: subscriptionJSON.endpoint,
                    p256dh: subscriptionJSON.keys?.p256dh,
                    auth: subscriptionJSON.keys?.auth,
                    user_agent: navigator.userAgent
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save subscription on server');
            }

            setIsSubscribed(true);
            setSubscription(subscriptionJSON as PushSubscription);
            return true;
        } catch (e: any) {
            console.error("Failed to subscribe:", e);
            setError(e.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const unsubscribeFromPush = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            if (sub) {
                // Send unsubscribe to backend
                await fetch('/api/push/unsubscribe', {
                   method: 'POST',
                   headers: {'Content-Type': 'application/json'},
                   body: JSON.stringify({ endpoint: sub.endpoint })
                });

                await sub.unsubscribe();
                setIsSubscribed(false);
                setSubscription(null);
            }
        } catch (e: any) {
            console.error("Failed to unsubscribe:", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        isSubscribed,
        subscription,
        permission,
        loading,
        error,
        subscribeToPush,
        unsubscribeFromPush
    };
};
