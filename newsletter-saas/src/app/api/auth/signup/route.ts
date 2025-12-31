import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/auth/signup - Handle signup with referral
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        const { email, password, name, plan = 'free', referral_code } = body

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        // Sign up user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    plan,
                    referral_code // Store for processing after org creation
                }
            }
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // If referral code provided, process after trigger creates org
        if (referral_code && data.user) {
            // This will be processed by a database trigger
            // For now, we just note that a referral was used
        }

        return NextResponse.json({
            user: data.user,
            message: 'Check your email for confirmation'
        }, { status: 201 })
    } catch (error) {
        console.error('Signup error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
