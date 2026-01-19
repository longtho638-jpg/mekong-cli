/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useCallback, useMemo } from 'react';

/**
 * 👥 Resource Pool Hook
 * 
 * Inspired by ERPNext Manufacturing Resource Management
 * Manage team capacity and resource allocation
 */

export type ResourceType = 'employee' | 'freelancer' | 'contractor' | 'agency';
export type SkillLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'principal';

export interface Resource {
    id: string;
    name: string;
    type: ResourceType;
    role: string;
    skills: string[];
    skillLevel: SkillLevel;
    hourlyRate: number;
    availability: number; // hours per week
    utilization: number; // current %
    currentProjects: string[];
    email?: string;
    timezone?: string;
    startDate: string;
    isActive: boolean;
}

export interface Allocation {
    id: string;
    resourceId: string;
    resourceName: string;
    projectId: string;
    projectName: string;
    hoursPerWeek: number;
    startDate: string;
    endDate?: string;
    role: string;
    billable: boolean;
}

export interface CapacityPlan {
    weekStart: string;
    totalCapacity: number;
    allocated: number;
    available: number;
    utilizationRate: number;
    overbooked: Resource[];
    underutilized: Resource[];
}

export function useResourcePool() {
    const [resources, setResources] = useState<Resource[]>(getDemoResources());
    const [allocations, setAllocations] = useState<Allocation[]>(getDemoAllocations());
    const [loading, setLoading] = useState(false);

    // Add resource
    const addResource = useCallback((resource: Omit<Resource, 'id' | 'utilization' | 'currentProjects'>) => {
        const newResource: Resource = {
            ...resource,
            id: crypto.randomUUID(),
            utilization: 0,
            currentProjects: [],
        };
        setResources(prev => [newResource, ...prev]);
        return newResource;
    }, []);

    // Allocate resource to project
    const allocate = useCallback((
        resourceId: string,
        projectId: string,
        projectName: string,
        hoursPerWeek: number,
        startDate: string,
        endDate?: string,
        role?: string,
        billable: boolean = true
    ) => {
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) return null;

        const allocation: Allocation = {
            id: crypto.randomUUID(),
            resourceId,
            resourceName: resource.name,
            projectId,
            projectName,
            hoursPerWeek,
            startDate,
            endDate,
            role: role || resource.role,
            billable,
        };

        setAllocations(prev => [allocation, ...prev]);

        // Update resource utilization
        const totalAllocated = allocations
            .filter(a => a.resourceId === resourceId)
            .reduce((sum, a) => sum + a.hoursPerWeek, 0) + hoursPerWeek;

        const utilization = Math.min(100, (totalAllocated / resource.availability) * 100);

        setResources(prev => prev.map(r =>
            r.id === resourceId
                ? {
                    ...r,
                    utilization,
                    currentProjects: Array.from(new Set([...r.currentProjects, projectId]))
                }
                : r
        ));

        return allocation;
    }, [resources, allocations]);

    // Deallocate
    const deallocate = useCallback((allocationId: string) => {
        const allocation = allocations.find(a => a.id === allocationId);
        if (!allocation) return;

        setAllocations(prev => prev.filter(a => a.id !== allocationId));

        // Recalculate utilization
        const remaining = allocations.filter(a =>
            a.id !== allocationId && a.resourceId === allocation.resourceId
        );
        const resource = resources.find(r => r.id === allocation.resourceId);
        if (resource) {
            const totalAllocated = remaining.reduce((sum, a) => sum + a.hoursPerWeek, 0);
            const utilization = (totalAllocated / resource.availability) * 100;

            setResources(prev => prev.map(r =>
                r.id === allocation.resourceId
                    ? { ...r, utilization, currentProjects: remaining.map(a => a.projectId) }
                    : r
            ));
        }
    }, [allocations, resources]);

    // Capacity planning
    const capacityPlan = useMemo((): CapacityPlan => {
        const activeResources = resources.filter(r => r.isActive);
        const totalCapacity = activeResources.reduce((sum, r) => sum + r.availability, 0);
        const allocated = activeResources.reduce((sum, r) => sum + (r.availability * r.utilization / 100), 0);

        const overbooked = activeResources.filter(r => r.utilization > 100);
        const underutilized = activeResources.filter(r => r.utilization < 50);

        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));

        return {
            weekStart: weekStart.toISOString().split('T')[0],
            totalCapacity,
            allocated: Math.round(allocated),
            available: Math.round(totalCapacity - allocated),
            utilizationRate: totalCapacity > 0 ? (allocated / totalCapacity) * 100 : 0,
            overbooked,
            underutilized,
        };
    }, [resources]);

    // Find available resources
    const findAvailable = useCallback((
        minHours: number,
        skills?: string[],
        skillLevel?: SkillLevel
    ): Resource[] => {
        return resources.filter(r => {
            if (!r.isActive) return false;

            const availableHours = r.availability * (1 - r.utilization / 100);
            if (availableHours < minHours) return false;

            if (skills && skills.length > 0) {
                const hasSkills = skills.every(s => r.skills.includes(s));
                if (!hasSkills) return false;
            }

            if (skillLevel) {
                const levels: SkillLevel[] = ['junior', 'mid', 'senior', 'lead', 'principal'];
                if (levels.indexOf(r.skillLevel) < levels.indexOf(skillLevel)) return false;
            }

            return true;
        });
    }, [resources]);

    // Get allocations by project
    const getAllocationsByProject = useCallback((projectId: string) =>
        allocations.filter(a => a.projectId === projectId), [allocations]);

    // Get allocations by resource
    const getAllocationsByResource = useCallback((resourceId: string) =>
        allocations.filter(a => a.resourceId === resourceId), [allocations]);

    return {
        resources,
        allocations,
        capacityPlan,
        loading,
        addResource,
        allocate,
        deallocate,
        findAvailable,
        getAllocationsByProject,
        getAllocationsByResource,
    };
}

// Demo data
function getDemoResources(): Resource[] {
    return [
        { id: '1', name: 'Alice Chen', type: 'employee', role: 'Frontend Developer', skills: ['React', 'TypeScript', 'Next.js'], skillLevel: 'senior', hourlyRate: 150, availability: 40, utilization: 75, currentProjects: ['proj-1', 'proj-2'], startDate: '2024-01-15', isActive: true },
        { id: '2', name: 'Bob Kim', type: 'employee', role: 'Backend Developer', skills: ['Python', 'FastAPI', 'PostgreSQL'], skillLevel: 'mid', hourlyRate: 125, availability: 40, utilization: 90, currentProjects: ['proj-1'], startDate: '2024-06-01', isActive: true },
        { id: '3', name: 'Carol Dev', type: 'freelancer', role: 'UI Designer', skills: ['Figma', 'UI/UX', 'Branding'], skillLevel: 'senior', hourlyRate: 100, availability: 32, utilization: 50, currentProjects: ['proj-2'], startDate: '2025-01-01', isActive: true },
        { id: '4', name: 'Dave Pro', type: 'contractor', role: 'DevOps Engineer', skills: ['AWS', 'Docker', 'Kubernetes'], skillLevel: 'lead', hourlyRate: 175, availability: 20, utilization: 100, currentProjects: ['proj-1', 'proj-3'], startDate: '2025-03-01', isActive: true },
    ];
}

function getDemoAllocations(): Allocation[] {
    return [
        { id: '1', resourceId: '1', resourceName: 'Alice Chen', projectId: 'proj-1', projectName: 'Acme Website', hoursPerWeek: 20, startDate: '2026-01-01', role: 'Lead Frontend', billable: true },
        { id: '2', resourceId: '1', resourceName: 'Alice Chen', projectId: 'proj-2', projectName: 'Mobile App', hoursPerWeek: 10, startDate: '2026-01-01', role: 'Frontend Support', billable: true },
        { id: '3', resourceId: '2', resourceName: 'Bob Kim', projectId: 'proj-1', projectName: 'Acme Website', hoursPerWeek: 36, startDate: '2026-01-01', role: 'Backend Lead', billable: true },
    ];
}

export default useResourcePool;
