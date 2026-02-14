import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

export type ActionType = "QUERY" | "ACTION" | "REPORT" | "UNKNOWN";

export interface ParsedCommand {
    intent: ActionType;
    action: string;
    entities: Record<string, any>;
    rawQuery: string;
    suggestedSQL?: string;
}

const SYSTEM_PROMPT = `
Bạn là Ops Agent Parser của Sa Đéc Flower Hunt.
Nhiệm vụ: Phân tích lệnh tiếng Việt từ Admin và trả về JSON action plan.

## Các loại Intent:
- QUERY: Lấy thông tin (doanh thu, đơn hàng, khách hàng...)
- ACTION: Thực hiện hành động (tạo mã giảm giá, gửi đơn, cập nhật...)
- REPORT: Tạo báo cáo tổng hợp
- UNKNOWN: Không hiểu lệnh

## Output Format (JSON only, no markdown):
{
  "intent": "QUERY|ACTION|REPORT|UNKNOWN",
  "action": "get_revenue|get_orders|create_coupon|ship_order|...",
  "entities": { "order_id": "123", "amount": 50000, ... },
  "suggestedSQL": "SELECT ... FROM ..." (chỉ khi intent là QUERY)
}

## Ví dụ:
Input: "Doanh thu hôm nay bao nhiêu?"
Output: {"intent":"QUERY","action":"get_daily_revenue","entities":{"date":"today"},"suggestedSQL":"SELECT SUM(total_price) as revenue FROM orders WHERE DATE(created_at) = CURRENT_DATE"}

Input: "Tạo mã giảm giá 20% cho khách VIP"
Output: {"intent":"ACTION","action":"create_coupon","entities":{"discount_percent":20,"target_segment":"VIP"}}

Chỉ trả về JSON, không có text khác.
`;

export async function parseCommand(userCommand: string): Promise<ParsedCommand> {
    if (!model) {
        return {
            intent: "UNKNOWN",
            action: "error",
            entities: { error: "Gemini API not configured" },
            rawQuery: userCommand
        };
    }

    try {
        const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nInput: "${userCommand}"`);
        const response = await result.response;
        const text = response.text().trim();

        // Clean potential markdown code blocks
        const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(jsonStr);

        return {
            intent: parsed.intent || "UNKNOWN",
            action: parsed.action || "unknown",
            entities: parsed.entities || {},
            rawQuery: userCommand,
            suggestedSQL: parsed.suggestedSQL
        };
    } catch (error) {
        console.error("Command parse error:", error);
        return {
            intent: "UNKNOWN",
            action: "parse_error",
            entities: { error: String(error) },
            rawQuery: userCommand
        };
    }
}

// Mock executor for demo (will be replaced with real DB calls)
export async function executeCommand(parsed: ParsedCommand): Promise<string> {
    switch (parsed.action) {
        case "get_daily_revenue":
            return "📊 Doanh thu hôm nay: **45.230.000 VNĐ** (+20% vs hôm qua)";
        case "get_orders":
            return "📦 5 đơn hàng mới nhất:\n- ORD-001: Nguyễn Văn A (500k)\n- ORD-002: Trần Thị B (1.2tr)\n- ORD-003: Lê Văn C (800k)";
        case "create_coupon":
            const discount = parsed.entities.discount_percent || 10;
            const segment = parsed.entities.target_segment || "all";
            return `🎟️ Đã tạo mã **FLASH_${discount}** (Giảm ${discount}%) cho nhóm ${segment}. Code: VIP_TET_2026`;
        case "ship_order":
            return `🚛 Đơn hàng #${parsed.entities.order_id} đã được gửi qua GHTK. Mã vận đơn: GHTK123456`;
        case "get_profile":
            return `👤 Profile khách hàng:\n- Tên: ${parsed.entities.customer_name || "N/A"}\n- Đơn hàng: 5\n- Tổng chi: 3.5tr\n- Segment: VIP`;
        default:
            if (parsed.intent === "UNKNOWN") {
                return "🤔 Xin lỗi, em chưa hiểu lệnh này. Anh thử diễn đạt lại được không?";
            }
            return `🔄 Đã nhận lệnh: ${parsed.action}. Đang xử lý...`;
    }
}
