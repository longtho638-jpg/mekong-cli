/**
 * useApprovalGate - AgencyOS Human Approval Hook
 * 
 * Implements human-in-the-loop approval flows for
 * critical actions like deployments, commits, and sensitive operations.
 */

import { useState, useCallback } from 'react';

export interface ApprovalRequest {
    id: string;
    action: string;
    description: string;
    details?: Record<string, unknown>;
    createdAt: Date;
    status: 'pending' | 'approved' | 'rejected';
    respondedAt?: Date;
}

export interface UseApprovalGateOptions {
    onApprove?: (request: ApprovalRequest) => void;
    onReject?: (request: ApprovalRequest) => void;
    autoExpireMs?: number;
}

export interface UseApprovalGateReturn {
    pendingRequest: ApprovalRequest | null;
    history: ApprovalRequest[];
    requestApproval: (action: string, description: string, details?: Record<string, unknown>) => Promise<boolean>;
    approve: () => void;
    reject: () => void;
    clearHistory: () => void;
}

export function useApprovalGate(options: UseApprovalGateOptions = {}): UseApprovalGateReturn {
    const { onApprove, onReject } = options;
    const [pendingRequest, setPendingRequest] = useState<ApprovalRequest | null>(null);
    const [history, setHistory] = useState<ApprovalRequest[]>([]);
    const [resolver, setResolver] = useState<((approved: boolean) => void) | null>(null);

    const requestApproval = useCallback(
        (action: string, description: string, details?: Record<string, unknown>): Promise<boolean> => {
            return new Promise((resolve) => {
                const request: ApprovalRequest = {
                    id: `approval_${Date.now()}`,
                    action,
                    description,
                    details,
                    createdAt: new Date(),
                    status: 'pending',
                };
                setPendingRequest(request);
                setResolver(() => resolve);
                console.log(`[AgencyOS:ApprovalGate] Requesting approval: ${action}`);
            });
        },
        []
    );

    const approve = useCallback(() => {
        if (pendingRequest && resolver) {
            const approved: ApprovalRequest = {
                ...pendingRequest,
                status: 'approved',
                respondedAt: new Date(),
            };
            setHistory(prev => [...prev, approved]);
            setPendingRequest(null);
            resolver(true);
            setResolver(null);
            onApprove?.(approved);
            console.log(`[AgencyOS:ApprovalGate] Approved: ${approved.action}`);
        }
    }, [pendingRequest, resolver, onApprove]);

    const reject = useCallback(() => {
        if (pendingRequest && resolver) {
            const rejected: ApprovalRequest = {
                ...pendingRequest,
                status: 'rejected',
                respondedAt: new Date(),
            };
            setHistory(prev => [...prev, rejected]);
            setPendingRequest(null);
            resolver(false);
            setResolver(null);
            onReject?.(rejected);
            console.log(`[AgencyOS:ApprovalGate] Rejected: ${rejected.action}`);
        }
    }, [pendingRequest, resolver, onReject]);

    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    return {
        pendingRequest,
        history,
        requestApproval,
        approve,
        reject,
        clearHistory,
    };
}

export default useApprovalGate;
