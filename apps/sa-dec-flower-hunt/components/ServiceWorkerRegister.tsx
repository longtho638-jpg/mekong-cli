"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/service-worker.js')
                    .then((registration) => {
                        console.log('[PWA] Service Worker registered:', registration.scope);

                        // Check for updates every 60 seconds
                        setInterval(() => {
                            registration.update();
                        }, 60000);
                    })
                    .catch((error) => {
                        console.error('[PWA] Service Worker registration failed:', error);
                    });
            });
        }
    }, []);

    return null; // This component doesn't render anything
}
