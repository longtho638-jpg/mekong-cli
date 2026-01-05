'use client';

import React, { useState } from 'react';
import { Video, Play, FileText, Sparkles, Copy, Download, CheckCircle } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useVideoGenerator } from '@/lib/hooks/useCommands';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎬 VIDEO DASHBOARD - AI Script Generator (WIRED TO BACKEND)
// Feature from agencyos.network: /video/script
// ═══════════════════════════════════════════════════════════════════════════════

const RECENT_SCRIPTS = [
    { title: 'Product Launch Announcement', platform: 'YouTube', duration: '5:00', status: 'Complete' },
    { title: 'Quick Tutorial: How to Use...', platform: 'TikTok', duration: '0:60', status: 'Complete' },
    { title: 'Behind the Scenes', platform: 'Reels', duration: '0:30', status: 'Draft' },
    { title: 'Customer Testimonial', platform: 'YouTube', duration: '3:00', status: 'Complete' },
];

export default function VideoPage({ params: { locale } }: { params: { locale: string } }) {
    const [prompt, setPrompt] = useState('');
    const [platform, setPlatform] = useState('youtube');
    const { generate, loading: generating, result: generatedScript, error } = useVideoGenerator();

    const handleGenerate = async () => {
        if (!prompt) return;
        await generate(prompt, platform);
    };

    return (
        <MD3AppShell
            title="Video Studio 🎬"
            subtitle="AI Script Generator • YouTube • TikTok • Reels"
        >
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span className="text-xs uppercase text-gray-400">Scripts Generated</span>
                                </div>
                                <div className="text-3xl font-bold text-blue-400">
                                    <AnimatedNumber value={156} duration={1500} />
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Video className="w-5 h-5" style={{ color: '#ef4444' }} />
                                    <span className="text-xs uppercase text-gray-400">YouTube</span>
                                </div>
                                <div className="text-3xl font-bold text-red-400">48</div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Play className="w-5 h-5" style={{ color: '#ec4899' }} />
                                    <span className="text-xs uppercase text-gray-400">TikTok</span>
                                </div>
                                <div className="text-3xl font-bold text-pink-400">67</div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Sparkles className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span className="text-xs uppercase text-gray-400">Reels</span>
                                </div>
                                <div className="text-3xl font-bold text-purple-400">41</div>
                            </MD3Surface>
                        </div>

                        {/* Script Generator */}
                        <MD3Card headline="Generate Script" subhead="AI-powered video scripts in seconds">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">What's your video about?</label>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-purple-500 focus:outline-none resize-none h-24"
                                        placeholder="Describe your video topic, key points, and target audience..."
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm text-gray-400 mb-2">Platform</label>
                                        <select
                                            value={platform}
                                            onChange={(e) => setPlatform(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                                        >
                                            <option value="youtube">YouTube (Long-form)</option>
                                            <option value="tiktok">TikTok (60s)</option>
                                            <option value="reels">Instagram Reels (90s)</option>
                                            <option value="shorts">YouTube Shorts (60s)</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={handleGenerate}
                                    disabled={generating || !prompt}
                                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {generating ? (
                                        <>Generating...</>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Generate Script
                                        </>
                                    )}
                                </button>
                            </div>
                        </MD3Card>

                        {/* Recent Scripts */}
                        <MD3Card headline="Recent Scripts" subhead="Your generated content">
                            <div className="space-y-3">
                                {RECENT_SCRIPTS.map((script, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{script.title}</div>
                                                <div className="text-xs text-gray-500">{script.platform} • {script.duration}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-xs ${script.status === 'Complete'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {script.status}
                                            </span>
                                            <button className="p-2 hover:bg-white/10 rounded-lg">
                                                <Copy className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </MD3Card>
                    </>
                }
                supportingContent={
                    <>
                        <MD3Card headline="Quick Templates" subhead="Start faster">
                            <div className="space-y-2">
                                {[
                                    { icon: '🚀', label: 'Product Launch' },
                                    { icon: '📚', label: 'Tutorial' },
                                    { icon: '💬', label: 'Testimonial' },
                                    { icon: '🎯', label: 'How-To' },
                                    { icon: '📢', label: 'Announcement' },
                                ].map((template, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPrompt(`Create a ${template.label.toLowerCase()} video script...`)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <span className="text-xl">{template.icon}</span>
                                        <span className="text-sm">{template.label}</span>
                                    </button>
                                ))}
                            </div>
                        </MD3Card>

                        <MD3Card headline="Tips" subhead="Better scripts">
                            <div className="space-y-3 text-sm text-gray-400">
                                <p>✅ Be specific about your audience</p>
                                <p>✅ Include key points to cover</p>
                                <p>✅ Mention desired tone (fun, serious, educational)</p>
                            </div>
                        </MD3Card>
                    </>
                }
            />
        </MD3AppShell>
    );
}
