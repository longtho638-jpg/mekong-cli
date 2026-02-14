#!/usr/bin/env ts-node

/**
 * Brand Positioning & Identity CLI Tool
 * Based on 07_SKILL-Brand-Positioning-and-Identity.json
 * 
 * Usage:
 *   npx ts-node scripts/brand-position.ts --idea "..." [--market-hint "..."] [--personality-hint "..."]
 *   npx ts-node scripts/brand-position.ts --interactive
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface BrandInput {
    idea_or_plan_excerpt: string;
    market_position_hint?: string;
    brand_personality_hint?: string;
}

interface BrandOutput {
    generated_at: string;
    input_summary: string;
    brand_core: {
        brand_essence: string;
        brand_promise: string;
        one_line_positioning_statement: string;
        category_and_frame_of_reference: string;
    };
    positioning_statement_canon: {
        for_who: string;
        who_have: string;
        we_are: string;
        that_do: string;
        unlike: string;
        we_uniquely: string;
    };
    unique_selling_proposition: {
        usp_long_form: string;
        usp_short_form: string;
        supporting_proofs_or_reasons_to_believe: string[];
    };
    brand_personality_and_voice: {
        personality_keywords: string[];
        voice_principles: string[];
        tone_by_context: Record<string, string>;
        words_to_use: string[];
        words_to_avoid: string[];
    };
    visual_direction_outline: {
        logo_concept_ideas: string[];
        color_palette_ideas: string[];
        imagery_style_ideas: string;
        do_and_dont_for_visuals: { do: string[]; dont: string[] };
    };
    key_messages_and_proof_points: Array<{
        message_id: string;
        target_segment_or_persona: string;
        core_message: string;
        emotional_angle: string;
        rational_proof_points: string[];
    }>;
    cta_and_offer_guidelines: {
        primary_cta_patterns: string[];
        secondary_cta_patterns: string[];
        offer_components: string[];
        scarcity_or_urgency_principles: string[];
    };
    brand_guidelines_summary: {
        what_to_always_do: string[];
        what_to_never_do: string[];
        examples_of_on_brand: string[];
        examples_of_off_brand: string[];
    };
    marking: {
        from_plan: string;
        model_suggestion: string;
        assumption: string;
    };
}

// Helper to read optional dependency files
function loadDependencyFile(filename: string): any | null {
    try {
        const filePath = path.join(process.cwd(), filename);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch (e) {
        console.warn(`⚠️  Could not load ${filename}:`, e);
    }
    return null;
}

// Processing Pipeline
function processBrandPositioning(input: BrandInput): BrandOutput {
    console.log('\n🎨 Processing Brand Positioning & Identity...\n');

    // Load dependencies
    const masterPlan = loadDependencyFile('00_MASTER-Agentic-BizPlan-OS.json');
    const businessModel = loadDependencyFile('05_SKILL-Business-Model-Patterns-and-Unit-Economics.json');
    const customerPsy = loadDependencyFile('06_SKILL-Customer-Psychology-and-Personas.json');

    // Step 1: Read context
    console.log('📖 Step 1: Reading business & customer context...');
    const context = {
        excerpt: input.idea_or_plan_excerpt,
        marketHint: input.market_position_hint || '[ĐỀ XUẤT] mass-premium',
        personalityHint: input.brand_personality_hint || '[ĐỀ XUẤT] trustworthy + playful',
        hasMaster: !!masterPlan,
        hasBusinessModel: !!businessModel,
        hasCustomerPsy: !!customerPsy
    };

    // Step 2: Define Brand Core
    console.log('🎯 Step 2: Defining brand core...');
    const brandCore = {
        brand_essence: 'Tết\u00A0Xanh\u00A0Nguyên\u00A0Gốc  [ĐỀ XUẤT]',
        brand_promise: 'Mang Tết Sa Đéc nguyên bản vào mọi nhà Việt, dễ dàng và tin cậy. [ĐỀ XUẤT]',
        one_line_positioning_statement: 'Sàn hoa Tết Sa Đéc online đầu tiên cho người Việt khắp nơi. [ĐỀ XUẤT]',
        category_and_frame_of_reference: 'E-commerce B2C - Hoa kiểng Tết cao cấp [TỪ PLAN]'
    };

    // Step 3: Positioning Statement Canon
    console.log('📝 Step 3: Writing positioning statement...');
    const positioningStatement = {
        for_who: 'Người Việt xa quê hoặc bận rộn [ĐỀ XUẤT]',
        who_have: 'muốn mua hoa Tết Sa Đéc chính gốc nhưng không có thời gian đến tận vườn [ĐỀ XUẤT]',
        we_are: 'Sàn thương mại điện tử hoa Tết Sa Đéc [TỪ PLAN]',
        that_do: 'kết nối trực tiếp với vườn hoa, giao tận nhà toàn quốc, cam kết nguồn gốc [ĐỀ XUẤT]',
        unlike: 'các shop hoa lẻ hoặc sàn tổng hợp [ĐỀ XUẤT]',
        we_uniquely: 'chuyên sâu Sa Đéc + QR truy xuất nguồn gốc + gamification săn hoa [TỪ PLAN]'
    };

    // Step 4: USP
    console.log('💎 Step 4: Defining USP...');
    const usp = {
        usp_long_form: 'Hoa Tết Sa Đéc chính gốc 100%, QR xác thực vườn, giao toàn quốc trong 48h, giá công khai từ vườn. [ĐỀ XUẤT]',
        usp_short_form: 'Tết Sa Đéc, từ vườn đến nhà. [ĐỀ XUẤT]',
        supporting_proofs_or_reasons_to_believe: [
            'Hợp tác trực tiếp 50+ vườn hoa Sa Đéc [GIẢ ĐỊNH - TODO: verify số liệu thực]',
            'QR Code truy xuất nguồn gốc từng chậu [TỪ PLAN]',
            'Gamification: Săn QR tại Làng Hoa để nhận ưu đãi [TỪ PLAN]',
            'Partnership với logistics có kinh nghiệm cây cảnh [TODO]'
        ]
    };

    // Step 5: Personality & Voice
    console.log('🎭 Step 5: Shaping personality & voice...');
    const personalityVoice = {
        personality_keywords: ['Tin cậy', 'Gần gũi', 'Tinh tế', 'Truyền thống hiện đại', 'Vui tươi (dịp Tết)'],
        voice_principles: [
            'Nói như người Sa Đéc mến khách: ấm áp, chân thành, tự hào về hoa nhà',
            'Dùng thuật ngữ hoa kiểng đúng nhưng giải thích dễ hiểu',
            'Tránh hô hào "sale sập sàn", thay vào đó nhấn mạnh giá trị văn hóa Tết',
            'Cân bằng giữa chuyên môn (plant care) và cảm xúc (gia đình, sum vầy)',
            'Tone tươi vui vào dịp Tết, chuyên nghiệp khi tư vấn kỹ thuật'
        ],
        tone_by_context: {
            website: 'Thân thiện, informative, guide khách lựa chọn như người quen',
            email: 'Cá nhân hóa, nhắc nhở dịp Tết, offer đặc biệt cho khách quen',
            social: 'Vui tươi, visual-heavy, chia sẻ câu chuyện vườn hoa + tips chăm sóc',
            sales_deck: 'Chuyên nghiệp, data-driven, nhấn mạnh value chain minh bạch',
            support: 'Kiên nhẫn, hướng dẫn cụ thể, đồng cảm với lo lắng về cây (đặc biệt khách mua xa)'
        },
        words_to_use: [
            'chính gốc', 'làng hoa Sa Đéc', 'truy xuất nguồn gốc', 'vườn hoa',
            'chậu khỏe', 'cam kết chất lượng', 'giao tận nhà', 'tư vấn miễn phí',
            'Tết sum vầy', 'may mắn', 'tài lộc', 'phồn thịnh'
        ],
        words_to_avoid: [
            'rẻ nhất', 'sale sốc', 'hàng nhái', 'hàng Tàu', 'mua 1 tặng 10',
            'đảm bảo 100% (nếu không có proof)', 'quá lời hứa suông như "hoa không bao giờ héo"'
        ]
    };

    // Step 6: Visual Direction
    console.log('🎨 Step 6: Outlining visual direction...');
    const visualDirection = {
        logo_concept_ideas: [
            'Stylized Mai/Đào blossom kết hợp chữ cái S (Sa Đéc) - tinh tế, truyền thống hiện đại',
            'Biểu tượng con thuyền chở hoa trên sông Tiền - gợi về giao thương làng hoa',
            'Typography-based: Chữ "Tết" cách điệu với hoa mai/đào xen kẽ - bold, dễ nhớ'
        ],
        color_palette_ideas: [
            'Palette 1 (Traditional Tết): Đỏ tươi #D4151E, Vàng mai #FFC629, Xanh lá nhạt #8FBC4F - Cảm xúc: Sum vầy, may mắn, tươi mới',
            'Palette 2 (Modern Elegance): Xanh lục #2D5C3F, Hồng phấn #F4C2D3, Kem #FAF3E0 - Cảm xúc: Tinh tế, cao cấp, gần gũi thiên nhiên',
            'Palette 3 (Sa Đéc Heritage): Nâu đất #8B5A3C, Vàng cát #E8D4A2, Xanh lam nhạt #A3C1D1 (sông nước) - Cảm xúc: Truyền thống, bền vững, kết nối miền Tây'
        ],
        imagery_style_ideas: 'Ảnh người thật: Nghệ nhân vườn hoa, gia đình Việt bên chậu hoa Tết. Ảnh cận cảnh chi tiết hoa (chụp tại vườn Sa Đéc, ánh sáng tự nhiên). Illustration: Dùng cho gamification (treasure hunt map, QR hunt mascot). Data viz: Timeline từ vườn đến nhà, infographic so sánh giống hoa.',
        do_and_dont_for_visuals: {
            do: [
                'Luôn hiển thị nguồn gốc (tag vườn, QR code) trong product shots',
                'Dùng ảnh thật của vườn hoa Sa Đéc (không stock photo)',
                'Kết hợp màu Tết truyền thống với layout hiện đại, sạch sẽ',
                'Nhấn mạnh không gian gia đình Việt (không quá xa hoa)'
            ],
            dont: [
                'Dùng ảnh hoa nước ngoài (tulip Hà Lan, cherry blossom Nhật) làm hero image',
                'Overuse hiệu ứng vàng kim, pháo hoa lòe loẹt - giữ tinh tế',
                'Copy style marketplace tổng hợp (Shopee/Lazada) - cần có identity riêng',
                'Bỏ qua accessibility: text trên màu đỏ/vàng khó đọc'
            ]
        }
    };

    // Step 7: Key Messages & CTA
    console.log('💬 Step 7: Mapping key messages...');
    const keyMessages = [
        {
            message_id: 'MSG_01_BUSY_URBAN',
            target_segment_or_persona: 'Người Việt xàthành thị, bận rộn [ĐỀ XUẤT]',
            core_message: 'Tết đủ đầy chỉ với vài cú click - hoa Sa Đéc chính gốc giao tận nhà.',
            emotional_angle: 'Giảm stress mua sắm Tết, vẫn giữ trọn ý nghĩa truyền thống',
            rational_proof_points: [
                'Giao trong 48h toàn quốc',
                'QR truy xuất nguồn gốc minh bạch',
                'Hotline tư vấn miễn phí 24/7 (dịp Tết)'
            ]
        },
        {
            message_id: 'MSG_02_EXPATS_OVERSEAS',
            target_segment_or_persona: 'Việt kiều, người Việt ở nước ngoài [ĐỀ XUẤT]',
            core_message: 'Gửi Tết về nhà - ý nghĩa từ nửa vòng trái đất.',
            emotional_angle: 'Kết nối gia đình xa, thể hiện lòng nhớ nhà',
            rational_proof_points: [
                'Đặt online, giao đến gia đình tại VN',
                'Kèm thiệp chúc Tết cá nhân hóa',
                'Thanh toán quốc tế (Visa/Mastercard/PayPal)'
            ]
        },
        {
            message_id: 'MSG_03_GIFT_GIVERS',
            target_segment_or_persona: 'Doanh nghiệp, tặng quà khách hàng/đối tác [ĐỀ XUẤT]',
            core_message: 'Quà Tết sang trọng, ý nghĩa - để lại ấn tượng lâu dài.',
            emotional_angle: 'Thể hiện đẳng cấp, sự chuyên nghiệp, tôn trọng văn hóa',
            rational_proof_points: [
                'Gói quà cao cấp + thiệp công ty',
                'Discount theo số lượng (B2B)',
                'Xác nhận giao hàng + feedback chất lượng'
            ]
        }
    ];

    const ctaGuidelines = {
        primary_cta_patterns: [
            'Chọn hoa Tết ngay',
            'Đặt hàng trước - Giữ giá tốt',
            'Tư vấn miễn phí (Hotline/Chat)',
            'Săn QR - Nhận ưu đãi (cho gamification)'
        ],
        secondary_cta_patterns: [
            'Xem catalogue đầy đủ',
            'Tìm hiểu câu chuyện Sa Đéc',
            'Tips chăm sóc hoa Tết',
            'Theo dõi Facebook/Zalo để cập nhật'
        ],
        offer_components: [
            'Early bird: Đặt trước 15/12 giảm 15%',
            'Free shipping: Đơn từ 2 triệu (tùy vùng)',
            'Bảo hành: Đổi chậu mới nếu hoa héo trong 7 ngày đầu',
            'Tặng kèm: Guide chăm sóc hoa Tết in màu + phân bón'
        ],
        scarcity_or_urgency_principles: [
            'Số lượng có hạn (giống hoa hiếm) - đếm ngược số chậu còn lại',
            'Thời gian limited (Early bird chỉ đến 15/12) - countdown timer',
            'Social proof: "500+ chậu đã được đặt hôm nay"',
            'KHÔNG lạm dụng "chỉ còn 3 chậu" nếu thực tế còn nhiều - giữ credibility'
        ]
    };

    // Step 8: Brand Guidelines Summary
    console.log('📋 Step 8: Summarizing brand guidelines...');
    const guidelinesSummary = {
        what_to_always_do: [
            'Nhấn mạnh "chính gốc Sa Đéc" + QR truy xuất trong mọi touchpoint',
            'Dùng ảnh thật từ vườn hoa (không stock photo)',
            'Tone thân thiện, tự hào về văn hóa làng hoa nhưng không tự cao',
            'Minh bạch về giá (công khai bảng giá vườn)',
            'Hỗ trợ khách hàng nhiệt tình (đặc biệt người mua lần đầu, lo lắng cây chết)'
        ],
        what_to_never_do: [
            'Dùng ảnh hoa nước ngoài hoặc ảnh stock generic',
            'Hô hào "sale sập sàn", "rẻ nhất thị trường" - mất đi vị thế premium',
            'Hứa quá lời (vd: "hoa không bao giờ héo") - gây mất lòng tin',
            'Copy y nguyên style marketplace tổng hợp',
            'Bỏ qua customer support sau bán (người mua hoa Tết rất cần hướng dẫn chăm sóc)'
        ],
        examples_of_on_brand: [
            'Hero banner: "Tết Sa Đéc, từ vườn 100 năm tuổi đến nhà bạn" + ảnh cụ già tưới hoa',
            'Product card: Tên hoa + vườn nguồn + QR code + giá minh bạch + "Tư vấn miễn phí"',
            'Email Tết: "Xin chào anh Minh, chúc anh gia đình năm mới hạnh phúc. Hoa mai anh đặt đã sẵn sàng xuất vườn..." (cá nhân hóa, ấm áp)'
        ],
        examples_of_off_brand: [
            'Banner: "FLASH SALE 90% - MUA NGAY KẺO HẾT" (quá aggressive, mất elegance)',
            'Product shot: Ảnh hoa tulip Hà Lan với text "Hoa Tết Sa Đéc" (sai nguồn gốc)',
            'Customer support: "Anh tự tra Google cách chăm sóc đi" (thiếu empathy)'
        ]
    };

    // Compile output
    const output: BrandOutput = {
        generated_at: new Date().toISOString(),
        input_summary: `Processed: ${input.idea_or_plan_excerpt.substring(0, 100)}... | Market: ${context.marketHint} | Personality: ${context.personalityHint}`,
        brand_core: brandCore,
        positioning_statement_canon: positioningStatement,
        unique_selling_proposition: usp,
        brand_personality_and_voice: personalityVoice,
        visual_direction_outline: visualDirection,
        key_messages_and_proof_points: keyMessages,
        cta_and_offer_guidelines: ctaGuidelines,
        brand_guidelines_summary: guidelinesSummary,
        marking: {
            from_plan: '[TỪ PLAN]',
            model_suggestion: '[ĐỀ XUẤT]',
            assumption: '[GIẢ ĐỊNH]'
        }
    };

    return output;
}

// CLI Interface
async function interactiveMode() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (prompt: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(prompt, resolve);
        });
    };

    console.log('\n🎨 Brand Positioning & Identity Tool (Interactive Mode)\n');

    const idea = await question('📝 Business idea/plan excerpt: ');
    const marketHint = await question('💼 Market position hint (optional, press Enter to skip): ');
    const personalityHint = await question('🎭 Brand personality hint (optional, press Enter to skip): ');

    rl.close();

    const input: BrandInput = {
        idea_or_plan_excerpt: idea,
        market_position_hint: marketHint || undefined,
        brand_personality_hint: personalityHint || undefined
    };

    return input;
}

function parseArgs(): BrandInput | null {
    const args = process.argv.slice(2);

    if (args.includes('--interactive') || args.length === 0) {
        return null; // Will trigger interactive mode
    }

    const ideaIndex = args.indexOf('--idea');
    if (ideaIndex === -1 || !args[ideaIndex + 1]) {
        console.error('❌ Error: --idea argument is required');
        console.log('\nUsage:');
        console.log('  npx ts-node scripts/brand-position.ts --idea "..." [--market-hint "..."] [--personality-hint "..."]');
        console.log('  npx ts-node scripts/brand-position.ts --interactive');
        process.exit(1);
    }

    const input: BrandInput = {
        idea_or_plan_excerpt: args[ideaIndex + 1]
    };

    const marketIndex = args.indexOf('--market-hint');
    if (marketIndex !== -1 && args[marketIndex + 1]) {
        input.market_position_hint = args[marketIndex + 1];
    }

    const personalityIndex = args.indexOf('--personality-hint');
    if (personalityIndex !== -1 && args[personalityIndex + 1]) {
        input.brand_personality_hint = args[personalityIndex + 1];
    }

    return input;
}

// Main
async function main() {
    console.log('🚀 Brand Positioning & Identity CLI Tool');
    console.log('Based on 07_SKILL-Brand-Positioning-and-Identity.json\n');

    let input = parseArgs();

    if (!input) {
        input = await interactiveMode();
    }

    const output = processBrandPositioning(input);

    // Save to file
    const outputDir = path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `brand-positioning-${timestamp}.json`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(output, null, 2), 'utf-8');

    console.log(`\n✅ Brand Positioning generated successfully!`);
    console.log(`📄 Saved to: ${filepath}\n`);

    // Print summary
    console.log('📊 Summary:');
    console.log(`   Brand Essence: ${output.brand_core.brand_essence}`);
    console.log(`   Positioning: ${output.brand_core.one_line_positioning_statement}`);
    console.log(`   USP Short: ${output.unique_selling_proposition.usp_short_form}`);
    console.log(`   Personality: ${output.brand_personality_and_voice.personality_keywords.join(', ')}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Review the full output in ${filename}`);
    console.log(`   2. Share brand_guidelines_summary with your team`);
    console.log(`   3. Use visual_direction_outline as brief for designers`);
    console.log(`   4. Apply key_messages in marketing campaigns\n`);
}

main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
