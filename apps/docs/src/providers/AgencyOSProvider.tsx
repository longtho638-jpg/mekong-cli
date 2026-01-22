/**
 * AgencyOSProvider - Root Provider for AgencyOS Agent Framework
 * 
 * Provides context for all AgencyOS hooks and components,
 * managing global agent state and communication.
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// Types
export interface Agent {
    id: string;
    name: string;
    status: 'idle' | 'working' | 'waiting' | 'completed';
    currentTask?: string;
    progress: number;
}

export interface AgencyOSContextValue {
    // Agents
    agents: Agent[];
    registerAgent: (agent: Agent) => void;
    updateAgent: (id: string, updates: Partial<Agent>) => void;
    removeAgent: (id: string) => void;

    // Global state
    isProcessing: boolean;
    setProcessing: (value: boolean) => void;

    // Notifications
    notifications: Notification[];
    addNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
    clearNotifications: () => void;
}

export interface Notification {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    createdAt: Date;
}

// Context
const AgencyOSContext = createContext<AgencyOSContextValue | null>(null);

// Hook
export function useAgencyOS(): AgencyOSContextValue {
    const context = useContext(AgencyOSContext);
    if (!context) {
        throw new Error('useAgencyOS must be used within an AgencyOSProvider');
    }
    return context;
}

// Provider Props
export interface AgencyOSProviderProps {
    children: ReactNode;
    initialAgents?: Agent[];
}

// Provider Component
export const AgencyOSProvider: React.FC<AgencyOSProviderProps> = ({
    children,
    initialAgents = [],
}) => {
    const [agents, setAgents] = useState<Agent[]>(initialAgents);
    const [isProcessing, setProcessing] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback(
        (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
            const notification: Notification = {
                id: `notif_${Date.now()}`,
                message,
                type,
                createdAt: new Date(),
            };
            setNotifications(prev => [...prev, notification]);

            // Auto-remove after 5 seconds
            const timerId = setTimeout(() => {
                setNotifications(prev =>
                    prev.filter(n => n.id !== notification.id)
                );
            }, 5000);

            return () => clearTimeout(timerId);
        },
        []
    );

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const registerAgent = useCallback((agent: Agent) => {
        setAgents(prev => {
            // Update existing if found, otherwise add new
            const existingIndex = prev.findIndex(a => a.id === agent.id);
            if (existingIndex >= 0) {
                const newAgents = [...prev];
                newAgents[existingIndex] = { ...prev[existingIndex], ...agent };
                return newAgents;
            }
            return [...prev, agent];
        });
        console.info(`[AgencyOS] Agent registered: ${agent.name}`);
    }, []);

    const value: AgencyOSContextValue = {
        agents,
        registerAgent,
        updateAgent,
        removeAgent,
        isProcessing,
        setProcessing,
        notifications,
        addNotification,
        clearNotifications,
    };

    return (
        <AgencyOSContext.Provider value={value}>
            {children}
        </AgencyOSContext.Provider>
    );
};

export default AgencyOSProvider;
