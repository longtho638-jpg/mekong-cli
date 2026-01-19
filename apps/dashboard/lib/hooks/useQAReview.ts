/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useCallback, useMemo } from 'react';

/**
 * ✅ QA Review Flow Hook
 * 
 * Inspired by ERPNext Quality Control
 * Track deliverable quality reviews and approvals
 */

export type QAStatus = 'pending' | 'in-review' | 'approved' | 'changes-requested' | 'rejected';
export type DeliverableType = 'design' | 'code' | 'content' | 'video' | 'document' | 'other';

export interface QACheckItem {
    id: string;
    label: string;
    checked: boolean;
    notes?: string;
}

export interface QAReview {
    id: string;
    deliverableId: string;
    deliverableName: string;
    type: DeliverableType;
    projectId: string;
    projectName: string;
    status: QAStatus;
    checklist: QACheckItem[];
    submittedBy: string;
    reviewedBy?: string;
    rating?: number; // 1-5
    feedback?: string;
    submittedAt: string;
    reviewedAt?: string;
    version: number;
}

export interface QASummary {
    totalReviews: number;
    pending: number;
    approved: number;
    changesRequested: number;
    avgRating: number;
    passRate: number;
    byType: Record<DeliverableType, number>;
}

// Default checklists by type
const DEFAULT_CHECKLISTS: Record<DeliverableType, string[]> = {
    design: ['Brand guidelines followed', 'Responsive layouts verified', 'Accessibility checked', 'Assets exported correctly', 'Handoff notes complete'],
    code: ['Code review passed', 'Tests written and passing', 'No console errors', 'Performance optimized', 'Documentation updated'],
    content: ['Grammar and spelling checked', 'Tone of voice consistent', 'SEO optimized', 'Images optimized', 'CTA clear and compelling'],
    video: ['Audio quality verified', 'Captions added', 'Branding consistent', 'Format and resolution correct', 'Thumbnail created'],
    document: ['Formatting consistent', 'All sections complete', 'Links verified', 'Version tracked', 'Approved by stakeholder'],
    other: ['Requirements met', 'Quality verified', 'Ready for delivery'],
};

export function useQAReview() {
    const [reviews, setReviews] = useState<QAReview[]>(getDemoReviews());
    const [loading, setLoading] = useState(false);

    // Create new review
    const createReview = useCallback((
        deliverableId: string,
        deliverableName: string,
        type: DeliverableType,
        projectId: string,
        projectName: string,
        submittedBy: string
    ): QAReview => {
        const checklist: QACheckItem[] = DEFAULT_CHECKLISTS[type].map((label, i) => ({
            id: `check-${i}`,
            label,
            checked: false,
        }));

        const review: QAReview = {
            id: crypto.randomUUID(),
            deliverableId,
            deliverableName,
            type,
            projectId,
            projectName,
            status: 'pending',
            checklist,
            submittedBy,
            submittedAt: new Date().toISOString(),
            version: 1,
        };

        setReviews(prev => [review, ...prev]);
        return review;
    }, []);

    // Update checklist item
    const toggleCheckItem = useCallback((reviewId: string, itemId: string) => {
        setReviews(prev => prev.map(r => {
            if (r.id !== reviewId) return r;
            return {
                ...r,
                checklist: r.checklist.map(item =>
                    item.id === itemId ? { ...item, checked: !item.checked } : item
                ),
            };
        }));
    }, []);

    // Start review
    const startReview = useCallback((reviewId: string, reviewerName: string) => {
        setReviews(prev => prev.map(r =>
            r.id === reviewId
                ? { ...r, status: 'in-review', reviewedBy: reviewerName }
                : r
        ));
    }, []);

    // Approve review
    const approveReview = useCallback((reviewId: string, rating: number, feedback?: string) => {
        setReviews(prev => prev.map(r =>
            r.id === reviewId
                ? {
                    ...r,
                    status: 'approved',
                    rating,
                    feedback,
                    reviewedAt: new Date().toISOString(),
                }
                : r
        ));
    }, []);

    // Request changes
    const requestChanges = useCallback((reviewId: string, feedback: string) => {
        setReviews(prev => prev.map(r =>
            r.id === reviewId
                ? {
                    ...r,
                    status: 'changes-requested',
                    feedback,
                    reviewedAt: new Date().toISOString(),
                }
                : r
        ));
    }, []);

    // Resubmit for review
    const resubmit = useCallback((reviewId: string) => {
        setReviews(prev => prev.map(r =>
            r.id === reviewId
                ? {
                    ...r,
                    status: 'pending',
                    version: r.version + 1,
                    submittedAt: new Date().toISOString(),
                    checklist: r.checklist.map(item => ({ ...item, checked: false })),
                }
                : r
        ));
    }, []);

    // Summary stats
    const summary: QASummary = useMemo(() => {
        const approved = reviews.filter(r => r.status === 'approved');
        const ratings = approved.filter(r => r.rating).map(r => r.rating!);
        const avgRating = ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 0;

        const byType = reviews.reduce((acc, r) => {
            acc[r.type] = (acc[r.type] || 0) + 1;
            return acc;
        }, {} as Record<DeliverableType, number>);

        return {
            totalReviews: reviews.length,
            pending: reviews.filter(r => r.status === 'pending').length,
            approved: approved.length,
            changesRequested: reviews.filter(r => r.status === 'changes-requested').length,
            avgRating: Math.round(avgRating * 10) / 10,
            passRate: reviews.length > 0 ? (approved.length / reviews.length) * 100 : 0,
            byType,
        };
    }, [reviews]);

    return {
        reviews,
        summary,
        loading,
        createReview,
        toggleCheckItem,
        startReview,
        approveReview,
        requestChanges,
        resubmit,
        getDefaultChecklist: (type: DeliverableType) => DEFAULT_CHECKLISTS[type],
    };
}

// Demo data
function getDemoReviews(): QAReview[] {
    return [
        {
            id: '1',
            deliverableId: 'del-1',
            deliverableName: 'Homepage Redesign',
            type: 'design',
            projectId: 'proj-1',
            projectName: 'Acme Corp Website',
            status: 'pending',
            checklist: DEFAULT_CHECKLISTS.design.map((label, i) => ({ id: `c1-${i}`, label, checked: i < 3 })),
            submittedBy: 'Designer A',
            submittedAt: '2026-01-03T14:00:00Z',
            version: 1,
        },
        {
            id: '2',
            deliverableId: 'del-2',
            deliverableName: 'API Integration',
            type: 'code',
            projectId: 'proj-2',
            projectName: 'Mobile App',
            status: 'approved',
            checklist: DEFAULT_CHECKLISTS.code.map((label, i) => ({ id: `c2-${i}`, label, checked: true })),
            submittedBy: 'Developer B',
            reviewedBy: 'Tech Lead',
            rating: 5,
            feedback: 'Excellent work! Clean code and well tested.',
            submittedAt: '2026-01-02T10:00:00Z',
            reviewedAt: '2026-01-03T09:00:00Z',
            version: 1,
        },
    ];
}

export default useQAReview;
