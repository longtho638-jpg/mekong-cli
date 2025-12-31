"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // Check if Supabase is configured
        if (!supabaseUrl || !supabaseKey) {
            // Demo mode fallback
            await new Promise(resolve => setTimeout(resolve, 1000));
            localStorage.setItem("user", JSON.stringify({
                email,
                name: email.split("@")[0],
                plan: "pro"
            }));
            router.push("/dashboard");
            return;
        }

        try {
            // Dynamic import to avoid build-time errors
            const { createBrowserClient } = await import('@supabase/ssr');
            const supabase = createBrowserClient(supabaseUrl, supabaseKey);

            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                setError(authError.message);
                setLoading(false);
                return;
            }

            if (data.user) {
                localStorage.setItem("user", JSON.stringify({
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.name || email.split("@")[0],
                }));
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("An unexpected error occurred");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <Link href="/" className="text-3xl font-bold gradient-text inline-block mb-2">
                        📧 Mekong Mail
                    </Link>
                    <h1 className="text-2xl font-semibold mt-4">Welcome back</h1>
                    <p className="text-gray-400 mt-2">Sign in to your account</p>
                </div>

                <form onSubmit={handleLogin} className="glass rounded-2xl p-8">
                    <div className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-[#12121a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="you@agency.com"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-[#12121a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="rounded bg-[#12121a] border-gray-600" />
                                <span className="text-gray-400">Remember me</span>
                            </label>
                            <Link href="/forgot-password" className="text-indigo-400 hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="animate-spin">⏳</span>
                            ) : (
                                <>Sign In →</>
                            )}
                        </button>
                    </div>
                </form>

                <p className="text-center text-gray-400 mt-8">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-indigo-400 hover:underline">
                        Sign up free
                    </Link>
                </p>

                <p className="text-center text-yellow-500/70 text-xs mt-4">
                    🔧 Demo mode active - any credentials work
                </p>
            </div>
        </div>
    );
}
