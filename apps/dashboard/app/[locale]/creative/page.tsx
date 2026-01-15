'use client';

import React from 'react';
import { Palette, Image, Video, Wand2, Eye, Heart } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';

export default function CreativePage() {
    const { analytics, loading } = useAnalytics();
    return (
        <MD3AppShell title="Creative Studio 🎨" subtitle="Design • Video • Copywriting • Brand Management">
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Image className="w-5 h-5" style={{ color: '#ec4899' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assets Created</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#ec4899' }}>248</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>+32 this month</div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Eye className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approval Rate</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#22c55e' }}>94%</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>+5% improvement</div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Wand2 className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Campaigns Live</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#3b82f6' }}>12</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>+3 launched</div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Heart className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Engagement</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#a855f7' }}>4.2%</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>+0.8% vs last period</div>
                            </MD3Surface>
                        </div>

                        {/* Active Creative Projects */}
                        <MD3Card headline="Active Creative Projects" subhead="In progress campaigns">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { name: 'Q1 Campaign Launch', status: 'In Progress', progress: 75, color: '#ec4899' },
                                    { name: 'Brand Refresh', status: 'Review', progress: 90, color: '#3b82f6' },
                                    { name: 'Product Videos', status: 'Planning', progress: 25, color: '#22c55e' },
                                ].map((project) => (
                                    <MD3Surface key={project.name} shape="medium" className="auto-safe">
                                        <div className="flex justify-between items-start mb-2">
                                            <span style={{ fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>{project.name}</span>
                                            <span className="text-xs px-2 py-1 rounded" style={{ background: `${project.color}20`, color: project.color }}>
                                                {project.status}
                                            </span>
                                        </div>
                                        <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)' }}>
                                            <div className="h-2 rounded-full" style={{ width: `${project.progress}%`, background: project.color }} />
                                        </div>
                                        <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px' }}>
                                            {project.progress}% complete
                                        </div>
                                    </MD3Surface>
                                ))}
                            </div>
                        </MD3Card>
                    </>
                }
                supportingContent={
                    <>
                        <MD3Card headline="Quick Actions" subhead="Creative Tools">
                            <div className="space-y-2">
                                {[
                                    { icon: '🎨', label: 'New Design' },
                                    { icon: '📹', label: 'Create Video' },
                                    { icon: '✍️', label: 'Write Copy' },
                                    { icon: '🖼️', label: 'Asset Library' },
                                    { icon: '📊', label: 'Analytics' },
                                    { icon: '🎯', label: 'Brand Guide' },
                                ].map((action) => (
                                    <button key={action.label} className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors" style={{ backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                                        <span style={{ fontSize: '20px' }}>{action.icon}</span>
                                        <span style={{ fontSize: 'var(--md-sys-typescale-body-large-size)', color: 'var(--md-sys-color-on-surface)' }}>{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </MD3Card>
                    </>
                }
            />
        </MD3AppShell>
    );
}
