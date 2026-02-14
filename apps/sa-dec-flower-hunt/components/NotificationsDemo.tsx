"use client";

import { useEffect } from "react";
import { simulateSmartNotifications } from "@/lib/notifications";

export function NotificationsDemo() {
    useEffect(() => {
        // simulateSmartNotifications();
    }, []);

    return null; // This component handles side effects only
}
