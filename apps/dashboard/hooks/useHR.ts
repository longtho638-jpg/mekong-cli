/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
/**
 * React Hooks for HR Module
 * Wire UI to API endpoints
 */

import { useState, useEffect, useCallback } from 'react';
import type { Employee, PayrollRun, PayrollItem, LeaveRequest, LeaveBalance } from '@/lib/hr';

const API_BASE = '/api/hr';

// ═══════════════════════════════════════════════════════════════════════════════
// useEmployees
// ═══════════════════════════════════════════════════════════════════════════════

interface EmployeeFilters {
    status?: string;
    department?: string;
}

export function useEmployees(tenantId: string | null, filters?: EmployeeFilters) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEmployees = useCallback(async () => {
        if (!tenantId) return;

        setLoading(true);
        try {
            let url = `${API_BASE}?tenantId=${tenantId}&action=employees`;
            if (filters?.status) url += `&status=${filters.status}`;
            if (filters?.department) url += `&department=${filters.department}`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.success) {
                setEmployees(data.data);
                setError(null);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch employees');
        } finally {
            setLoading(false);
        }
    }, [tenantId, filters?.status, filters?.department]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const createEmployee = async (employee: Partial<Employee>) => {
        if (!tenantId) return { success: false, error: 'Missing tenantId' };

        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, action: 'create-employee', employee }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchEmployees();
            }
            return data;
        } catch (err) {
            return { success: false, error: 'Failed to create employee' };
        }
    };

    const updateEmployee = async (employeeId: string, updates: Partial<Employee>) => {
        if (!tenantId) return { success: false, error: 'Missing tenantId' };

        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, action: 'update-employee', employeeId, updates }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchEmployees();
            }
            return data;
        } catch (err) {
            return { success: false, error: 'Failed to update employee' };
        }
    };

    return {
        employees,
        loading,
        error,
        refresh: fetchEmployees,
        createEmployee,
        updateEmployee,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// usePayroll
// ═══════════════════════════════════════════════════════════════════════════════

export function usePayroll(tenantId: string | null, userId: string | null) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runPayroll = async (period: string) => {
        if (!tenantId || !userId) {
            return { success: false, error: 'Missing tenantId or userId' };
        }

        setSubmitting(true);
        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, action: 'run-payroll', period, userId }),
            });
            const data = await res.json();
            setError(data.success ? null : data.error);
            return data;
        } catch (err) {
            const errorMsg = 'Failed to run payroll';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setSubmitting(false);
        }
    };

    const processPayroll = async (runId: string) => {
        if (!tenantId) return { success: false, error: 'Missing tenantId' };

        setSubmitting(true);
        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, action: 'process-payroll', runId }),
            });
            const data = await res.json();
            setError(data.success ? null : data.error);
            return data;
        } catch (err) {
            const errorMsg = 'Failed to process payroll';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setSubmitting(false);
        }
    };

    const getPayrollRun = async (runId: string): Promise<{ run: PayrollRun; items: PayrollItem[] } | null> => {
        if (!tenantId) return null;

        try {
            const res = await fetch(`${API_BASE}?tenantId=${tenantId}&action=payroll&runId=${runId}`);
            const data = await res.json();
            return data.success ? data.data : null;
        } catch (err) {
            return null;
        }
    };

    return { runPayroll, processPayroll, getPayrollRun, submitting, error };
}

// ═══════════════════════════════════════════════════════════════════════════════
// usePayrollCalculator
// ═══════════════════════════════════════════════════════════════════════════════

interface PayrollCalculation {
    grossSalary: number;
    socialSecurity: number;
    tax: number;
    deductions: number;
    netPay: number;
}

export function usePayrollCalculator() {
    const [calculation, setCalculation] = useState<PayrollCalculation | null>(null);
    const [loading, setLoading] = useState(false);

    const calculate = async (salary: number, country: string = 'VN') => {
        setLoading(true);
        try {
            const res = await fetch(
                `${API_BASE}?action=calculate-payroll&salary=${salary}&country=${country}`
            );
            const data = await res.json();
            if (data.success) {
                setCalculation(data.data);
            }
            return data;
        } catch (err) {
            return { success: false, error: 'Failed to calculate' };
        } finally {
            setLoading(false);
        }
    };

    return { calculation, calculate, loading };
}

// ═══════════════════════════════════════════════════════════════════════════════
// useLeave
// ═══════════════════════════════════════════════════════════════════════════════

export function useLeave(tenantId: string | null, employeeId: string | null) {
    const [balance, setBalance] = useState<LeaveBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBalance = useCallback(async () => {
        if (!tenantId || !employeeId) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${API_BASE}?tenantId=${tenantId}&action=leave-balance&employeeId=${employeeId}`
            );
            const data = await res.json();

            if (data.success) {
                setBalance(data.data);
                setError(null);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch leave balance');
        } finally {
            setLoading(false);
        }
    }, [tenantId, employeeId]);

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    const requestLeave = async (
        leaveType: string,
        startDate: Date,
        endDate: Date,
        reason?: string
    ) => {
        if (!tenantId || !employeeId) {
            return { success: false, error: 'Missing IDs' };
        }

        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId,
                    action: 'request-leave',
                    employeeId,
                    leaveType,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    reason,
                }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchBalance();
            }
            return data;
        } catch (err) {
            return { success: false, error: 'Failed to request leave' };
        }
    };

    const approveLeave = async (leaveId: string, approverId: string) => {
        if (!tenantId) return { success: false, error: 'Missing tenantId' };

        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, action: 'approve-leave', leaveId, approverId }),
            });
            return await res.json();
        } catch (err) {
            return { success: false, error: 'Failed to approve leave' };
        }
    };

    return { balance, loading, error, refresh: fetchBalance, requestLeave, approveLeave };
}
