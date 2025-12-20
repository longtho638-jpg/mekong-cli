'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [agencyName, setAgencyName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: {
                    agency_name: agencyName,
                },
            },
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            setSuccess(true)
            setLoading(false)
        }
    }

    const handleGoogleSignup = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) setError(error.message)
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center animate-scale-in">
                    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
                        <div className="text-6xl mb-4">📧</div>
                        <h2 className="text-2xl font-bold text-white mb-2">Check your email!</h2>
                        <p className="text-gray-400 mb-6">
                            We&apos;ve sent a confirmation link to <span className="text-purple-400">{email}</span>
                        </p>
                        <Link
                            href="/auth/login"
                            className="inline-block px-6 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white hover:bg-gray-700 transition-colors"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-fade-in-up">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                        🏯 Agency OS
                    </h1>
                    <p className="text-gray-400 mt-2">Create your professional agency account</p>
                </div>

                {/* Card */}
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
                    <form onSubmit={handleSignup} className="space-y-5">
                        {/* Error */}
                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Agency Name */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Agency Name</label>
                            <input
                                type="text"
                                value={agencyName}
                                onChange={e => setAgencyName(e.target.value)}
                                placeholder="Your Agency Name"
                                required
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@agency.com"
                                required
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Min 8 characters"
                                required
                                minLength={8}
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                        </div>

                        {/* Terms */}
                        <p className="text-xs text-gray-500">
                            By signing up, you agree to our{' '}
                            <Link href="/terms" className="text-purple-400 hover:underline">Terms</Link>
                            {' '}and{' '}
                            <Link href="/privacy" className="text-purple-400 hover:underline">Privacy Policy</Link>
                        </p>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-gray-700"></div>
                        <span className="text-gray-500 text-sm">or</span>
                        <div className="flex-1 h-px bg-gray-700"></div>
                    </div>

                    {/* OAuth */}
                    <button
                        onClick={handleGoogleSignup}
                        className="w-full py-3 bg-gray-700/50 border border-gray-600 rounded-xl font-medium text-white hover:bg-gray-700 transition-colors flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
