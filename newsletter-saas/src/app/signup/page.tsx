"use client";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SignupForm() {
    const searchParams = useSearchParams();
    const planParam = searchParams.get("plan") || "free";
    const refCode = searchParams.get("ref");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const planConfig: Record<string, { label: string; price: string }> = {
        free: { label: "Free", price: "$0/mo" },
        pro: { label: "Pro", price: "$29/mo" },
        agency: { label: "Agency", price: "$99/mo" },
    };

    const plan = planConfig[planParam] || planConfig.free;

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // Check if Supabase is configured
        if (!supabaseUrl || !supabaseKey) {
            // Demo mode fallback
            await new Promise(resolve => setTimeout(resolve, 1000));
            localStorage.setItem("user", JSON.stringify({ email, name, plan: planParam }));
            router.push("/dashboard");
            return;
        }

        try {
            // Dynamic import to avoid build-time errors
            const { createBrowserClient } = await import('@supabase/ssr');
            const supabase = createBrowserClient(supabaseUrl, supabaseKey);

            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        plan: planParam,
                        referred_by: refCode,
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                }
            });

            if (authError) {
                setError(authError.message);
                setLoading(false);
                return;
            }

            if (data.user) {
                if (data.user.identities?.length === 0) {
                    setError("This email is already registered");
                } else if (!data.session) {
                    setSuccess(true);
                } else {
                    localStorage.setItem("user", JSON.stringify({
                        id: data.user.id,
                        email: data.user.email,
                        name,
                        plan: planParam,
                    }));
                    router.push("/dashboard");
                    router.refresh();
                }
            }
        } catch (err) {
            setError("An unexpected error occurred");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md text-center">
                    <div className="text-6xl mb-6">📧</div>
                    <h1 className="text-2xl font-bold mb-4">Check your email!</h1>
                    <p className="text-gray-400 mb-6">
                        We sent a confirmation link to <strong className="text-white">{email}</strong>.
                        Click the link to activate your account.
                    </p>
                    <Link href="/login" className="text-indigo-400 hover:underline">
                        Back to login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <Link href="/" className="text-3xl font-bold gradient-text inline-block mb-2">
                        📧 Mekong Mail
                    </Link>
                    <h1 className="text-2xl font-semibold mt-4">Create your account</h1>
                    <div className="mt-4 inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30">
                        <span className="text-indigo-400 text-sm font-medium">
                            {plan.label} Plan • {plan.price}
                        </span>
                    </div>
                    {refCode && (
                        <div className="mt-2 text-green-400 text-sm">
                            🎁 Referral code applied: {refCode}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSignup} className="glass rounded-2xl p-8">
                    <div className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-2">Full name</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-[#12121a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2">Work email</label>
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
                            <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-[#12121a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="8+ characters"
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="text-sm text-gray-400">
                            By signing up, you agree to our{" "}
                            <Link href="/terms" className="text-indigo-400 hover:underline">Terms</Link>
                            {" "}and{" "}
                            <Link href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>.
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary flex items-center justify-center gap-2"
                        >
                            {loading ? <span className="animate-spin">⏳</span> : <>Create Account →</>}
                        </button>
                    </div>
                </form>

                <p className="text-center text-gray-400 mt-8">
                    Already have an account?{" "}
                    <Link href="/login" className="text-indigo-400 hover:underline">Sign in</Link>
                </p>

                <p className="text-center text-yellow-500/70 text-xs mt-4">
                    🔧 Demo mode active - signup auto-redirects
                </p>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <SignupForm />
        </Suspense>
    );
}
