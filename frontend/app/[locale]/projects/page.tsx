'use client';

import React, { useState } from 'react';
import { FolderKanban, CheckCircle, Clock, Users, AlertTriangle, Plus, Loader2, DollarSign } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { useProjects } from '@/lib/hooks/useProjects';

export default function ProjectsPage({ params: { locale } }: { params: { locale: string } }) {
    const { projects, loading, error, stats, createProject, deleteProject } = useProjects();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '', budget: 0, status: 'active' as const });

    // Calculate at-risk projects (no end_date or overdue)
    const atRiskCount = projects.filter(p => {
        if (p.status !== 'active') return false;
        if (!p.end_date) return true;
        return new Date(p.end_date) < new Date();
    }).length;

    // On-time percentage
    const onTimePercent = stats.active > 0
        ? Math.round(((stats.active - atRiskCount) / stats.active) * 100)
        : 100;

    const handleCreateProject = async () => {
        if (!newProject.name) return;
        try {
            await createProject(newProject);
            setNewProject({ name: '', description: '', budget: 0, status: 'active' });
            setShowCreateForm(false);
        } catch (err) {
            console.error('Failed to create project:', err);
        }
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
        return `$${amount}`;
    };

    return (
        <MD3AppShell title="Projects Hub 📁" subtitle="Planning • Execution • Tracking • Delivery">
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Cards - Now with REAL DATA */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <FolderKanban className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Projects</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#3b82f6' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.active}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    {stats.draft} drafts
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <CheckCircle className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#22c55e' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.completed}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    {stats.total} total
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <DollarSign className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Budget</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#a855f7' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(stats.totalBudget)}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    All projects
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>At Risk</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#f59e0b' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : atRiskCount}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    {onTimePercent}% on time
                                </div>
                            </MD3Surface>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                <p style={{ color: '#ef4444' }}>⚠️ {error}</p>
                            </div>
                        )}

                        {/* Create Project Form */}
                        {showCreateForm && (
                            <MD3Surface shape="large" className="mt-4">
                                <h3 style={{ fontSize: 'var(--md-sys-typescale-title-medium-size)', marginBottom: '16px' }}>Create New Project</h3>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Project Name"
                                        value={newProject.name}
                                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                        className="w-full p-3 rounded-xl"
                                        style={{ backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Description"
                                        value={newProject.description}
                                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                        className="w-full p-3 rounded-xl"
                                        style={{ backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Budget ($)"
                                        value={newProject.budget || ''}
                                        onChange={(e) => setNewProject({ ...newProject, budget: Number(e.target.value) })}
                                        className="w-full p-3 rounded-xl"
                                        style={{ backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCreateProject}
                                            className="flex-1 p-3 rounded-xl"
                                            style={{ backgroundColor: '#3b82f6', color: 'white' }}
                                        >
                                            Create Project
                                        </button>
                                        <button
                                            onClick={() => setShowCreateForm(false)}
                                            className="p-3 rounded-xl"
                                            style={{ backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline-variant)' }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </MD3Surface>
                        )}

                        {/* Projects List - REAL DATA */}
                        <div className="mt-4 space-y-3">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--md-sys-color-primary)' }} />
                                </div>
                            ) : projects.length === 0 ? (
                                <MD3Surface shape="large" className="text-center py-8">
                                    <FolderKanban className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--md-sys-color-outline)' }} />
                                    <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>No projects yet. Create your first project!</p>
                                </MD3Surface>
                            ) : (
                                projects.slice(0, 10).map((project) => (
                                    <MD3Surface key={project.id} shape="large" className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span style={{
                                                    fontSize: 'var(--md-sys-typescale-title-medium-size)',
                                                    color: 'var(--md-sys-color-on-surface)'
                                                }}>
                                                    {project.name}
                                                </span>
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-xs"
                                                    style={{
                                                        backgroundColor: project.status === 'active' ? 'rgba(34, 197, 94, 0.2)' :
                                                            project.status === 'completed' ? 'rgba(59, 130, 246, 0.2)' :
                                                                'rgba(156, 163, 175, 0.2)',
                                                        color: project.status === 'active' ? '#22c55e' :
                                                            project.status === 'completed' ? '#3b82f6' :
                                                                '#9ca3af'
                                                    }}
                                                >
                                                    {project.status}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                                {project.client?.name || 'No client'} • {project.budget ? formatCurrency(project.budget) : 'No budget'}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteProject(project.id)}
                                            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                                            title="Delete project"
                                        >
                                            🗑️
                                        </button>
                                    </MD3Surface>
                                ))
                            )}
                        </div>
                    </>
                }
                supportingContent={
                    <MD3Card headline="Quick Actions" subhead="Project Tools">
                        <div className="space-y-2">
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                                style={{ backgroundColor: '#3b82f6', border: 'none' }}
                            >
                                <Plus className="w-5 h-5 text-white" />
                                <span style={{ fontSize: 'var(--md-sys-typescale-body-large-size)', color: 'white' }}>New Project</span>
                            </button>
                            {[{ icon: '📋', label: 'Tasks' }, { icon: '👥', label: 'Team' }, { icon: '📊', label: 'Dashboard' }, { icon: '📈', label: 'Reports' }, { icon: '⚙️', label: 'Settings' }].map((action) => (
                                <button key={action.label} className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors" style={{ backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                                    <span style={{ fontSize: '20px' }}>{action.icon}</span>
                                    <span style={{ fontSize: 'var(--md-sys-typescale-body-large-size)', color: 'var(--md-sys-color-on-surface)' }}>{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </MD3Card>
                }
            />
        </MD3AppShell>
    );
}
