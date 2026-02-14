import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const resendApiKey = process.env.RESEND_API_KEY

// Email sequence templates
const EMAIL_SEQUENCES = {
    welcome: [
        {
            step: 0,
            delay_hours: 0,
            subject: "🌸 Cảm ơn bạn đã đăng ký! Nhận ngay voucher 50k",
            template: `
        <h2>Chào {{name}}! 👋</h2>
        <p>Cảm ơn bạn đã quan tâm đến hoa tươi từ làng hoa Sa Đéc.</p>
        <p><strong>🎁 Quà tặng cho bạn:</strong></p>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; text-align: center;">
          <p style="font-size: 24px; font-weight: bold; color: #059669;">WELCOME50</p>
          <p>Giảm 50,000đ cho đơn hàng đầu tiên</p>
        </div>
        <p style="margin-top: 20px;">
          <a href="{{shop_url}}" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
            Mua hoa ngay →
          </a>
        </p>
      `
        },
        {
            step: 1,
            delay_hours: 24,
            subject: "🌺 Tại sao hoa Sa Đéc đặc biệt?",
            template: `
        <h2>{{name}} ơi,</h2>
        <p>Bạn có biết hoa Sa Đéc được trồng như thế nào không?</p>
        <ul>
          <li>🌅 Cắt lúc 5 giờ sáng khi sương còn đọng</li>
          <li>❄️ Vận chuyển cold-chain 2-8°C</li>
          <li>🚚 Từ vườn đến nhà chỉ trong 6 giờ</li>
          <li>👨‍🌾 Mua trực tiếp từ nông dân, không qua trung gian</li>
        </ul>
        <p>Và bạn còn có thể <strong>gọi VIDEO trực tiếp</strong> với nông dân để chọn hoa!</p>
        <p>
          <a href="{{video_call_url}}" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
            Thử gọi video ngay →
          </a>
        </p>
      `
        },
        {
            step: 2,
            delay_hours: 72,
            subject: "🧧 Tết đang đến - Đặt sớm giảm 20%!",
            template: `
        <h2>{{name}}, Tết chỉ còn {{days_until_tet}} ngày nữa thôi!</h2>
        <p>Đặt hoa Tết sớm để:</p>
        <ul>
          <li>✅ Chọn được hoa đẹp nhất (hàng tốt hết nhanh!)</li>
          <li>✅ Giá ưu đãi trước Tết</li>
          <li>✅ Free shipping đơn từ 300k</li>
        </ul>
        <p><strong>🔥 Ưu đãi đặc biệt cho bạn:</strong></p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 10px; text-align: center; border: 2px dashed #dc2626;">
          <p style="font-size: 24px; font-weight: bold; color: #dc2626;">TET20</p>
          <p>Giảm 20% cho đơn từ 500k</p>
          <p style="font-size: 12px; color: #666;">Hết hạn: 31/12/2025</p>
        </div>
        <p style="margin-top: 20px;">
          <a href="{{shop_url}}?code=TET20" style="background: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
            Đặt hoa Tết ngay →
          </a>
        </p>
      `
        },
        {
            step: 3,
            delay_hours: 168, // 7 days
            subject: "⏰ Cuối cùng! Free ship kết thúc ngày mai",
            template: `
        <h2>{{name}}, đây là email cuối cùng về ưu đãi này!</h2>
        <p>Chương trình <strong>FREE SHIPPING</strong> sẽ kết thúc vào ngày mai.</p>
        <p>Sau đó, phí ship sẽ là 30-50k tùy khu vực.</p>
        <p><strong>Bạn sẽ tiết kiệm được 50k nếu đặt hôm nay!</strong></p>
        <p>
          <a href="{{shop_url}}" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
            Đặt hoa ngay (Free ship) →
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          P/S: Nếu bạn không muốn nhận email nữa, 
          <a href="{{unsubscribe_url}}">click đây để hủy đăng ký</a>.
        </p>
      `
        }
    ],

    abandoned_cart: [
        {
            step: 0,
            delay_hours: 1,
            subject: "🌸 Bạn quên gì đó trong giỏ hàng...",
            template: `
        <h2>{{name}} ơi,</h2>
        <p>Bạn có một giỏ hàng chưa thanh toán với những bông hoa tươi đang chờ!</p>
        <p><strong>🎁 Bonus:</strong> Dùng mã <strong>COMEBACK10</strong> để giảm thêm 10%</p>
        <p>
          <a href="{{cart_url}}" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
            Quay lại giỏ hàng →
          </a>
        </p>
      `
        }
    ]
}

export class LeadNurtureAgent {
    private supabase

    constructor() {
        this.supabase = createClient(supabaseUrl, supabaseServiceKey)
    }

    // Start email sequence for a lead
    async startSequence(leadId: string, sequenceName: 'welcome' | 'abandoned_cart') {
        const sequence = EMAIL_SEQUENCES[sequenceName]
        if (!sequence) throw new Error(`Unknown sequence: ${sequenceName}`)

        // Check if already in sequence
        const { data: existing } = await this.supabase
            .from('email_sequences')
            .select('id')
            .eq('lead_id', leadId)
            .eq('sequence_name', sequenceName)
            .single()

        if (existing) {
            console.log(`Lead ${leadId} already in sequence ${sequenceName}`)
            return existing
        }

        // Create sequence entry
        const { data, error } = await this.supabase
            .from('email_sequences')
            .insert({
                lead_id: leadId,
                sequence_name: sequenceName,
                current_step: 0,
                total_steps: sequence.length,
                next_send_at: new Date().toISOString() // Send first email immediately
            })
            .select()
            .single()

        if (error) throw error

        return data
    }

    // Process pending emails (run hourly)
    async processPendingEmails(): Promise<{ sent: number; errors: number }> {
        let sent = 0
        let errors = 0

        // Get sequences that need to send
        const { data: pendingSequences } = await this.supabase
            .from('email_sequences')
            .select(`
        *,
        leads (id, email, name)
      `)
            .eq('completed', false)
            .eq('paused', false)
            .lte('next_send_at', new Date().toISOString())
            .limit(50)

        if (!pendingSequences || pendingSequences.length === 0) {
            return { sent: 0, errors: 0 }
        }

        for (const seq of pendingSequences) {
            try {
                const sequence = EMAIL_SEQUENCES[seq.sequence_name as keyof typeof EMAIL_SEQUENCES]
                if (!sequence) continue

                const emailTemplate = sequence[seq.current_step]
                if (!emailTemplate) {
                    // Sequence complete
                    await this.markCompleted(seq.id)
                    continue
                }

                // Send email
                await this.sendEmail(
                    seq.leads.email,
                    emailTemplate.subject,
                    this.renderTemplate(emailTemplate.template, {
                        name: seq.leads.name || 'Bạn',
                        shop_url: process.env.NEXT_PUBLIC_APP_URL || 'https://agrios.tech',
                        video_call_url: `${process.env.NEXT_PUBLIC_APP_URL}/video`,
                        days_until_tet: this.getDaysUntilTet().toString(),
                        unsubscribe_url: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?id=${seq.lead_id}`
                    })
                )

                // Update sequence
                const nextStep = seq.current_step + 1
                const isComplete = nextStep >= sequence.length
                const nextEmail = sequence[nextStep]
                const nextSendAt = nextEmail
                    ? new Date(Date.now() + nextEmail.delay_hours * 60 * 60 * 1000).toISOString()
                    : null

                await this.supabase
                    .from('email_sequences')
                    .update({
                        current_step: nextStep,
                        last_sent_at: new Date().toISOString(),
                        next_send_at: nextSendAt,
                        completed: isComplete
                    })
                    .eq('id', seq.id)

                sent++
            } catch (error) {
                console.error(`Failed to send email for sequence ${seq.id}:`, error)
                errors++
            }
        }

        // Update daily metrics
        await this.updateMetrics(sent)

        return { sent, errors }
    }

    private async sendEmail(to: string, subject: string, html: string) {
        if (!resendApiKey) {
            console.log(`[Demo] Would send email to ${to}: ${subject}`)
            return
        }

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'AGRIOS.tech <hoa@agrios.tech>',
                to: [to],
                subject,
                html
            })
        })

        if (!response.ok) {
            throw new Error(`Failed to send email: ${response.statusText}`)
        }

        return response.json()
    }

    private renderTemplate(template: string, vars: Record<string, string>): string {
        let result = template
        for (const [key, value] of Object.entries(vars)) {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
        }
        return result
    }

    private getDaysUntilTet(): number {
        const tetDate = new Date('2026-01-29')
        const today = new Date()
        return Math.ceil((tetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    private async markCompleted(sequenceId: string) {
        await this.supabase
            .from('email_sequences')
            .update({ completed: true })
            .eq('id', sequenceId)
    }

    private async updateMetrics(emailsSent: number) {
        const today = new Date().toISOString().split('T')[0]

        const { data: existing } = await this.supabase
            .from('growth_metrics')
            .select('emails_sent')
            .eq('date', today)
            .single()

        await this.supabase
            .from('growth_metrics')
            .upsert({
                date: today,
                emails_sent: (existing?.emails_sent || 0) + emailsSent
            }, { onConflict: 'date' })
    }

    // Log agent run
    async logRun(status: 'completed' | 'failed', output: unknown, error?: string) {
        await this.supabase.from('agent_runs').insert({
            agent_name: 'nurture',
            status,
            completed_at: new Date().toISOString(),
            output,
            error
        })
    }
}

// Execute function for API route
export async function runLeadNurture() {
    const agent = new LeadNurtureAgent()

    try {
        const result = await agent.processPendingEmails()
        await agent.logRun('completed', result)
        return { success: true, ...result }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        await agent.logRun('failed', null, errorMessage)
        return { success: false, error: errorMessage }
    }
}

export async function startWelcomeSequence(leadId: string) {
    const agent = new LeadNurtureAgent()
    return agent.startSequence(leadId, 'welcome')
}
