'use client';

import { useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * 👥 Recruitment Pipeline Hook
 * 
 * Inspired by Frappe HR Recruitment Module
 * Track applicants from application to hire
 */

export type ApplicantStage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface Applicant {
    id: string;
    name: string;
    email: string;
    phone?: string;
    position: string;
    stage: ApplicantStage;
    source: string;
    resumeUrl?: string;
    appliedDate: string;
    rating: number; // 1-5
    notes: string[];
    interviews: Interview[];
    salary?: {
        expected: number;
        offered?: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Interview {
    id: string;
    date: string;
    type: 'phone' | 'video' | 'onsite' | 'technical';
    interviewer: string;
    feedback?: string;
    rating?: number;
    status: 'scheduled' | 'completed' | 'cancelled';
}

export interface JobOpening {
    id: string;
    title: string;
    department: string;
    status: 'open' | 'closed' | 'on-hold';
    applicantCount: number;
    postedDate: string;
    closingDate?: string;
}

export interface RecruitmentStats {
    totalApplicants: number;
    byStage: Record<ApplicantStage, number>;
    avgTimeToHire: number; // days
    offerAcceptRate: number;
    topSources: { source: string; count: number }[];
}

export function useRecruitment() {
    const [applicants, setApplicants] = useState<Applicant[]>(getDemoApplicants());
    const [openings, setOpenings] = useState<JobOpening[]>(getDemoOpenings());
    const [loading, setLoading] = useState(false);

    // Move applicant to next stage
    const moveToStage = useCallback((applicantId: string, newStage: ApplicantStage) => {
        setApplicants(prev => prev.map(a =>
            a.id === applicantId
                ? { ...a, stage: newStage, updatedAt: new Date().toISOString() }
                : a
        ));
    }, []);

    // Add note to applicant
    const addNote = useCallback((applicantId: string, note: string) => {
        setApplicants(prev => prev.map(a =>
            a.id === applicantId
                ? { ...a, notes: [...a.notes, note], updatedAt: new Date().toISOString() }
                : a
        ));
    }, []);

    // Schedule interview
    const scheduleInterview = useCallback((applicantId: string, interview: Omit<Interview, 'id'>) => {
        const newInterview: Interview = {
            ...interview,
            id: crypto.randomUUID(),
        };
        setApplicants(prev => prev.map(a =>
            a.id === applicantId
                ? { ...a, interviews: [...a.interviews, newInterview], updatedAt: new Date().toISOString() }
                : a
        ));
    }, []);

    // Rate applicant
    const rateApplicant = useCallback((applicantId: string, rating: number) => {
        setApplicants(prev => prev.map(a =>
            a.id === applicantId
                ? { ...a, rating: Math.min(5, Math.max(1, rating)), updatedAt: new Date().toISOString() }
                : a
        ));
    }, []);

    // Make offer
    const makeOffer = useCallback((applicantId: string, offeredSalary: number) => {
        setApplicants(prev => prev.map(a =>
            a.id === applicantId
                ? {
                    ...a,
                    stage: 'offer',
                    salary: { ...a.salary, expected: a.salary?.expected || 0, offered: offeredSalary },
                    updatedAt: new Date().toISOString()
                }
                : a
        ));
    }, []);

    // Statistics
    const stats: RecruitmentStats = useMemo(() => {
        const byStage = applicants.reduce((acc, a) => {
            acc[a.stage] = (acc[a.stage] || 0) + 1;
            return acc;
        }, {} as Record<ApplicantStage, number>);

        const sources = applicants.reduce((acc, a) => {
            acc[a.source] = (acc[a.source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topSources = Object.entries(sources)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const hired = applicants.filter(a => a.stage === 'hired');
        const offered = applicants.filter(a => a.stage === 'offer' || a.stage === 'hired');

        return {
            totalApplicants: applicants.length,
            byStage,
            avgTimeToHire: 21, // Would calculate from actual data
            offerAcceptRate: offered.length > 0 ? (hired.length / offered.length) * 100 : 0,
            topSources,
        };
    }, [applicants]);

    // Filter helpers
    const getByStage = useCallback((stage: ApplicantStage) =>
        applicants.filter(a => a.stage === stage), [applicants]);

    const getByPosition = useCallback((position: string) =>
        applicants.filter(a => a.position === position), [applicants]);

    return {
        applicants,
        openings,
        stats,
        loading,
        moveToStage,
        addNote,
        scheduleInterview,
        rateApplicant,
        makeOffer,
        getByStage,
        getByPosition,
    };
}

// Demo data
function getDemoApplicants(): Applicant[] {
    return [
        { id: '1', name: 'Nguyen Van A', email: 'a@example.com', position: 'Frontend Developer', stage: 'interview', source: 'LinkedIn', appliedDate: '2026-01-01', rating: 4, notes: ['Strong React skills'], interviews: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        { id: '2', name: 'Tran Thi B', email: 'b@example.com', position: 'UI Designer', stage: 'screening', source: 'Referral', appliedDate: '2026-01-02', rating: 5, notes: [], interviews: [], createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
        { id: '3', name: 'Le Van C', email: 'c@example.com', position: 'Backend Developer', stage: 'applied', source: 'Website', appliedDate: '2026-01-03', rating: 3, notes: [], interviews: [], createdAt: '2026-01-03T00:00:00Z', updatedAt: '2026-01-03T00:00:00Z' },
    ];
}

function getDemoOpenings(): JobOpening[] {
    return [
        { id: '1', title: 'Frontend Developer', department: 'Engineering', status: 'open', applicantCount: 12, postedDate: '2025-12-15' },
        { id: '2', title: 'UI Designer', department: 'Design', status: 'open', applicantCount: 8, postedDate: '2025-12-20' },
        { id: '3', title: 'Backend Developer', department: 'Engineering', status: 'open', applicantCount: 15, postedDate: '2025-12-10' },
    ];
}

export default useRecruitment;
