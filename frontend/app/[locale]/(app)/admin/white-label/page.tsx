'use client';

import React, { useState } from 'react';
import { Palette, Image, Globe, Save, Eye, Sparkles } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 WHITE LABEL CONFIGURATION - Phase 3 Implementation
// Features: Logo upload, Theme customization, Domain mapping
// ═══════════════════════════════════════════════════════════════════════════════

const THEMES = [
    { id: 'ocean', name: 'Ocean', primary: '#0EA5E9', secondary: '#06B6D4', accent: '#F97316' },
    { id: 'forest', name: 'Forest', primary: '#22C55E', secondary: '#10B981', accent: '#F59E0B' },
    { id: 'sunset', name: 'Sunset', primary: '#F97316', secondary: '#EF4444', accent: '#8B5CF6' },
    { id: 'midnight', name: 'Midnight', primary: '#1E293B', secondary: '#334155', accent: '#3B82F6' },
    { id: 'royal', name: 'Royal', primary: '#7C3AED', secondary: '#8B5CF6', accent: '#EC4899' },
];

export default function WhiteLabelPage({ params: { locale } }: { params: { locale: string } }) {
    const [config, setConfig] = useState({
        agencyName: 'My Agency',
        tagline: 'Powered by Agency OS',
        logoUrl: '',
        theme: 'royal',
        customDomain: '',
        primaryFont: 'Inter',
    });
    const [saving, setSaving] = useState(false);

    const selectedTheme = THEMES.find(t => t.id === config.theme) || THEMES[4];

    const handleSave = async () => {
        setSaving(true);
        // TODO: Save to Supabase
        await new Promise(r => setTimeout(r, 1000));
        setSaving(false);
    };

    return (
        <MD3AppShell
            title="White Label ✨"
            subtitle="Brand Your Agency OS • Custom Domain • Theme"
        >
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* Agency Info */}
                        <MD3Card headline="Agency Branding" subhead="Your brand identity">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Agency Name</label>
                                    <input
                                        type="text"
                                        value={config.agencyName}
                                        onChange={(e) => setConfig({ ...config, agencyName: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                                        placeholder="Your Agency Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Tagline</label>
                                    <input
                                        type="text"
                                        value={config.tagline}
                                        onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                                        placeholder="Your Agency Tagline"
                                    />
                                </div>
                            </div>
                        </MD3Card>

                        {/* Logo Upload */}
                        <MD3Card headline="Logo" subhead="Upload your agency logo">
                            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors cursor-pointer">
                                <Image className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                                <p className="text-gray-400 mb-2">Drag & drop your logo here</p>
                                <p className="text-xs text-gray-600">PNG, JPG, SVG (max 2MB)</p>
                                <input
                                    type="text"
                                    value={config.logoUrl}
                                    onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                                    className="mt-4 w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                                    placeholder="Or paste logo URL..."
                                />
                            </div>
                        </MD3Card>

                        {/* Theme Selector */}
                        <MD3Card headline="Color Theme" subhead="Choose your brand colors">
                            <div className="grid grid-cols-5 gap-3">
                                {THEMES.map((theme) => (
                                    <button
                                        key={theme.id}
                                        onClick={() => setConfig({ ...config, theme: theme.id })}
                                        className={`p-4 rounded-xl border-2 transition-all ${config.theme === theme.id
                                                ? 'border-white scale-105'
                                                : 'border-white/10 hover:border-white/30'
                                            }`}
                                    >
                                        <div className="flex gap-1 mb-2">
                                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.primary }} />
                                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.secondary }} />
                                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.accent }} />
                                        </div>
                                        <span className="text-xs text-gray-400">{theme.name}</span>
                                    </button>
                                ))}
                            </div>
                        </MD3Card>

                        {/* Custom Domain */}
                        <MD3Card headline="Custom Domain" subhead="Use your own domain">
                            <div className="flex items-center gap-4">
                                <Globe className="w-6 h-6 text-purple-400" />
                                <input
                                    type="text"
                                    value={config.customDomain}
                                    onChange={(e) => setConfig({ ...config, customDomain: e.target.value })}
                                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                                    placeholder="app.youragency.com"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                                Add a CNAME record pointing to: cname.vercel-dns.com
                            </p>
                        </MD3Card>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Configuration
                                </>
                            )}
                        </button>
                    </>
                }
                supportingContent={
                    <>
                        {/* Live Preview */}
                        <MD3Card headline="Live Preview" subhead="See your branding">
                            <div
                                className="rounded-xl p-6 text-center"
                                style={{
                                    background: `linear-gradient(135deg, ${selectedTheme.primary}20, ${selectedTheme.secondary}20)`,
                                    border: `1px solid ${selectedTheme.primary}40`
                                }}
                            >
                                {config.logoUrl ? (
                                    <img src={config.logoUrl} alt="Logo" className="w-16 h-16 mx-auto mb-4 rounded-xl" />
                                ) : (
                                    <div
                                        className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: selectedTheme.primary }}
                                    >
                                        <Sparkles className="w-8 h-8 text-white" />
                                    </div>
                                )}
                                <h3 className="text-xl font-bold mb-1" style={{ color: selectedTheme.primary }}>
                                    {config.agencyName}
                                </h3>
                                <p className="text-sm text-gray-400">{config.tagline}</p>
                            </div>
                        </MD3Card>

                        {/* Theme Colors */}
                        <MD3Card headline="Theme Colors" subhead={selectedTheme.name}>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400">Primary</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded" style={{ backgroundColor: selectedTheme.primary }} />
                                        <span className="text-xs font-mono text-gray-500">{selectedTheme.primary}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400">Secondary</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded" style={{ backgroundColor: selectedTheme.secondary }} />
                                        <span className="text-xs font-mono text-gray-500">{selectedTheme.secondary}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400">Accent</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded" style={{ backgroundColor: selectedTheme.accent }} />
                                        <span className="text-xs font-mono text-gray-500">{selectedTheme.accent}</span>
                                    </div>
                                </div>
                            </div>
                        </MD3Card>

                        {/* Quick Actions */}
                        <MD3Card headline="Quick Actions" subhead="White Label Tools">
                            <div className="space-y-2">
                                {[
                                    { icon: <Eye className="w-4 h-4" />, label: 'Preview Site' },
                                    { icon: <Palette className="w-4 h-4" />, label: 'Advanced Colors' },
                                    { icon: <Globe className="w-4 h-4" />, label: 'DNS Settings' },
                                ].map((action, i) => (
                                    <button
                                        key={i}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <span className="text-purple-400">{action.icon}</span>
                                        <span className="text-sm">{action.label}</span>
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
