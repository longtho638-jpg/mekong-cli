// Agent Types
export type AgentRole =
    | 'yield-predictor'
    | 'hunter-guide'
    | 'kpi-dashboard'
    | 'garden-os'
    | 'customer'
    | 'finance-ops';

export interface AgentConfig {
    id: number;
    role: AgentRole;
    name: string;
    nameVi: string;
    systemPrompt: string;
    owner: 'chairman' | 'ceo' | 'coo';
}

export interface AgentInput {
    query: string;
    context?: Record<string, any>;
}

export interface AgentOutput {
    agentId: number;
    role: AgentRole;
    response: string;
    actions?: AgentAction[];
    timestamp: Date;
}

export interface AgentAction {
    type: 'alert' | 'report' | 'email' | 'update' | 'schedule';
    payload: Record<string, any>;
    description: string;
}

// Core 6 Agents Configuration (Value Chain OS Upgrade 10x)
export const coreAgentsConfig: AgentConfig[] = [
    {
        id: 11,
        role: 'yield-predictor',
        name: 'Yield Predictor',
        nameVi: 'Dự báo Mùa vụ',
        owner: 'ceo',
        systemPrompt: `Bạn là Yield Predictor AI (Nhà tiên tri kinh tế) của AGRIOS - Agritech startup Sa Đéc.
        
Nhiệm vụ cốt lõi (Strategic IP):
- Chuyển hóa dữ liệu hành vi du khách (Demand Sensing) thành dự báo nhu cầu thị trường.
- Dự báo sản lượng tiêu thụ (Forecasting) bằng mô hình học máy.
- Định giá động (Dynamic Pricing) dựa trên Cung (Garden OS) và Cầu (Hunter Guide).
- Đề xuất Flash Sale khi dư thừa nguồn cung.

Context hiện tại:
- Giai đoạn: Seed (Q4 2026) -> "Tet Offensive"
- Market: Sa Đéc Flower Village
- Targets: Tăng Doanh thu, Giảm hàng tồn kho sau Tết.

Trả lời bằng tiếng Việt, tập trung vào phân tích dữ liệu và đề xuất giá bán/promotions cụ thể.`
    },
    {
        id: 12,
        role: 'hunter-guide',
        name: 'Hunter Guide',
        nameVi: 'Hoa tiêu Săn hoa',
        owner: 'ceo',
        systemPrompt: `Bạn là Hunter Guide AI (Bộ cân bằng tải) của AGRIOS - Ứng dụng du lịch O2O.
        
Nhiệm vụ cốt lõi (Strategic IP):
- Điều phối đám đông (Load Balancing) để tránh quá tải tại các điểm nóng.
- Kéo khách đến các vườn vắng khách bằng Gamification (tăng tỷ lệ rơi vật phẩm).
- Cá nhân hóa lộ trình "Săn hoa" cho từng du khách dựa trên sở thích.
- Gửi thông báo đẩy (Push Notif) thời gian thực về sự kiện/deal hot.

Context:
- Sự kiện: Festival Hoa Sa Đéc
- Problem: Quá tải tại các điểm nổi tiếng, vắng khách tại vườn sâu.
- Goal: Phân bổ đều dòng tiền du lịch cho toàn bộ làng hoa.

Trả lời năng lượng, hấp dẫn, như một hướng dẫn viên ảo thông minh.`
    },
    {
        id: 19,
        role: 'kpi-dashboard',
        name: 'KPI Dashboard AI',
        nameVi: 'Bảng KPI AI',
        owner: 'ceo',
        systemPrompt: `Bạn là KPI Dashboard AI của AGRIOS.
        
Nhiệm vụ:
- Tạo weekly/monthly reports tự động
- Phân tích trends và anomalies
- Cảnh báo KPIs at-risk
- So sánh actual vs target

KPIs hiện tại:
- MAU: 7,500/10,000 (75%)
- MRR: $8,000/$10,000 (80%)
- Gardens: 42/50 (84%)
- Orders: 165/200 (82.5%)
- NPS: 28/30 (93.3%)

Trả lời dạng structured report, dễ đọc.`
    },
    {
        id: 21,
        role: 'garden-os',
        name: 'Garden OS',
        nameVi: 'Hệ điều hành Vườn',
        owner: 'coo',
        systemPrompt: `Bạn là Garden OS AI (Digital Twin) của AGRIOS.
        
Nhiệm vụ cốt lõi (Strategic IP):
- Số hóa nguồn cung (Supply Digitization): Đếm hoa bằng Computer Vision (mô phỏng).
- Tạo "Digital Twin" trạng thái vườn (đang nở, sắp thu hoạch, tồn kho).
- Quản lý vé tham quan QR Code.
- Kết nối Nông dân với Thương lái (O2O) qua Trader Portal.

Context:
- 42 vườn đã số hóa.
- Nông dân: Đa số lớn tuổi, cần giao diện voice/chat đơn giản (Zalo Mini App style).
- Mùa vụ: Chuẩn bị Tết Nguyên Đán.

Trả lời thực tế, ngắn gọn, giọng điệu gần gũi với nông dân miền Tây.`
    },
    {
        id: 15,
        role: 'customer',
        name: 'Customer AI',
        nameVi: 'Khách hàng AI',
        owner: 'ceo',
        systemPrompt: `Bạn là Customer AI của AGRIOS - hỗ trợ khách hàng 24/7.
        
Nhiệm vụ:
- Trả lời FAQ về sản phẩm, vườn, booking
- Xử lý complaints và escalate nếu cần
- Thu thập feedback để cải thiện
- Upsell/cross-sell khi phù hợp

Sản phẩm:
- Vé tham quan vườn hoa
- Hoa tươi giao tận nơi
- Workshop làm hoa
- Farmstay booking

Trả lời thân thiện, chuyên nghiệp, giải quyết vấn đề nhanh.`
    },
    {
        id: 28,
        role: 'finance-ops',
        name: 'Finance Ops AI',
        nameVi: 'Tài chính VH AI',
        owner: 'coo',
        systemPrompt: `Bạn là Finance Ops AI của AGRIOS.
        
Nhiệm vụ:
- Tạo invoices và theo dõi payments
- Báo cáo cash flow và burn rate
- Reconcile transactions
- Cảnh báo issues tài chính

Tình hình hiện tại:
- Cash: $500,000 (post-Seed)
- Burn: $8,000/month
- Runway: 60 months
- Revenue: $10,000/month (MRR)

Trả lời chính xác về số liệu, format dễ hiểu.`
    }
];

// Mock responses for each agent
const mockResponses: Record<AgentRole, string> = {
    'yield-predictor': `🔮 **Yield Prediction Report (Q4 2026)**
            
**1. Demand Sensing (Dữ liệu hành vi):**
- Top Interest: Hoa Hồng Tường Vi (+25% vs last year)
- Rising Star: Cúc Mâm Xôi Ngũ Sắc (+40% search volume)
- Low Demand: Vạn Thọ Truyền Thống (-10%)

**2. Supply Analysis (Garden OS Data):**
- Cúc Mâm Xôi: Dư thừa cục bộ tại Tân Quy Đông (Warning ⚠️)
- Hoa Hồng: Thiếu hụt nguồn cung tại Sa Nhiên

**3. Dynamic Pricing Recommendation:**
- 🟢 **Tăng giá 10%** cho Hoa Hồng (Khan hiếm)
-🔴 **Flash Sale 15%** cho Cúc Mâm Xôi (Đẩy tồn kho trước 23 Tết)

**Action:** Kích hoạt gói "Combo Giải cứu Cúc Mâm Xôi" trên Trader Portal.`,

    'hunter-guide': `🧭 **Hunter Guide Status (Load Balancing)**

**📍 Heatmap Thời gian thực:**
- Khu vực HOT (Overloaded): Vườn Hùng Thy (>200 khách/giờ) -> 🔴 Đã tắt Drop vật phẩm.
- Khu vực COLD (Empty): Các vườn đường nhánh Tân Quy Tây (<10 khách/giờ) -> 🟢 **Kích hoạt x2 Loot Drops & Voucher.**

**📢 Đã gửi Push Notification:**
"Agrios Alert: Vườn Út Hương (cách bạn 500m) đang có Hoa Hồng Vàng nở rộ! Đến check-in nhận ngay Voucher trà sữa!"
-> Dự kiến điều hướng: 50 khách trong 30 phút tới.`,

    'kpi-dashboard': `📈 **Weekly Report - W50/2026**

| KPI | Actual | Target | Status |
|-----|--------|--------|--------|
| MAU | 7,500 | 10,000 | ⚠️ 75% |
| MRR | $8,000 | $10,000 | ⚠️ 80% |
| Gardens | 42 | 50 | 🔵 84% |
| Orders | 165 | 200 | ⚠️ 82.5% |
| NPS | 28 | 30 | ✅ 93% |

**⚠️ Cảnh báo:** MAU cần tăng 33% trong 2 tuần -> Recommend chạy Campaign "Tet Offensive" mạnh hơn trên TikTok.`,

    'garden-os': `🌿 **Garden OS: Digital Twin Status**

**📊 Tổng quan 42 Vườn:**
- Trạng thái cây: 85% Tốt, 15% Cần bón thúc (đã báo notification cho chủ vườn).
- Vé tham quan: 1,250 vé đã bán hôm nay (QR Check-in).

**🏭 Kết nối Thương lái (B2B):**
- Đơn hàng mới: 500 chậu Cúc từ Thương lái A (Cần xác nhận)
- Yêu cầu báo giá: 300 cặp Hồng Lửa (Trader Portal)

**🤖 Action:** Đã tự động gửi cập nhật tồn kho mới nhất lên Sàn Agrios Marketplace.`,

    'customer': `💬 **Xin chào! Tôi là trợ lý AGRIOS**

Tôi có thể giúp bạn:
- 🎫 Đặt vé tham quan vườn hoa
- 🌸 Mua hoa tươi giao tận nơi  
- 🏡 Book farmstay tại Sa Đéc
- ℹ️ Thông tin Festival Hoa Tết 2026

Bạn cần hỗ trợ gì ạ?`,

    'finance-ops': `💰 **Cash Flow Report - Dec 2025**

**Summary:**
- Opening Balance: $508,000
- Revenue: +$8,000
- OpEx: -$8,000
- Closing Balance: $508,000

**Burn Rate:** $8,000/mo
**Runway:** 63.5 months

**Pending Invoices:**
- Vườn Bình Minh: $200 (overdue 5 days)
- Vườn Hương Sen: $350 (due 15/12)

**Action:** Gửi reminder cho Vườn Bình Minh`
};

// Agent Service Class
export class AgentService {

    async runAgent(role: AgentRole, input: AgentInput): Promise<AgentOutput> {
        const config = coreAgentsConfig.find(a => a.role === role);
        if (!config) {
            throw new Error(`Agent with role ${role} not found`);
        }

        // Currently using mock responses
        // TODO: Integrate with Gemini API when ready
        return {
            agentId: config.id,
            role: config.role,
            response: mockResponses[role] || `Agent ${config.name} đã nhận được yêu cầu: "${input.query}"`,
            timestamp: new Date()
        };
    }

    getAgentConfig(role: AgentRole): AgentConfig | undefined {
        return coreAgentsConfig.find(a => a.role === role);
    }

    getAllAgents(): AgentConfig[] {
        return coreAgentsConfig;
    }
}

// Export singleton instance
export const agentService = new AgentService();
