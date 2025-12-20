'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Settings, Bell, Lock, Palette } from 'lucide-react';

export default function SettingsPage({ params: { locale } }: { params: { locale: string } }) {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono">
            <nav className="fixed top-0 w-full z-50 border-b border-purple-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-2 text-purple-400">
                    <Shield className="w-5 h-5" />
                    <span className="font-bold">AGENCY OS</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/20 border border-purple-500/30 rounded">SETTINGS</span>
                </div>
                <div className="flex gap-2">
                    {['en', 'vi', 'zh'].map((l) => (
                        <button key={l} onClick={() => router.push(pathname.replace(`/${locale}`, `/${l}`))} className={`px-3 py-1 text-xs rounded ${locale === l ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500'}`}>{l.toUpperCase()}</button>
                    ))}
                </div>
            </nav>
            <main className="pt-24 px-6 max-w-[1400px] mx-auto pb-20">
                <h1 className="text-4xl font-bold mb-8 text-purple-400">⚙️ Settings</h1>

                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Settings className="w-6 h-6 text-purple-400" />
                            <h2 className="text-xl font-bold">General</h2>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400">Language</span>
                                <span className="text-white">{locale.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400">Theme</span>
                                <span className="text-white">Fintech Dark</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-400">Timezone</span>
                                <span className="text-white">UTC+7</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Bell className="w-6 h-6 text-blue-400" />
                            <h2 className="text-xl font-bold">Notifications</h2>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400">Email Alerts</span>
                                <span className="text-green-400">Enabled</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400">Push Notifications</span>
                                <span className="text-green-400">Enabled</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-400">Slack Integration</span>
                                <span className="text-gray-500">Disabled</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="w-6 h-6 text-red-400" />
                            <h2 className="text-xl font-bold">Security</h2>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400">2FA</span>
                                <span className="text-green-400">Active</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400">Last Login</span>
                                <span className="text-white">2 hours ago</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-400">API Keys</span>
                                <span className="text-white">3 active</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Palette className="w-6 h-6 text-pink-400" />
                            <h2 className="text-xl font-bold">Appearance</h2>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400">Color Scheme</span>
                                <span className="text-white">Pro Max Dark</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400">Font</span>
                                <span className="text-white">JetBrains Mono</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-400">Density</span>
                                <span className="text-white">High</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
