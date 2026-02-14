import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// =============================================================================
// TIKTOK VIRAL CONTENT FRAMEWORK
// =============================================================================

const TIKTOK_HOOKS = {
    // High-performing hooks based on research
    curiosity: [
        "Bạn sẽ không tin điều này về {topic}...",
        "Tại sao {topic} lại {outcome}? Đây là lý do...",
        "POV: Bạn là {subject}...",
        "Chỉ có 1% người biết bí mật này về {topic}...",
    ],

    storytelling: [
        "Ngày xưa, ở làng hoa Sa Đéc...",
        "Câu chuyện về bông {flower} này sẽ làm bạn xúc động...",
        "{number} năm trồng hoa, đây là bài học lớn nhất...",
    ],

    challenge: [
        "Thử thách: Đoán giá bông hoa này!",
        "Ai đoán đúng giờ hoa nở?",
        "So sánh hoa siêu thị vs hoa vườn - Kết quả bất ngờ!",
    ],

    behind_scenes: [
        "5 giờ sáng ở vườn hoa Sa Đéc...",
        "A day in the life của nông dân trồng mai...",
        "Hậu trường đóng gói hoa ship đi Sài Gòn...",
    ],

    educational: [
        "3 mẹo giữ hoa tươi 7 ngày (ai cũng làm được)...",
        "Sai lầm #1 khi mua hoa Tết...",
        "Cách chọn mai vàng nở đúng ngày...",
    ]
}

const TIKTOK_TRENDING_SOUNDS = [
    'original sound - trending 2024',
    'Nhạc không lời thư giãn',
    'Aesthetic morning vlog music',
    'Vietnam traditional remix',
    'Lo-fi beats Vietnamese',
]

const CONTENT_PILLARS = {
    pillar1_behind_scenes: {
        name: '🌅 Hậu trường vườn hoa',
        frequency: '2x/tuần',
        examples: [
            '5AM harvest routine',
            'Nông dân day in the life',
            'Packing & shipping process',
        ]
    },
    pillar2_educational: {
        name: '📚 Tips & hướng dẫn',
        frequency: '2x/tuần',
        examples: [
            'Cách chọn hoa đẹp',
            'Bảo quản hoa tươi lâu',
            'Ý nghĩa các loại hoa',
        ]
    },
    pillar3_storytelling: {
        name: '💝 Câu chuyện cảm động',
        frequency: '1x/tuần',
        examples: [
            'Farmer interview',
            'Customer reaction',
            'Flower journey story',
        ]
    },
    pillar4_trending: {
        name: '🔥 Trending challenges',
        frequency: '1x/tuần',
        examples: [
            'Price guess challenge',
            'Before/after timelapse',
            'Trend remake with flowers',
        ]
    },
    pillar5_product: {
        name: '🛍️ Sản phẩm/Promo',
        frequency: '1x/tuần',
        examples: [
            'New collection reveal',
            'Limited edition drops',
            'Sale announcement',
        ]
    }
}

export interface TikTokScript {
    hook: string
    body: string
    cta: string
    hashtags: string[]
    duration_seconds: number
    sound_suggestion: string
    content_pillar: string
    posting_time: string
}

export class TikTokViralAgent {
    private supabase

    constructor() {
        this.supabase = createClient(supabaseUrl, supabaseServiceKey)
    }

    // Generate a week of TikTok content
    async generateWeeklyContent(): Promise<TikTokScript[]> {
        const scripts: TikTokScript[] = []

        // 7 videos per week, following content pillars
        const weekPlan = [
            { day: 'Mon', pillar: 'pillar1_behind_scenes', time: '6:00 AM' },
            { day: 'Tue', pillar: 'pillar2_educational', time: '7:00 PM' },
            { day: 'Wed', pillar: 'pillar1_behind_scenes', time: '6:00 AM' },
            { day: 'Thu', pillar: 'pillar2_educational', time: '7:00 PM' },
            { day: 'Fri', pillar: 'pillar3_storytelling', time: '12:00 PM' },
            { day: 'Sat', pillar: 'pillar4_trending', time: '10:00 AM' },
            { day: 'Sun', pillar: 'pillar5_product', time: '8:00 PM' },
        ]

        for (const plan of weekPlan) {
            const script = this.generateScript(plan.pillar, plan.time)
            scripts.push(script)
            await this.saveScript(script)
        }

        return scripts
    }

    private generateScript(pillarKey: string, postingTime: string): TikTokScript {
        const pillar = CONTENT_PILLARS[pillarKey as keyof typeof CONTENT_PILLARS]

        // Select appropriate hook type based on pillar
        let hookType: keyof typeof TIKTOK_HOOKS
        switch (pillarKey) {
            case 'pillar1_behind_scenes':
                hookType = 'behind_scenes'
                break
            case 'pillar2_educational':
                hookType = 'educational'
                break
            case 'pillar3_storytelling':
                hookType = 'storytelling'
                break
            case 'pillar4_trending':
                hookType = 'challenge'
                break
            default:
                hookType = 'curiosity'
        }

        const hooks = TIKTOK_HOOKS[hookType]
        const hook = this.fillTemplate(hooks[Math.floor(Math.random() * hooks.length)])

        return {
            hook,
            body: this.generateBody(pillarKey),
            cta: this.generateCTA(pillarKey),
            hashtags: this.generateHashtags(pillarKey),
            duration_seconds: this.getDuration(pillarKey),
            sound_suggestion: TIKTOK_TRENDING_SOUNDS[Math.floor(Math.random() * TIKTOK_TRENDING_SOUNDS.length)],
            content_pillar: pillar.name,
            posting_time: postingTime
        }
    }

    private fillTemplate(template: string): string {
        const replacements: Record<string, string[]> = {
            '{topic}': ['hoa tết', 'mai vàng', 'hoa Sa Đéc', 'cold chain', 'nông dân'],
            '{outcome}': ['tươi lâu hơn', 'đắt như vậy', 'nở đúng ngày'],
            '{subject}': ['bông mai vàng', 'nông dân 5AM', 'shipper hoa'],
            '{flower}': ['mai', 'đào', 'lan', 'cúc'],
            '{number}': ['40', '30', '20', '10']
        }

        let result = template
        for (const [key, values] of Object.entries(replacements)) {
            if (result.includes(key)) {
                result = result.replace(key, values[Math.floor(Math.random() * values.length)])
            }
        }
        return result
    }

    private generateBody(pillarKey: string): string {
        const bodies: Record<string, string[]> = {
            pillar1_behind_scenes: [
                'Khi mọi người còn ngủ, nông dân chúng tôi đã bắt đầu cắt hoa. Sương sớm giúp hoa tươi nhất. Từ vườn đến nhà bạn chỉ 6 giờ!',
                'Mỗi bông hoa được chọn lọc kỹ càng, loại bỏ những bông không đạt chuẩn. Cold-chain 2-8°C trong suốt hành trình.',
                'Đây là cách chúng tôi đóng gói để hoa không bị dập. Bọc giấy mềm → Hộp cứng → Gel lạnh → Giao ngay!',
            ],
            pillar2_educational: [
                'Mẹo giữ hoa tươi: 1) Cắt chéo cuống 2) Nước sạch mỗi ngày 3) Tránh ánh nắng trực tiếp. Làm đúng = tươi 7 ngày!',
                'Sai lầm khi chọn mai: Đừng chọn mai đã nở! Chọn mai có nhiều nụ, thân khỏe, lá xanh mướt. Sẽ nở đúng dịp!',
                'Cách tính ngày mai nở: Nhiệt độ 25-30°C → 7 ngày. Lạnh hơn → chậm hơn. Muốn nở mùng 1? Đặt trước 7 ngày!',
            ],
            pillar3_storytelling: [
                'Chú Hai, 60 tuổi, 40 năm trồng mai. "Mỗi bông mai như con. Tôi biết đúng lúc nào nó đẹp nhất." Xúc động quá...',
                'Bé này tự bón phân cho vườn hoa của gia đình. 3 thế hệ ở làng hoa Sa Đéc, văn hóa trồng hoa trong máu!',
            ],
            pillar4_trending: [
                'Thử thách: Đoán giá bông mai này? Gợi ý: Đã 20 năm tuổi, cao 1.5m, dáng bon sai. Comment đáp án nhé!',
                'So sánh: Hoa siêu thị (trái) vs Hoa vườn Sa Đéc (phải). Cắt cùng lúc, xem sau 5 ngày sẽ biết khác biệt!',
            ],
            pillar5_product: [
                'DROP MỚI: Combo Hoa Tết 2026 - Mai + Đào + Cúc Vạn Thọ. Chỉ 599k (giá gốc 899k). Link bio!',
                'FREE SHIP Tết: 50 đơn đầu tiên mỗi ngày. First come first serve! Nhanh tay vào link bio.',
            ],
        }

        const pillarBodies = bodies[pillarKey] || bodies.pillar1_behind_scenes
        return pillarBodies[Math.floor(Math.random() * pillarBodies.length)]
    }

    private generateCTA(pillarKey: string): string {
        const ctas: Record<string, string[]> = {
            pillar1_behind_scenes: ['Follow để xem tiếp hành trình!', 'Thích thì follow nhé 🌸'],
            pillar2_educational: ['Save lại để không quên!', 'Share cho người cần biết!'],
            pillar3_storytelling: ['Cảm ơn các nông dân! ❤️', 'Tag người bạn yêu hoa nào!'],
            pillar4_trending: ['Comment đáp án ngay!', 'Ai đoán đúng có quà!'],
            pillar5_product: ['Link trong bio!', 'Nhanh tay kẻo hết!'],
        }

        const pillarCtas = ctas[pillarKey] || ctas.pillar1_behind_scenes
        return pillarCtas[Math.floor(Math.random() * pillarCtas.length)]
    }

    private generateHashtags(pillarKey: string): string[] {
        const baseHashtags = ['#TetSapDen', '#HoaTet2026', '#SaDec', '#HoaTuoi', '#fyp', '#viral']
        const pillarHashtags: Record<string, string[]> = {
            pillar1_behind_scenes: ['#BehindTheScenes', '#NongDan', '#5AM', '#FlowerFarm'],
            pillar2_educational: ['#MeoHay', '#LearnOnTikTok', '#FlowerTips', '#ChamSocHoa'],
            pillar3_storytelling: ['#StoryTime', '#CamXuc', '#VietNam', '#Culture'],
            pillar4_trending: ['#Challenge', '#ThuThach', '#Trending', '#Viral'],
            pillar5_product: ['#Sale', '#Promo', '#GiamGia', '#FreShip'],
        }

        return [...baseHashtags, ...(pillarHashtags[pillarKey] || [])]
    }

    private getDuration(pillarKey: string): number {
        const durations: Record<string, number> = {
            pillar1_behind_scenes: 30,
            pillar2_educational: 45,
            pillar3_storytelling: 60,
            pillar4_trending: 15,
            pillar5_product: 20,
        }
        return durations[pillarKey] || 30
    }

    private async saveScript(script: TikTokScript) {
        await this.supabase.from('content_queue').insert({
            type: 'tiktok',
            title: script.hook.substring(0, 100),
            content: JSON.stringify(script),
            hashtags: script.hashtags,
            status: 'pending',
            target_audience: 'general'
        })
    }

    // Log agent run
    async logRun(status: 'completed' | 'failed', output: unknown, error?: string) {
        await this.supabase.from('agent_runs').insert({
            agent_name: 'tiktok_viral',
            status,
            completed_at: new Date().toISOString(),
            output,
            error
        })
    }
}

// Execute function
export async function runTikTokAgent() {
    const agent = new TikTokViralAgent()

    try {
        const scripts = await agent.generateWeeklyContent()
        await agent.logRun('completed', { scripts_generated: scripts.length })
        return { success: true, scripts }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        await agent.logRun('failed', null, errorMessage)
        return { success: false, error: errorMessage }
    }
}
