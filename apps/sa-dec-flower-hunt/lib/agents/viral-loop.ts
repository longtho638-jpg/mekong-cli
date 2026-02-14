import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export interface ReferralCode {
    code: string
    user_email: string
    user_name: string
    uses_count: number
    credits_earned: number
    is_active: boolean
}

export class ViralLoopAgent {
    private supabase

    constructor() {
        this.supabase = createClient(supabaseUrl, supabaseServiceKey)
    }

    // Generate unique referral code
    generateCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No confusing chars like 0/O, 1/I
        let code = 'HOA' // Prefix for brand recognition
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
    }

    // Create referral code for a user
    async createReferralCode(userId: string, email: string, name: string): Promise<ReferralCode> {
        let code = this.generateCode()
        let attempts = 0

        // Ensure unique code
        while (attempts < 5) {
            const { data: existing } = await this.supabase
                .from('referral_codes')
                .select('code')
                .eq('code', code)
                .single()

            if (!existing) break
            code = this.generateCode()
            attempts++
        }

        const { data, error } = await this.supabase
            .from('referral_codes')
            .insert({
                code,
                user_id: userId,
                user_email: email,
                user_name: name,
                discount_amount: 50000, // 50k for referred user
                reward_amount: 50000   // 50k for referrer
            })
            .select()
            .single()

        if (error) throw error

        return data
    }

    // Use a referral code (when someone makes a purchase)
    async useReferralCode(code: string, referredEmail: string, orderId: string): Promise<{
        success: boolean
        discount: number
        referrerReward: number
        referrerEmail?: string
        message: string
    }> {
        // Check if code exists and is active
        const { data: referralCode, error: codeError } = await this.supabase
            .from('referral_codes')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single()

        if (codeError || !referralCode) {
            return { success: false, discount: 0, referrerReward: 0, message: 'Mã giới thiệu không hợp lệ' }
        }

        // Check if not expired
        if (new Date(referralCode.expires_at) < new Date()) {
            return { success: false, discount: 0, referrerReward: 0, message: 'Mã giới thiệu đã hết hạn' }
        }

        // Check if max uses reached
        if (referralCode.uses_count >= referralCode.max_uses) {
            return { success: false, discount: 0, referrerReward: 0, message: 'Mã giới thiệu đã hết lượt sử dụng' }
        }

        // Check if email already used a referral
        const { data: existingUse } = await this.supabase
            .from('referral_uses')
            .select('id')
            .eq('referred_email', referredEmail)
            .single()

        if (existingUse) {
            return { success: false, discount: 0, referrerReward: 0, message: 'Email này đã sử dụng mã giới thiệu trước đó' }
        }

        // Record the use
        await this.supabase.from('referral_uses').insert({
            referral_code: code.toUpperCase(),
            referred_email: referredEmail,
            order_id: orderId,
            discount_applied: referralCode.discount_amount,
            reward_given: referralCode.reward_amount
        })

        // Update referral code stats
        await this.supabase
            .from('referral_codes')
            .update({
                uses_count: referralCode.uses_count + 1,
                credits_earned: referralCode.credits_earned + referralCode.reward_amount
            })
            .eq('code', code.toUpperCase())

        // Update daily metrics
        await this.updateDailyMetrics()

        return {
            success: true,
            discount: referralCode.discount_amount,
            referrerReward: referralCode.reward_amount,
            referrerEmail: referralCode.user_email,
            message: `Giảm ${(referralCode.discount_amount / 1000).toFixed(0)}k thành công!`
        }
    }

    // Get referral stats for a user
    async getReferralStats(userEmail: string): Promise<{
        code: string
        usesCount: number
        creditsEarned: number
        referrals: { email: string; date: string }[]
    } | null> {
        const { data: referralCode } = await this.supabase
            .from('referral_codes')
            .select('*')
            .eq('user_email', userEmail)
            .single()

        if (!referralCode) return null

        const { data: uses } = await this.supabase
            .from('referral_uses')
            .select('referred_email, created_at')
            .eq('referral_code', referralCode.code)
            .order('created_at', { ascending: false })

        return {
            code: referralCode.code,
            usesCount: referralCode.uses_count,
            creditsEarned: referralCode.credits_earned,
            referrals: (uses || []).map(u => ({
                email: u.referred_email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
                date: new Date(u.created_at).toLocaleDateString('vi-VN')
            }))
        }
    }

    // Create shareable message for referral
    getShareMessage(code: string, userName: string): {
        whatsapp: string
        sms: string
        facebook: string
    } {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agrios.tech'
        const link = `${baseUrl}?ref=${code}`

        return {
            whatsapp: `🌸 ${userName} tặng bạn 50k mua hoa Tết!\n\nDùng mã ${code} hoặc click link:\n${link}\n\n🌺 Hoa tươi từ Sa Đéc, ship trong 6 giờ!`,
            sms: `${userName} tang ban 50k mua hoa Tet! Dung ma ${code} tai ${link}`,
            facebook: `Mình vừa đặt hoa Tết từ làng hoa Sa Đéc, tươi thật sự! 🌸\n\nTặng bạn mã giảm 50k: ${code}\n\nĐặt tại: ${link}`
        }
    }

    private async updateDailyMetrics(): Promise<void> {
        const today = new Date().toISOString().split('T')[0]

        try {
            await this.supabase.rpc('increment_metric', {
                metric_date: today,
                metric_name: 'referral_orders',
                increment_by: 1
            })
        } catch {
            // If RPC doesn't exist, update directly
            await this.supabase
                .from('growth_metrics')
                .upsert({
                    date: today,
                    referral_orders: 1
                }, {
                    onConflict: 'date'
                })
        }
    }

    // Auto-generate referral code after purchase
    async onPurchaseComplete(orderId: string, userEmail: string, userName: string): Promise<{
        referralCode: ReferralCode
        shareMessages: { whatsapp: string; sms: string; facebook: string }
    }> {
        // Check if user already has a code
        let { data: existingCode } = await this.supabase
            .from('referral_codes')
            .select('*')
            .eq('user_email', userEmail)
            .single()

        if (!existingCode) {
            existingCode = await this.createReferralCode(orderId, userEmail, userName)
        }

        return {
            referralCode: existingCode,
            shareMessages: this.getShareMessage(existingCode.code, userName)
        }
    }
}

// Execute function for API route
export async function processReferral(code: string, email: string, orderId: string) {
    const agent = new ViralLoopAgent()
    return agent.useReferralCode(code, email, orderId)
}

export async function createReferralForUser(userId: string, email: string, name: string) {
    const agent = new ViralLoopAgent()
    return agent.createReferralCode(userId, email, name)
}

export async function onPurchase(orderId: string, email: string, name: string) {
    const agent = new ViralLoopAgent()
    return agent.onPurchaseComplete(orderId, email, name)
}
