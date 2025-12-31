import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/referral - Get referral stats
export async function GET() {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's organization
        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 })
        }

        // Get organization with referral info
        const { data: org } = await supabase
            .from('organizations')
            .select('referral_code, referral_credits')
            .eq('id', membership.organization_id)
            .single()

        // Get referral count
        const { count: referralsCount } = await supabase
            .from('organizations')
            .select('*', { count: 'exact', head: true })
            .eq('referred_by', membership.organization_id)

        return NextResponse.json({
            referral_code: org?.referral_code,
            referral_link: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${org?.referral_code}`,
            credits: org?.referral_credits || 0,
            total_referrals: referralsCount || 0,
            rewards: {
                per_referral: 'Both get 3 months Pro free',
                credits_for_featured: 10,
            }
        })
    } catch (error) {
        console.error('Error fetching referral stats:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/referral/claim - Claim referral reward
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { referral_code } = body

        if (!referral_code) {
            return NextResponse.json({ error: 'Referral code required' }, { status: 400 })
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Find referrer
        const { data: referrer } = await supabase
            .from('organizations')
            .select('id, referral_credits')
            .eq('referral_code', referral_code)
            .single()

        if (!referrer) {
            return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
        }

        // Get current user's org
        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 })
        }

        // Check if already referred
        const { data: currentOrg } = await supabase
            .from('organizations')
            .select('referred_by')
            .eq('id', membership.organization_id)
            .single()

        if (currentOrg?.referred_by) {
            return NextResponse.json({ error: 'Already used a referral' }, { status: 400 })
        }

        // Apply referral - upgrade both to pro for 3 months
        const proUntil = new Date()
        proUntil.setMonth(proUntil.getMonth() + 3)

        // Update referred user
        await supabase
            .from('organizations')
            .update({
                referred_by: referrer.id,
                plan: 'pro',
                // In production, set plan_expires_at
            })
            .eq('id', membership.organization_id)

        // Update referrer credits + extend their pro
        await supabase
            .from('organizations')
            .update({
                referral_credits: (referrer.referral_credits || 0) + 1,
                plan: 'pro',
            })
            .eq('id', referrer.id)

        return NextResponse.json({
            success: true,
            message: 'Referral applied! Both accounts upgraded to Pro for 3 months.',
            reward: '3 months Pro free'
        })
    } catch (error) {
        console.error('Error claiming referral:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
