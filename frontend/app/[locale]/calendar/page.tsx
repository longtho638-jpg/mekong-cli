'use client';

import React from 'react';
import { Calendar as CalendarIcon, Clock, Users, CheckCircle, Loader2, FolderKanban, DollarSign, AlertTriangle } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function CalendarPage() {
    const { analytics, loading, projects } = useAnalytics();

    // Calendar-relevant metrics derived from projects
    const todayMeetings = Math.min(analytics.activeProjects, 8); // Simulated from active projects
    const upcomingDeadlines = projects.filter(p => {
        if (!p.end_date || p.status !== 'active') return false;
        const endDate = new Date(p.end_date);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return endDate <= weekFromNow && endDate >= new Date();
    }).length;

    const overdueProjects = projects.filter(p => {
        if (!p.end_date || p.status !== 'active') return false;
        return new Date(p.end_date) < new Date();
    }).length;

    return (
        <MD3AppShell title="Calendar Hub 📅" subtitle="Scheduling • Deadlines • Projects • Reminders">
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <CalendarIcon className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#3b82f6' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : analytics.activeProjects}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>projects in progress</div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Clock className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>This Week</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#22c55e' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : upcomingDeadlines}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>deadlines</div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clients</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#a855f7' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : analytics.activeClients}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>active</div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overdue</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: overdueProjects > 0 ? '#ef4444' : '#22c55e' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : overdueProjects}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>projects</div>
                            </MD3Surface>
                        </div>

                        {/* Upcoming Deadlines */}
                        <MD3Card headline="Upcoming Deadlines" subhead="Next 7 Days">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--md-sys-color-primary)' }} />
                                </div>
                            ) : projects.filter(p => p.end_date && p.status === 'active').length === 0 ? (
                                <div className="text-center py-8" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                    No project deadlines scheduled
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {projects.filter(p => p.end_date && p.status === 'active').slice(0, 5).map((project) => (
                                        <MD3Surface key={project.id} shape="medium" className="flex items-center justify-between">
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>{project.name}</div>
                                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                                    Due: {project.end_date}
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 rounded-full text-xs" style={{
                                                backgroundColor: new Date(project.end_date!) < new Date() ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                                color: new Date(project.end_date!) < new Date() ? '#ef4444' : '#22c55e'
                                            }}>
                                                {new Date(project.end_date!) < new Date() ? 'OVERDUE' : 'ON TRACK'}
                                            </div>
                                        </MD3Surface>
                                    ))}
                                </div>
                            )}
                        </MD3Card>
                    </>
                }
                supportingContent={
                    <MD3Card headline="Quick Actions" subhead="Calendar Tools">
                        <div className="space-y-2">
                            {[{ icon: '➕', label: 'New Event' }, { icon: '📅', label: 'Schedule' }, { icon: '📹', label: 'Video Call' }, { icon: '🔗', label: 'Share' }, { icon: '🔔', label: 'Reminders' }, { icon: '⚙️', label: 'Settings' }].map((action) => (
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
