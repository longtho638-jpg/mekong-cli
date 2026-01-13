/**
 * useDashboardAction - AgencyOS Dashboard Actions Hook
 * 
 * Enables agents to interact with dashboard UI elements,
 * trigger actions, and update widgets dynamically.
 */

import { useState, useCallback } from 'react';

export interface DashboardAction {
    id: string;
    name: string;
    type: 'navigate' | 'refresh' | 'update' | 'notify' | 'custom';
    payload?: Record<string, unknown>;
    executedAt: Date;
    success: boolean;
    result?: unknown;
}

export interface UseDashboardActionOptions {
    onActionExecuted?: (action: DashboardAction) => void;
}

export interface UseDashboardActionReturn {
    lastAction: DashboardAction | null;
    actionHistory: DashboardAction[];
    navigate: (path: string) => Promise<boolean>;
    refreshWidget: (widgetId: string) => Promise<boolean>;
    updateWidget: (widgetId: string, data: Record<string, unknown>) => Promise<boolean>;
    showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    executeCustomAction: (name: string, payload: Record<string, unknown>) => Promise<unknown>;
}

export function useDashboardAction(options: UseDashboardActionOptions = {}): UseDashboardActionReturn {
    const { onActionExecuted } = options;
    const [lastAction, setLastAction] = useState<DashboardAction | null>(null);
    const [actionHistory, setActionHistory] = useState<DashboardAction[]>([]);

    const recordAction = useCallback((action: DashboardAction) => {
        setLastAction(action);
        setActionHistory(prev => [...prev.slice(-49), action]); // Keep last 50
        onActionExecuted?.(action);
    }, [onActionExecuted]);

    const navigate = useCallback(async (path: string): Promise<boolean> => {
        try {
            // In browser context, use window.location
            if (typeof window !== 'undefined') {
                window.location.href = path;
            }
            const action: DashboardAction = {
                id: `action_${Date.now()}`,
                name: 'navigate',
                type: 'navigate',
                payload: { path },
                executedAt: new Date(),
                success: true,
            };
            recordAction(action);
            return true;
        } catch (error) {
            console.error('[AgencyOS:DashboardAction] Navigate failed:', error);
            return false;
        }
    }, [recordAction]);

    const refreshWidget = useCallback(async (widgetId: string): Promise<boolean> => {
        try {
            // Dispatch custom event for widget refresh
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('agencyos:refresh-widget', {
                    detail: { widgetId },
                }));
            }
            const action: DashboardAction = {
                id: `action_${Date.now()}`,
                name: 'refreshWidget',
                type: 'refresh',
                payload: { widgetId },
                executedAt: new Date(),
                success: true,
            };
            recordAction(action);
            return true;
        } catch (error) {
            console.error('[AgencyOS:DashboardAction] Refresh failed:', error);
            return false;
        }
    }, [recordAction]);

    const updateWidget = useCallback(async (widgetId: string, data: Record<string, unknown>): Promise<boolean> => {
        try {
            // Dispatch custom event for widget update
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('agencyos:update-widget', {
                    detail: { widgetId, data },
                }));
            }
            const action: DashboardAction = {
                id: `action_${Date.now()}`,
                name: 'updateWidget',
                type: 'update',
                payload: { widgetId, data },
                executedAt: new Date(),
                success: true,
            };
            recordAction(action);
            return true;
        } catch (error) {
            console.error('[AgencyOS:DashboardAction] Update failed:', error);
            return false;
        }
    }, [recordAction]);

    const showNotification = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        // Dispatch custom event for notification
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('agencyos:notification', {
                detail: { message, type },
            }));
        }
        const action: DashboardAction = {
            id: `action_${Date.now()}`,
            name: 'showNotification',
            type: 'notify',
            payload: { message, type },
            executedAt: new Date(),
            success: true,
        };
        recordAction(action);
    }, [recordAction]);

    const executeCustomAction = useCallback(async (name: string, payload: Record<string, unknown>): Promise<unknown> => {
        try {
            // Dispatch custom event for custom action
            if (typeof window !== 'undefined') {
                const event = new CustomEvent('agencyos:custom-action', {
                    detail: { name, payload },
                });
                window.dispatchEvent(event);
            }
            const action: DashboardAction = {
                id: `action_${Date.now()}`,
                name,
                type: 'custom',
                payload,
                executedAt: new Date(),
                success: true,
                result: payload,
            };
            recordAction(action);
            return payload;
        } catch (error) {
            console.error('[AgencyOS:DashboardAction] Custom action failed:', error);
            return null;
        }
    }, [recordAction]);

    return {
        lastAction,
        actionHistory,
        navigate,
        refreshWidget,
        updateWidget,
        showNotification,
        executeCustomAction,
    };
}

export default useDashboardAction;
