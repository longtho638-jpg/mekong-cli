/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useCallback, useMemo } from 'react';

/**
 * ⏰ Attendance & Time Tracking Hook
 * 
 * Inspired by Frappe HR Attendance System
 * Track employee attendance and work hours
 */

export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'work-from-home' | 'leave' | 'holiday';

export interface AttendanceRecord {
    id: string;
    employeeId: string;
    employeeName: string;
    date: string;
    status: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    workHours?: number;
    overtime?: number;
    notes?: string;
}

export interface TimeEntry {
    id: string;
    employeeId: string;
    projectId: string;
    projectName: string;
    taskId?: string;
    taskName?: string;
    date: string;
    hours: number;
    description: string;
    billable: boolean;
    billed: boolean;
    rate?: number;
}

export interface AttendanceSummary {
    totalDays: number;
    present: number;
    absent: number;
    wfh: number;
    leaves: number;
    attendanceRate: number;
    totalHours: number;
    avgHoursPerDay: number;
    overtimeHours: number;
}

export function useAttendance() {
    const [records, setRecords] = useState<AttendanceRecord[]>(getDemoAttendance());
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(getDemoTimeEntries());
    const [loading, setLoading] = useState(false);

    // Check in
    const checkIn = useCallback((employeeId: string, employeeName: string) => {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();

        // Check if already checked in
        const existing = records.find(r => r.employeeId === employeeId && r.date === today);
        if (existing) return existing;

        const record: AttendanceRecord = {
            id: crypto.randomUUID(),
            employeeId,
            employeeName,
            date: today,
            status: 'present',
            checkIn: now,
        };

        setRecords(prev => [record, ...prev]);
        return record;
    }, [records]);

    // Check out
    const checkOut = useCallback((employeeId: string) => {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        setRecords(prev => prev.map(r => {
            if (r.employeeId !== employeeId || r.date !== today) return r;

            if (!r.checkIn) return r;
            const checkIn = new Date(r.checkIn);
            const workHours = (now.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
            const overtime = Math.max(0, workHours - 8);

            return {
                ...r,
                checkOut: now.toISOString(),
                workHours: Math.round(workHours * 10) / 10,
                overtime: Math.round(overtime * 10) / 10,
            };
        }));
    }, []);

    // Mark attendance manually
    const markAttendance = useCallback((
        employeeId: string,
        employeeName: string,
        date: string,
        status: AttendanceStatus
    ) => {
        const existing = records.find(r => r.employeeId === employeeId && r.date === date);

        if (existing) {
            setRecords(prev => prev.map(r =>
                r.id === existing.id ? { ...r, status } : r
            ));
        } else {
            const record: AttendanceRecord = {
                id: crypto.randomUUID(),
                employeeId,
                employeeName,
                date,
                status,
                workHours: status === 'present' ? 8 : status === 'half-day' ? 4 : 0,
            };
            setRecords(prev => [record, ...prev]);
        }
    }, [records]);

    // Log time entry
    const logTime = useCallback((entry: Omit<TimeEntry, 'id'>) => {
        const newEntry: TimeEntry = {
            ...entry,
            id: crypto.randomUUID(),
        };
        setTimeEntries(prev => [newEntry, ...prev]);
        return newEntry;
    }, []);

    // Get summary for date range
    const getSummary = useCallback((employeeId?: string, startDate?: string, endDate?: string): AttendanceSummary => {
        let filtered = records;

        if (employeeId) {
            filtered = filtered.filter(r => r.employeeId === employeeId);
        }
        if (startDate) {
            filtered = filtered.filter(r => r.date >= startDate);
        }
        if (endDate) {
            filtered = filtered.filter(r => r.date <= endDate);
        }

        const present = filtered.filter(r => r.status === 'present' || r.status === 'work-from-home').length;
        const absent = filtered.filter(r => r.status === 'absent').length;
        const wfh = filtered.filter(r => r.status === 'work-from-home').length;
        const leaves = filtered.filter(r => r.status === 'leave').length;
        const totalHours = filtered.reduce((sum, r) => sum + (r.workHours || 0), 0);
        const overtimeHours = filtered.reduce((sum, r) => sum + (r.overtime || 0), 0);

        return {
            totalDays: filtered.length,
            present,
            absent,
            wfh,
            leaves,
            attendanceRate: filtered.length > 0 ? (present / filtered.length) * 100 : 0,
            totalHours,
            avgHoursPerDay: filtered.length > 0 ? totalHours / filtered.length : 0,
            overtimeHours,
        };
    }, [records]);

    // Time entry summary
    const timeSummary = useMemo(() => {
        const billable = timeEntries.filter(e => e.billable);
        const billed = timeEntries.filter(e => e.billed);

        return {
            totalEntries: timeEntries.length,
            totalHours: timeEntries.reduce((sum, e) => sum + e.hours, 0),
            billableHours: billable.reduce((sum, e) => sum + e.hours, 0),
            billedHours: billed.reduce((sum, e) => sum + e.hours, 0),
            unbilledHours: billable.filter(e => !e.billed).reduce((sum, e) => sum + e.hours, 0),
        };
    }, [timeEntries]);

    return {
        records,
        timeEntries,
        timeSummary,
        loading,
        checkIn,
        checkOut,
        markAttendance,
        logTime,
        getSummary,
    };
}

// Demo data
function getDemoAttendance(): AttendanceRecord[] {
    const today = new Date().toISOString().split('T')[0];
    return [
        { id: '1', employeeId: 'emp-1', employeeName: 'John Doe', date: today, status: 'present', checkIn: '2026-01-04T09:00:00Z', workHours: 4 },
        { id: '2', employeeId: 'emp-2', employeeName: 'Jane Smith', date: today, status: 'work-from-home', checkIn: '2026-01-04T08:30:00Z', workHours: 4.5 },
        { id: '3', employeeId: 'emp-3', employeeName: 'Bob Wilson', date: today, status: 'leave' },
    ];
}

function getDemoTimeEntries(): TimeEntry[] {
    return [
        { id: '1', employeeId: 'emp-1', projectId: 'proj-1', projectName: 'Acme Website', taskName: 'Homepage Design', date: '2026-01-04', hours: 3, description: 'Completed hero section', billable: true, billed: false, rate: 150 },
        { id: '2', employeeId: 'emp-1', projectId: 'proj-1', projectName: 'Acme Website', taskName: 'API Integration', date: '2026-01-04', hours: 2, description: 'Connected payment gateway', billable: true, billed: false, rate: 150 },
        { id: '3', employeeId: 'emp-2', projectId: 'proj-2', projectName: 'Mobile App', taskName: 'UI Polish', date: '2026-01-04', hours: 4, description: 'Refined animations', billable: true, billed: false, rate: 125 },
    ];
}

export default useAttendance;
