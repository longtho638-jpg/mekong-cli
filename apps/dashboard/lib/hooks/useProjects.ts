/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAgency } from './useAgency';
import type { Project, CreateProject, UpdateProject } from '@/lib/types/database';

// ═══════════════════════════════════════════════════════════════════════════════
// 📁 USE PROJECTS HOOK - Full CRUD for projects
// ═══════════════════════════════════════════════════════════════════════════════

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { agency } = useAgency();
    const supabase = createClient();

    // READ - Fetch all projects with client data
    const fetchProjects = useCallback(async () => {
        if (!agency) return;

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('projects')
                .select(`
                    *,
                    client:clients(id, name, company)
                `)
                .eq('agency_id', agency.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setProjects(data as Project[]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    }, [agency, supabase]);

    // CREATE - Add new project
    const createProject = async (project: Omit<CreateProject, 'agency_id'>) => {
        if (!agency) throw new Error('No agency');

        try {
            const { data, error } = await supabase
                .from('projects')
                .insert({
                    ...project,
                    agency_id: agency.id,
                })
                .select(`
                    *,
                    client:clients(id, name, company)
                `)
                .single();

            if (error) throw error;
            setProjects(prev => [data as Project, ...prev]);
            return data as Project;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create project');
            throw err;
        }
    };

    // UPDATE - Modify existing project
    const updateProject = async (id: string, updates: UpdateProject) => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .update(updates)
                .eq('id', id)
                .select(`
                    *,
                    client:clients(id, name, company)
                `)
                .single();

            if (error) throw error;
            setProjects(prev => prev.map(p => p.id === id ? data as Project : p));
            return data as Project;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update project');
            throw err;
        }
    };

    // DELETE - Remove project
    const deleteProject = async (id: string) => {
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setProjects(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete project');
            throw err;
        }
    };

    useEffect(() => {
        if (agency) {
            fetchProjects();
        }
    }, [agency, fetchProjects]);

    // Computed stats
    const stats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        draft: projects.filter(p => p.status === 'draft').length,
        totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    };

    return {
        projects,
        loading,
        error,
        stats,
        createProject,
        updateProject,
        deleteProject,
        refetch: fetchProjects,
    };
}
