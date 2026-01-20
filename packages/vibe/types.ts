/**
 * 📋 VIBE Project - Types
 */

export type WorkPackageType = 'task' | 'bug' | 'feature' | 'epic' | 'milestone';
export type WorkPackageStatus = 'new' | 'in_progress' | 'review' | 'done' | 'closed';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface WorkPackage {
    id: string;
    type: WorkPackageType;
    title: string;
    description?: string;
    status: WorkPackageStatus;
    priority: Priority;
    assigneeId?: string;
    projectId: string;
    sprintId?: string;
    parentId?: string;
    estimatedHours?: number;
    spentHours: number;
    dueDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    status: 'active' | 'archived';
    planet?: string; // Link to VIBE planet
    budget?: number;
    spentBudget: number;
    createdAt: Date;
}

export interface Sprint {
    id: string;
    projectId: string;
    name: string;
    goal?: string;
    startDate: Date;
    endDate: Date;
    status: 'planning' | 'active' | 'completed';
}

export interface TimeEntry {
    id: string;
    workPackageId: string;
    userId: string;
    hours: number;
    date: Date;
    billable: boolean;
    notes?: string;
}

export interface Meeting {
    id: string;
    projectId: string;
    title: string;
    date: Date;
    duration: number; // minutes
    agenda: string[];
    minutes?: string;
    attendees: string[];
}

export interface BoardColumn {
    id: string;
    name: string;
    status: WorkPackageStatus;
    order: number;
}
