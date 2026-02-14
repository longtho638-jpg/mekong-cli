import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Content templates for different platforms
const TIKTOK_TEMPLATES = [
    {
        hook: "5 giờ sáng ở làng hoa Sa Đéc...",
        body: "Khi bạn còn đang ngủ, nông dân chúng tôi đã bắt đầu cắt những bông hoa tươi nhất. Để khi Tết đến, nhà bạn rực rỡ nhất xóm!",
        cta: "Link in bio để đặt hoa Tết 🌸",
        hashtags: ["#TetSapDen", "#HoaTet2026", "#SaDec", "#MaiVang", "#HoaTuoi"]
    },
    {
        hook: "Tại sao hoa Sa Đéc tươi lâu hơn?",
        body: "Bí mật là: cắt sáng sớm khi sương còn đọng, vận chuyển cold-chain 2-8°C, từ vườn đến nhà chỉ 6 giờ. Không qua trung gian!",
        cta: "Đặt hoa fresh nhất tại link bio 🌺",
        hashtags: ["#HoaSaDec", "#HoaTuoi", "#ColdChain", "#TetNguyen"]
    },
    {
        hook: "POV: Bạn là bông mai vàng...",
        body: "Được chăm sóc 365 ngày, được cắt vào đúng khoảnh khắc đẹp nhất, được đóng gói cẩn thận, để rồi nở rộ trong nhà bạn đúng mùng 1 Tết 🧧",
        cta: "Pre-order mai Tết ngay hôm nay!",
        hashtags: ["#MaiVang", "#Tet2026", "#HoaTet", "#SaDec"]
    },
    {
        hook: "40 năm trồng mai, chú Hai chia sẻ...",
        body: "\"Mỗi bông mai như một đứa con. Tôi biết đúng lúc nào nó đẹp nhất để cắt cho khách.\" - Chú Hai, nông dân 60 tuổi, Tân Quy Đông",
        cta: "Mua hoa trực tiếp từ nông dân 👨‍🌾",
        hashtags: ["#NongDanVietNam", "#HoaSaDec", "#StoryTelling"]
    },
    {
        hook: "Countdown Tết: Còn {days} ngày!",
        body: "Free ship cho 50 đơn đầu tiên hôm nay. Hoa được cắt sáng mai, đến tay bạn chiều mai. Fresh như vừa hái!",
        cta: "Nhanh tay kẻo hết! 🏃‍♂️",
        hashtags: ["#TetCountdown", "#FreeShip", "#HoaTet2026"]
    }
]

const FACEBOOK_TEMPLATES = [
    {
        title: "🌸 Hoa Tết 2026 - Đặt sớm giá tốt!",
        body: `Năm nay, hãy để nhà bạn rực rỡ với hoa tươi từ làng hoa Sa Đéc!

✅ Cắt sáng sớm khi sương còn đọng
✅ Vận chuyển cold-chain, tươi từ vườn đến nhà
✅ Giao trong 6 giờ khu vực HCM
✅ FREE SHIP 50 đơn đầu tiên!

🎁 Ưu đãi đặc biệt: Giảm thêm 20% cho đơn từ 500k

Đặt ngay: [link]`,
        hashtags: ["#HoaTet2026", "#SaDec", "#HoaTuoi"]
    },
    {
        title: "👨‍🌾 Gặp gỡ nông dân trồng hoa của bạn",
        body: `Bạn có bao giờ tự hỏi ai đã trồng bông hoa trong nhà mình?

Tại AGRIOS.tech, bạn có thể:
📞 Gọi VIDEO trực tiếp với nông dân
📍 Xem vườn hoa LIVE 24/7
📦 Tracking cold-chain từ vườn đến nhà

Mua hoa không chỉ là mua sản phẩm - đó là mua cả câu chuyện! 🌺

Trải nghiệm ngay: [link]`,
        hashtags: ["#FarmToTable", "#Traceability", "#HoaSaDec"]
    }
]

const BLOG_TOPICS = [
    {
        title: "Cách chọn mai vàng đẹp cho Tết 2026",
        outline: [
            "Giới thiệu về ý nghĩa mai vàng ngày Tết",
            "5 tiêu chí chọn mai đẹp (thân, cành, nụ, lá, rễ)",
            "Thời điểm tốt nhất để mua mai",
            "Chăm sóc mai để nở đúng mùng 1",
            "Các loại mai phổ biến và giá cả",
            "CTA: Đặt mai từ làng hoa Sa Đéc"
        ],
        keywords: ["mai vàng tết 2026", "cách chọn mai đẹp", "mai vàng sa đéc"]
    },
    {
        title: "Top 10 loại hoa Tết ý nghĩa nhất năm 2026",
        outline: [
            "Mai vàng - Phú quý, may mắn",
            "Đào - Trường thọ, bình an",
            "Cúc vạn thọ - Sống lâu",
            "Lan hồ điệp - Sang trọng",
            "Và 6 loại khác...",
            "Bảng giá tham khảo",
            "CTA: Đặt combo hoa Tết"
        ],
        keywords: ["hoa tết 2026", "các loại hoa tết", "hoa may mắn"]
    },
    {
        title: "Vì sao hoa Sa Đéc tươi lâu hơn? Bí mật từ nông dân",
        outline: [
            "Lịch sử làng hoa Sa Đéc 100 năm",
            "Điều kiện thổ nhưỡng đặc biệt",
            "Kỹ thuật trồng và chăm sóc",
            "Quy trình thu hoạch 5AM",
            "Cold-chain logistics",
            "CTA: Trải nghiệm hoa fresh nhất"
        ],
        keywords: ["hoa sa đéc", "làng hoa sa đéc", "hoa tươi miền tây"]
    }
]

export interface ContentGeneratorOutput {
    tiktok: { hook: string; body: string; cta: string; hashtags: string[] }[]
    facebook: { title: string; body: string; hashtags: string[] }[]
    blog: { title: string; outline: string[]; keywords: string[] }[]
}

export class ContentGeneratorAgent {
    private supabase

    constructor() {
        this.supabase = createClient(supabaseUrl, supabaseServiceKey)
    }

    // Generate content for today
    async generateDailyContent(): Promise<ContentGeneratorOutput> {
        const today = new Date()
        const tetDate = new Date('2026-01-29') // Mùng 1 Tết
        const daysUntilTet = Math.ceil((tetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        // Pick random templates
        const tiktokContent = this.pickRandom(TIKTOK_TEMPLATES, 2).map(t => ({
            ...t,
            body: t.body.replace('{days}', daysUntilTet.toString())
        }))

        const fbContent = this.pickRandom(FACEBOOK_TEMPLATES, 1)
        const blogContent = this.pickRandom(BLOG_TOPICS, 1)

        // Save to content_queue
        await this.saveToQueue('tiktok', tiktokContent)
        await this.saveToQueue('facebook', fbContent)
        await this.saveToQueue('blog', blogContent)

        return {
            tiktok: tiktokContent,
            facebook: fbContent,
            blog: blogContent
        }
    }

    private pickRandom<T>(arr: T[], count: number): T[] {
        const shuffled = [...arr].sort(() => 0.5 - Math.random())
        return shuffled.slice(0, count)
    }

    private async saveToQueue(type: string, contents: unknown[]) {
        for (const content of contents) {
            const c = content as Record<string, unknown>
            await this.supabase.from('content_queue').insert({
                type,
                title: c.title || c.hook,
                content: JSON.stringify(content),
                hashtags: c.hashtags || [],
                status: 'pending',
                scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
            })
        }
    }

    // Log agent run
    async logRun(status: 'completed' | 'failed', output: unknown, error?: string) {
        await this.supabase.from('agent_runs').insert({
            agent_name: 'content',
            status,
            completed_at: new Date().toISOString(),
            output,
            error,
            items_processed: (output as ContentGeneratorOutput)?.tiktok?.length || 0
        })
    }
}

// Execute function for API route
export async function runContentGenerator() {
    const agent = new ContentGeneratorAgent()

    try {
        const output = await agent.generateDailyContent()
        await agent.logRun('completed', output)
        return { success: true, output }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        await agent.logRun('failed', null, errorMessage)
        return { success: false, error: errorMessage }
    }
}
