'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MD3TopAppBar } from '@/components/md3/MD3TopAppBar';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { User, Shield, Database, Globe } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// ⚙️ SETTINGS PAGE - MD3 Global System Compliant
// ═══════════════════════════════════════════════════════════════════════════════

export default function SettingsPage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics, loading, projects, clients } = useAnalytics();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('SettingsPage');

    return (
        <>
            <div className="sticky top-0 z-40">
                <MD3TopAppBar title="Settings" subtitle="System Configuration" />
            </div>

            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* Settings Grid */}
                        <div
                            className="grid grid-cols-1 lg:grid-cols-2"
                            style={{ gap: 'var(--md-sys-spacing-gap-lg, 16px)' }}
                        >
                            {/* General Settings */}
                            <MD3Card headline={t('general')}>
                                <div className="flex flex-col" style={{ gap: 'var(--md-sys-spacing-gap-sm, 8px)' }}>
                                    <SettingRow label={t('language')} value={locale.toUpperCase()} />
                                    <SettingRow label={t('theme')} value="Fintech Dark" />
                                    <SettingRow label={t('timezone')} value="UTC+7" />
                                </div>
                            </MD3Card>

                            {/* Notifications */}
                            <MD3Card headline={t('notifications')}>
                                <div className="flex flex-col" style={{ gap: 'var(--md-sys-spacing-gap-sm, 8px)' }}>
                                    <SettingRow label={t('email_alerts')} value={t('enabled')} valueColor="var(--md-sys-color-primary)" />
                                    <SettingRow label={t('push_notifications')} value={t('enabled')} valueColor="var(--md-sys-color-primary)" />
                                    <SettingRow label={t('slack_integration')} value={t('disabled')} valueColor="var(--md-sys-color-outline)" />
                                </div>
                            </MD3Card>

                            {/* Security */}
                            <MD3Card headline={t('security')}>
                                <div className="flex flex-col" style={{ gap: 'var(--md-sys-spacing-gap-sm, 8px)' }}>
                                    <SettingRow label={t('twofa')} value={t('active')} valueColor="var(--md-sys-color-primary)" />
                                    <SettingRow label={t('last_login')} value="2 hours ago" />
                                    <SettingRow label={t('api_keys')} value={`3 ${t('active')}`} />
                                </div>
                            </MD3Card>

                            {/* Appearance */}
                            <MD3Card headline={t('appearance')}>
                                <div className="flex flex-col" style={{ gap: 'var(--md-sys-spacing-gap-sm, 8px)' }}>
                                    <SettingRow label={t('color_scheme')} value="Pro Max Dark" />
                                    <SettingRow label={t('font')} value="Outfit + JetBrains" />
                                    <SettingRow label={t('density')} value="High" />
                                </div>
                            </MD3Card>
                        </div>

                        {/* Language Selector */}
                        <MD3Card headline="Language / Ngôn ngữ">
                            <div className="flex" style={{ gap: 'var(--md-sys-spacing-gap-sm, 8px)' }}>
                                {['en', 'vi', 'zh'].map((l) => (
                                    <button
                                        key={l}
                                        onClick={() => router.push(pathname.replace(`/${locale}`, `/${l}`))}
                                        className="px-4 py-2 rounded-lg transition-all"
                                        style={{
                                            backgroundColor: locale === l
                                                ? 'var(--md-sys-color-primary)'
                                                : 'var(--md-sys-color-surface-container)',
                                            color: locale === l
                                                ? 'var(--md-sys-color-on-primary)'
                                                : 'var(--md-sys-color-on-surface)',
                                            fontWeight: locale === l ? 600 : 400,
                                        }}
                                    >
                                        {l.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </MD3Card>
                    </>
                }
                supportingContent={
                    <>
                        {/* Quick Links */}
                        <MD3Card headline="Quick Links">
                            <div className="flex flex-col" style={{ gap: 'var(--md-sys-spacing-gap-sm, 8px)' }}>
                                {[
                                    { icon: <User className="w-4 h-4" />, label: 'Profile' },
                                    { icon: <Shield className="w-4 h-4" />, label: 'Privacy' },
                                    { icon: <Database className="w-4 h-4" />, label: 'Data Export' },
                                    { icon: <Globe className="w-4 h-4" />, label: 'Integrations' },
                                ].map((link, i) => (
                                    <button
                                        key={i}
                                        className="flex items-center w-full p-3 rounded-lg transition-all hover:opacity-80"
                                        style={{ backgroundColor: 'var(--md-sys-color-surface-container)', gap: '12px' }}
                                    >
                                        <div style={{ color: 'var(--md-sys-color-primary)' }}>{link.icon}</div>
                                        <span style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)', color: 'var(--md-sys-color-on-surface)' }}>{link.label}</span>
                                    </button>
                                ))}
                            </div>
                        </MD3Card>

                        {/* System Info */}
                        <MD3Card headline="System Info">
                            <div className="flex flex-col" style={{ gap: 'var(--md-sys-spacing-gap-sm, 8px)' }}>
                                <SettingRow label="Version" value="v2.0.1" />
                                <SettingRow label="Build" value="2026.01.04" />
                                <SettingRow label="Env" value="Production" valueColor="var(--md-sys-color-primary)" />
                            </div>
                        </MD3Card>

                        {/* Account */}
                        <MD3Card headline="Account">
                            <div className="flex flex-col" style={{ gap: 'var(--md-sys-spacing-gap-sm, 8px)' }}>
                                <SettingRow label="Plan" value="Enterprise" valueColor="var(--md-sys-color-tertiary)" />
                                <SettingRow label="Users" value="12 / 50" />
                                <SettingRow label="Storage" value="42GB / 100GB" />
                            </div>
                        </MD3Card>
                    </>
                }
            />
        </>
    );
}

function SettingRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
    return (
        <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
            <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-body-medium-size)' }}>{label}</span>
            <span style={{ color: valueColor || 'var(--md-sys-color-on-surface)', fontWeight: 500 }}>{value}</span>
        </div>
    );
}
