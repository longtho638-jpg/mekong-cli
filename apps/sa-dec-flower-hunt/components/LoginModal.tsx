"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Mail, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const router = useRouter();
    const { t } = useLanguage();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const [isRedirecting, setIsRedirecting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!supabase) return;
            const { data: { user }, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (user) {
                // BYPASS FIX: Get role from user_metadata first (no DB query needed!)
                let role = user.user_metadata?.role || 'customer';

                // Fallback: Try profiles table if metadata doesn't have role
                if (!user.user_metadata?.role) {
                    try {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', user.id)
                            .single();
                        if (profile?.role) {
                            role = profile.role;
                        }
                    } catch (profileErr) {
                        console.warn("Profile fetch failed, using default role:", profileErr);
                        // Continue with default role
                    }
                }

                toast.success(t("auth.toast.success_login"));

                // Redirect logic based on role
                if (role === 'farmer') {
                    setIsRedirecting(true);
                    toast.loading(t("auth.toast.redirect_farmer"));
                    window.location.href = '/farmer';
                } else if (role === 'admin') {
                    setIsRedirecting(true);
                    toast.loading(t("auth.toast.redirect_admin"));
                    window.location.href = '/admin';
                } else {
                    // Customer: Redirect to Shop Dashboard
                    setIsRedirecting(true);
                    toast.loading(t("auth.toast.redirect_shop"));
                    window.location.href = '/shop';
                }
            }
        } catch (error: any) {
            console.error("Login Critical Error:", error);
            setErrorMsg(error.message || JSON.stringify(error)); // Capture for UI Debugger
            toast.error(error.message || t("auth.error.generic"));
            setLoading(false);
        } finally {
            if (!isRedirecting) {
                setLoading(false);
            }
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!supabase) return;
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    },
                },
            });

            if (error) throw error;

            toast.success(t("auth.toast.success_signup"));
            setMode('login');
        } catch (error: any) {
            toast.error(error.message || t("auth.error.generic"));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <Card className="w-full max-w-md bg-black border-emerald-500/30 text-emerald-50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-emerald-500/50 hover:text-emerald-400 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <CardHeader className="space-y-1 text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center mb-2 border border-emerald-500/20">
                        <Lock className="w-6 h-6 text-emerald-500" />
                    </div>
                    <CardTitle className="text-xl font-mono tracking-widest uppercase text-emerald-400">
                        {mode === 'login' ? t("auth.login.title") : t("auth.signup.title")}
                    </CardTitle>
                    <CardDescription className="font-mono text-[10px] text-emerald-600/70 tracking-[0.2em] uppercase">
                        Secure Connection // Encrypted
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Tabs */}
                    <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-emerald-900/10 rounded-lg border border-emerald-500/10">
                        <button
                            onClick={() => setMode('login')}
                            className={`py-2 text-xs font-mono font-bold uppercase transition-all rounded ${mode === 'login'
                                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                : 'text-emerald-600 hover:text-emerald-400'
                                }`}
                        >
                            {t("auth.tab.login")}
                        </button>
                        <button
                            onClick={() => setMode('signup')}
                            className={`py-2 text-xs font-mono font-bold uppercase transition-all rounded ${mode === 'signup'
                                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                : 'text-emerald-600 hover:text-emerald-400'
                                }`}
                        >
                            {t("auth.tab.signup")}
                        </button>
                    </div>

                    <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
                        {mode === 'signup' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono uppercase tracking-wider text-emerald-500/70 flex items-center gap-2">
                                    <User className="w-3 h-3" /> {t("auth.label.name")}
                                </label>
                                <Input
                                    type="text"
                                    placeholder={t("auth.placeholder.name")}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-emerald-900/10 border-emerald-500/30 text-emerald-100 placeholder:text-emerald-700/50 focus:border-emerald-500 focus:ring-emerald-500/20 font-mono"
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase tracking-wider text-emerald-500/70 flex items-center gap-2">
                                <Mail className="w-3 h-3" /> {t("auth.label.email")}
                            </label>
                            <Input
                                type="email"
                                placeholder={t("auth.placeholder.email")}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-emerald-900/10 border-emerald-500/30 text-emerald-100 placeholder:text-emerald-700/50 focus:border-emerald-500 focus:ring-emerald-500/20 font-mono"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase tracking-wider text-emerald-500/70 flex items-center gap-2">
                                <Lock className="w-3 h-3" /> {t("auth.label.password")}
                            </label>
                            <Input
                                type="password"
                                placeholder={t("auth.placeholder.password")}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-emerald-900/10 border-emerald-500/30 text-emerald-100 placeholder:text-emerald-700/50 focus:border-emerald-500 focus:ring-emerald-500/20 font-mono"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-mono font-bold uppercase tracking-wider mt-6 border border-emerald-400 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            {loading ? t("auth.btn.processing") : (mode === 'login' ? t("auth.btn.login") : t("auth.btn.signup"))}
                        </Button>

                        {/* Quick Demo Login (Dev Only) */}
                        <div className="pt-4 border-t border-emerald-900/30 grid grid-cols-3 gap-2">
                            <button
                                onClick={() => { setEmail('customer@demo.com'); setPassword('123456'); }}
                                className="text-[9px] font-mono text-emerald-700 hover:text-emerald-500 hover:bg-emerald-900/20 py-1 rounded border border-transparent hover:border-emerald-500/20 transition-all uppercase"
                            >
                                {t("auth.demo.customer")}
                            </button>
                            <button
                                onClick={() => { setEmail('farmer@demo.com'); setPassword('123456'); }}
                                className="text-[9px] font-mono text-emerald-700 hover:text-emerald-500 hover:bg-emerald-900/20 py-1 rounded border border-transparent hover:border-emerald-500/20 transition-all uppercase"
                            >
                                {t("auth.demo.farmer")}
                            </button>
                            <button
                                onClick={() => { setEmail('admin@demo.com'); setPassword('123456'); }}
                                className="text-[9px] font-mono text-emerald-700 hover:text-emerald-500 hover:bg-emerald-900/20 py-1 rounded border border-transparent hover:border-emerald-500/20 transition-all uppercase"
                            >
                                {t("auth.demo.admin")}
                            </button>
                        </div>

                        <div className="text-center mt-4">
                            <p className="text-[10px] text-emerald-600/60 font-mono">
                                {mode === 'login' ? t("auth.switch.signup") : t("auth.switch.login")}
                            </p>
                        </div>

                        {/* DEBUG: Error Details for "Deep Debugger" */}
                        {errorMsg && (
                            <div className="mt-4 p-2 bg-red-950/50 border border-red-500/30 rounded text-left overflow-hidden">
                                <p className="text-[10px] text-red-400 font-bold mb-1">DEBUG INFO:</p>
                                <pre className="text-[9px] text-red-300 font-mono whitespace-pre-wrap break-all">
                                    {errorMsg}
                                </pre>
                                <p className="text-[9px] text-stone-500 mt-1 italic">Take a screenshot of this if error persists.</p>
                            </div>
                        )}

                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
