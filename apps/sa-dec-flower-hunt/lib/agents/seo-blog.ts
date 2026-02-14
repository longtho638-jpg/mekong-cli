import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// =============================================================================
// SEO KEYWORD DATABASE - Vietnamese Flower Market
// =============================================================================

export const FLOWER_KEYWORDS = {
    // HIGH VOLUME - Tết Season (Dec-Feb)
    tet_high: [
        { keyword: 'hoa tết', volume: 74000, difficulty: 'medium', intent: 'commercial' },
        { keyword: 'mai vàng tết', volume: 33100, difficulty: 'low', intent: 'commercial' },
        { keyword: 'hoa đào tết', volume: 27100, difficulty: 'low', intent: 'commercial' },
        { keyword: 'mua hoa tết', volume: 22200, difficulty: 'low', intent: 'transactional' },
        { keyword: 'hoa tết 2026', volume: 18100, difficulty: 'very_low', intent: 'commercial' },
    ],

    // MEDIUM VOLUME - Care & Tips
    care_tips: [
        { keyword: 'cách chăm sóc mai vàng', volume: 22200, difficulty: 'low', intent: 'informational' },
        { keyword: 'cách chọn mai đẹp', volume: 14800, difficulty: 'low', intent: 'informational' },
        { keyword: 'cách giữ hoa tươi lâu', volume: 12100, difficulty: 'low', intent: 'informational' },
        { keyword: 'mai vàng nở đúng tết', volume: 9900, difficulty: 'low', intent: 'informational' },
        { keyword: 'hoa gì hợp mệnh', volume: 8100, difficulty: 'low', intent: 'informational' },
    ],

    // LOCAL - Sa Đéc specific
    local: [
        { keyword: 'làng hoa sa đéc', volume: 12100, difficulty: 'very_low', intent: 'informational' },
        { keyword: 'hoa sa đéc', volume: 6600, difficulty: 'very_low', intent: 'commercial' },
        { keyword: 'mua hoa sa đéc', volume: 4400, difficulty: 'very_low', intent: 'transactional' },
        { keyword: 'vườn hoa sa đéc', volume: 3300, difficulty: 'very_low', intent: 'informational' },
    ],

    // LONG-TAIL - Easy to rank
    long_tail: [
        { keyword: 'mua mai vàng ở đâu uy tín', volume: 2400, difficulty: 'very_low', intent: 'transactional' },
        { keyword: 'giá mai vàng tết 2026', volume: 1900, difficulty: 'very_low', intent: 'commercial' },
        { keyword: 'mai vàng ship tận nhà', volume: 1600, difficulty: 'very_low', intent: 'transactional' },
        { keyword: 'hoa tết giao tận nơi', volume: 1300, difficulty: 'very_low', intent: 'transactional' },
        { keyword: 'đặt hoa tết online', volume: 1100, difficulty: 'very_low', intent: 'transactional' },
    ]
}

// =============================================================================
// SEO BLOG POST TEMPLATES
// =============================================================================

const BLOG_TEMPLATES = [
    {
        type: 'guide',
        title_template: 'Hướng dẫn {topic} chi tiết từ A-Z [{year}]',
        structure: ['intro', 'what_is', 'why_important', 'step_by_step', 'tips', 'faq', 'conclusion'],
        word_count: 2000
    },
    {
        type: 'listicle',
        title_template: 'Top {number} {topic} đẹp nhất {year} + Giá & Cách chọn',
        structure: ['intro', 'list_items', 'comparison_table', 'how_to_choose', 'conclusion'],
        word_count: 1500
    },
    {
        type: 'comparison',
        title_template: '{topic_a} vs {topic_b}: Nên chọn loại nào?',
        structure: ['intro', 'overview_a', 'overview_b', 'comparison', 'verdict', 'cta'],
        word_count: 1800
    },
    {
        type: 'local_guide',
        title_template: 'Khám phá {location}: Thiên đường hoa miền Tây [{year}]',
        structure: ['intro', 'history', 'what_to_see', 'best_time', 'how_to_get', 'tips', 'cta'],
        word_count: 2500
    }
]

// =============================================================================
// BLOG POST GENERATOR
// =============================================================================

export interface BlogPost {
    slug: string
    title: string
    meta_description: string
    keywords: string[]
    content: string
    structured_data: object
    created_at: string
}

export class SEOBlogAgent {
    private supabase

    constructor() {
        this.supabase = createClient(supabaseUrl, supabaseServiceKey)
    }

    // Generate a blog post for a keyword
    async generateBlogPost(keywordData: { keyword: string; volume: number; intent: string }): Promise<BlogPost> {
        const year = new Date().getFullYear() + 1 // 2026 for Tết
        const keyword = keywordData.keyword

        // Generate title based on intent
        let title: string
        let content: string

        if (keywordData.intent === 'informational') {
            title = this.generateInformationalTitle(keyword, year)
            content = this.generateInformationalContent(keyword)
        } else if (keywordData.intent === 'commercial') {
            title = this.generateCommercialTitle(keyword, year)
            content = this.generateCommercialContent(keyword)
        } else {
            title = this.generateTransactionalTitle(keyword, year)
            content = this.generateTransactionalContent(keyword)
        }

        const slug = this.generateSlug(keyword)
        const metaDescription = this.generateMetaDescription(keyword, keywordData.intent)

        const blogPost: BlogPost = {
            slug,
            title,
            meta_description: metaDescription,
            keywords: [keyword, ...this.getRelatedKeywords(keyword)],
            content,
            structured_data: this.generateStructuredData(title, metaDescription, slug),
            created_at: new Date().toISOString()
        }

        // Save to content queue
        await this.saveBlogPost(blogPost)

        return blogPost
    }

    // Generate multiple posts for content calendar
    async generateContentCalendar(days: number = 30): Promise<BlogPost[]> {
        const posts: BlogPost[] = []
        const allKeywords = [
            ...FLOWER_KEYWORDS.tet_high,
            ...FLOWER_KEYWORDS.care_tips,
            ...FLOWER_KEYWORDS.local,
            ...FLOWER_KEYWORDS.long_tail
        ]

        // Priority: long-tail first (easier to rank), then move up
        const sortedKeywords = allKeywords.sort((a, b) => {
            const diffOrder = { 'very_low': 0, 'low': 1, 'medium': 2, 'high': 3 }
            return (diffOrder[a.difficulty as keyof typeof diffOrder] || 0) -
                (diffOrder[b.difficulty as keyof typeof diffOrder] || 0)
        })

        // Generate 1 post per day
        for (let i = 0; i < Math.min(days, sortedKeywords.length); i++) {
            const post = await this.generateBlogPost(sortedKeywords[i])
            posts.push(post)
        }

        return posts
    }

    private generateInformationalTitle(keyword: string, year: number): string {
        const templates = [
            `Hướng dẫn ${keyword} chi tiết từ A-Z [${year}]`,
            `${this.capitalize(keyword)}: Bí quyết từ chuyên gia ${year}`,
            `Tất tần tật về ${keyword} bạn cần biết`,
            `${this.capitalize(keyword)} - Kinh nghiệm thực tế từ nông dân Sa Đéc`
        ]
        return templates[Math.floor(Math.random() * templates.length)]
    }

    private generateCommercialTitle(keyword: string, year: number): string {
        const templates = [
            `Top 10 ${keyword} đẹp nhất ${year} + Bảng giá chi tiết`,
            `${this.capitalize(keyword)} ${year}: So sánh giá & chất lượng`,
            `Mua ${keyword} ở đâu uy tín? Review chi tiết ${year}`,
            `${this.capitalize(keyword)}: Giá cả, mẫu mã hot nhất ${year}`
        ]
        return templates[Math.floor(Math.random() * templates.length)]
    }

    private generateTransactionalTitle(keyword: string, year: number): string {
        const templates = [
            `${this.capitalize(keyword)} - Giao tận nơi trong 6 giờ [${year}]`,
            `Đặt ${keyword} online - Free ship nội thành`,
            `${this.capitalize(keyword)} giá rẻ, chất lượng cao - Ship toàn quốc`,
            `Mua ${keyword} trực tiếp từ nông dân Sa Đéc`
        ]
        return templates[Math.floor(Math.random() * templates.length)]
    }

    private generateInformationalContent(keyword: string): string {
        return `
# ${this.capitalize(keyword)}: Hướng dẫn đầy đủ từ chuyên gia

Bạn đang tìm hiểu về **${keyword}**? Bài viết này sẽ giúp bạn hiểu rõ tất cả những gì cần biết.

## ${keyword} là gì?

${keyword} là một trong những chủ đề được quan tâm nhất, đặc biệt vào dịp Tết Nguyên đán...

## Tại sao ${keyword} quan trọng?

- Mang ý nghĩa may mắn, thịnh vượng
- Trang trí nhà cửa đẹp mắt
- Tạo không khí Tết ấm áp

## Hướng dẫn chi tiết về ${keyword}

### Bước 1: Chuẩn bị
...

### Bước 2: Thực hiện
...

### Bước 3: Bảo quản
...

## Mẹo hay từ nông dân Sa Đéc

> "Bí quyết để ${keyword} đẹp nhất là chọn đúng thời điểm..." - Chú Hai, 40 năm kinh nghiệm

## Câu hỏi thường gặp về ${keyword}

### ${keyword} giá bao nhiêu?
Giá dao động từ 200.000đ - 2.000.000đ tùy loại và kích thước.

### Mua ${keyword} ở đâu uy tín?
Nên mua trực tiếp từ làng hoa Sa Đéc để đảm bảo chất lượng và giá tốt nhất.

## Kết luận

${keyword} không khó nếu bạn nắm vững các bước cơ bản. Chúc bạn có một mùa Tết thật đẹp!

---

**👉 Đặt hoa tươi từ Sa Đéc - Giao trong 6 giờ: [Đặt ngay](/shop)**
    `
    }

    private generateCommercialContent(keyword: string): string {
        return `
# Top 10 ${this.capitalize(keyword)} đẹp nhất 2026

Bạn đang tìm **${keyword}** chất lượng cho dịp Tết? Dưới đây là danh sách được chuyên gia đánh giá cao nhất.

## Bảng xếp hạng ${keyword} 2026

| STT | Loại | Giá | Đánh giá |
|-----|------|-----|----------|
| 1 | Mai vàng Bình Định | 500k - 5tr | ⭐⭐⭐⭐⭐ |
| 2 | Mai ghép Sa Đéc | 300k - 2tr | ⭐⭐⭐⭐⭐ |
| 3 | Mai bon sai | 1tr - 10tr | ⭐⭐⭐⭐ |

## Chi tiết từng loại

### 1. Mai vàng Bình Định
...

### 2. Mai ghép Sa Đéc
Đặc biệt của làng hoa Sa Đéc, được chăm sóc bởi nông dân có kinh nghiệm...

## So sánh giá theo vùng

| Vùng | Giá trung bình | Ghi chú |
|------|----------------|---------|
| Sa Đéc | 300k - 1tr | Giá gốc từ vườn |
| Sài Gòn | 500k - 2tr | Có phí vận chuyển |
| Hà Nội | 600k - 2.5tr | Ship xa |

## Mua ${keyword} ở đâu uy tín?

### 1. AGRIOS.tech - Mua trực tiếp từ nông dân
- ✅ Giao trong 6 giờ
- ✅ Cold-chain đảm bảo tươi
- ✅ Video call với nông dân
- ✅ Hoàn 100% nếu héo

[👉 Đặt ${keyword} ngay](/shop)

## Kết luận

Chọn ${keyword} không khó nếu biết cách. Ưu tiên mua từ nguồn uy tín như làng hoa Sa Đéc!
    `
    }

    private generateTransactionalContent(keyword: string): string {
        return `
# ${this.capitalize(keyword)} - Đặt online, giao tận nơi trong 6 giờ

## Tại sao chọn AGRIOS.tech?

✅ **Hoa tươi từ vườn** - Cắt sáng sớm, giao trong ngày
✅ **Cold-chain logistics** - Nhiệt độ 2-8°C suốt hành trình
✅ **Video call với nông dân** - Chọn hoa theo ý bạn
✅ **Hoàn tiền 100%** - Nếu hoa héo khi nhận

## Đặt ${keyword} ngay

[🌸 Xem sản phẩm](/shop) | [📞 Gọi video với nông dân](/video)

## Bảng giá ${keyword} 2026

| Loại | Giá | Free ship |
|------|-----|-----------|
| Combo 1 | 299k | Đơn từ 300k |
| Combo 2 | 499k | ✅ |
| Combo 3 | 799k | ✅ |

## Quy trình đặt hàng

1. Chọn hoa trên website
2. Nhập mã WELCOME50 giảm 50k
3. Thanh toán
4. Nhận hoa trong 6 giờ!

## Đánh giá từ khách hàng

> "Hoa tươi thật sự, nhận lúc 11h sáng mà như vừa cắt!" - Chị Mai, Q.7

> "Lần đầu được video call với nông dân để chọn hoa, quá xịn!" - Anh Hùng, Bình Dương

---

**🎁 Ưu đãi Tết 2026: Nhập mã TET20 giảm 20% đơn từ 500k**

[Đặt ${keyword} ngay →](/shop)
    `
    }

    private generateSlug(keyword: string): string {
        return keyword
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
    }

    private generateMetaDescription(keyword: string, intent: string): string {
        if (intent === 'informational') {
            return `Tìm hiểu về ${keyword} chi tiết nhất. Hướng dẫn từ A-Z, mẹo hay từ nông dân Sa Đéc 40 năm kinh nghiệm. Cập nhật 2026.`
        } else if (intent === 'commercial') {
            return `Top ${keyword} đẹp nhất 2026. So sánh giá, review chi tiết. Mua trực tiếp từ làng hoa Sa Đéc, giao tận nơi trong 6 giờ.`
        }
        return `Đặt ${keyword} online - Giao tận nơi trong 6 giờ. Free ship đơn từ 300k. Hoa tươi từ vườn Sa Đéc, cold-chain đảm bảo.`
    }

    private getRelatedKeywords(keyword: string): string[] {
        // Simple related keyword generation
        const baseWords = keyword.split(' ')
        return [
            `mua ${keyword}`,
            `giá ${keyword}`,
            `${keyword} đẹp`,
            `${keyword} tết 2026`,
            `${keyword} ở đâu`
        ].slice(0, 3)
    }

    private generateStructuredData(title: string, description: string, slug: string): object {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agrios.tech'
        return {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title,
            description: description,
            url: `${baseUrl}/blog/${slug}`,
            author: {
                '@type': 'Organization',
                name: 'AGRIOS.tech',
                url: baseUrl
            },
            publisher: {
                '@type': 'Organization',
                name: 'AGRIOS.tech',
                logo: {
                    '@type': 'ImageObject',
                    url: `${baseUrl}/logo.png`
                }
            },
            datePublished: new Date().toISOString(),
            dateModified: new Date().toISOString()
        }
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1)
    }

    private async saveBlogPost(post: BlogPost) {
        await this.supabase.from('content_queue').insert({
            type: 'blog',
            title: post.title,
            content: JSON.stringify(post),
            hashtags: post.keywords,
            status: 'pending',
            target_audience: 'buyer'
        })
    }

    // Log agent run
    async logRun(status: 'completed' | 'failed', output: unknown, error?: string) {
        await this.supabase.from('agent_runs').insert({
            agent_name: 'seo_blog',
            status,
            completed_at: new Date().toISOString(),
            output,
            error
        })
    }
}

// Execute function
export async function runSEOBlogAgent(days: number = 7) {
    const agent = new SEOBlogAgent()

    try {
        const posts = await agent.generateContentCalendar(days)
        await agent.logRun('completed', { posts_generated: posts.length })
        return { success: true, posts }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        await agent.logRun('failed', null, errorMessage)
        return { success: false, error: errorMessage }
    }
}
