# Phân tích AIforWork.co — Bài học cho Super Agents / RaaS

**Ngày:** 2026-02-28
**Mục đích:** Nghiên cứu mô hình sản phẩm & kinh doanh của aiforwork.co để áp dụng vào Mekong CLI + AgencyOS RaaS

---

## 1. AIforWork.co là gì?

- **Loại:** Thư viện prompt miễn phí (free prompt library), KHÔNG phải marketplace trả phí hay SaaS subscription
- **Tagline:** "The most advanced ChatGPT prompt and resource library — designed for professionals, by professionals"
- **Core value:** 2,000+ prompt ChatGPT được tổ chức theo vai trò/ngành nghề chuyên môn
- **Workflow:** Copy-paste prompt vào ChatGPT (external) — KHÔNG có tích hợp trực tiếp
- **User base:** 333,287+ professionals (claim); 45,000+ active users từ Shopify, Apple, Google, ByteDance, Amazon

**Sources:**
- https://aiforwork.co
- https://skywork.ai/skypage/en/AIforWork.co-Deep-Dive-Your-New-AI-Productivity-Engine/1972863401778147328
- https://aipure.ai/products/ai-for-work

---

## 2. Cách tổ chức sản phẩm

Phân cấp 3 tầng:

| Tầng | Ví dụ |
|------|-------|
| **Phòng ban (Department)** | Marketing & Sales, Legal & HR, Finance, IT, Engineering, Education, Real Estate |
| **Vai trò (Job Role)** | CTO, Product Marketing Manager, Account Manager, HR Director |
| **Tác vụ (Task)** | Viết roadmap, báo cáo, đề xuất, chiến lược |

**Đặc điểm nổi bật:**
- Mỗi prompt đóng vai chuyên gia (role-play expert persona)
- Có "interactive workflow": AI hỏi clarifying questions → draft → self-evaluation → refine
- Kèm guide giải thích "What, Why, How" cho từng loại tài liệu

---

## 3. Mô hình kiếm tiền

**Hiện tại: HOÀN TOÀN MIỄN PHÍ**

| Yếu tố | Chi tiết |
|--------|----------|
| Truy cập | Free sign-up, không paywall |
| Doanh thu trực tiếp | Chưa rõ — có thể ads hoặc affiliate |
| Indirect monetization | Người dùng cần ChatGPT Plus (trả tiền cho OpenAI) để dùng hiệu quả |
| Premium tier | Chưa public, MemberSpace integration gợi ý có subscription tiềm năng |

**Nhận xét:** Traffic declining 2.1% (236,629 visits) — mô hình free-only đang có dấu hiệu bão hòa khi cạnh tranh tăng.

---

## 4. Điểm mạnh tạo nên thành công

1. **Vertical specialization** — Không làm generic, tập trung B2B professional use cases
2. **Low friction entry** — Free, không cần credit card, copy-paste ngay
3. **Role-based discovery** — User tìm theo job role, không phải theo tính năng kỹ thuật
4. **Expert persona prompts** — Mỗi prompt simulate được expertise chuyên ngành
5. **Trust signals** — Logo công ty lớn (Apple, Google) tăng credibility

---

## 5. Áp dụng cho Mekong CLI + AgencyOS RaaS

### Gap chính của AIforWork.co (cơ hội cho chúng ta):

| AIforWork.co | Mekong CLI / AgencyOS |
|---|---|
| Copy-paste workflow, thụ động | **Agents tự chạy**, thực thi task end-to-end |
| Phụ thuộc user có ChatGPT Plus | **Built-in LLM** via Antigravity Proxy |
| Prompt library tĩnh | **Living agents** học từ feedback |
| Free, không có execution | **RaaS: Agents-as-a-Service có billing** |
| No CLI, no automation | **CLI-first, automatable via Tôm Hùm** |

### Mô hình đề xuất — "Super Agents Marketplace"

```
1. DIRECTORY (như AIforWork nhưng executable)
   /agents/<department>/<role>/<task>
   → Mỗi entry = 1 agent có thể /cook trực tiếp

2. TIERS
   Free:    Agents open-source, tự chạy trên infra riêng
   RaaS:    Chạy trên AgencyOS cloud, pay-per-execution
   Agency:  White-label, custom agents, priority support

3. CATEGORIES (ánh xạ từ AIforWork)
   - Marketing Agents (content, SEO, ads)
   - Sales Agents (lead gen, outreach, CRM sync)
   - Ops Agents (HR, legal docs, finance reports)
   - Dev Agents (code review, CI/CD, security audit)
   - E-commerce Agents (84tea, anima119 patterns)

4. DISCOVERY (DX tốt hơn AIforWork)
   mekong agents list --department=marketing
   mekong agents run sales/lead-hunter --target="fintech SaaS"
```

### Actionable insights cụ thể:

- **Naming convention:** Dùng cấu trúc `<department>/<role>/<task>` cho agent registry trong `src/agents/`
- **Onboarding:** 1 agent hoạt động ngay không cần config (như copy-paste của AIforWork)
- **Trust signals:** Showcase "works for" use cases thực tế (84tea, sophia, apex-os)
- **Content moat:** Mỗi agent kèm "Why this works" guide → tăng SEO + trust
- **Monetization:** RaaS execution credits ($/agent-run) thay vì subscription flat-fee

---

## Câu hỏi còn mở

1. AIforWork.co có affiliate/sponsorship model ẩn không? Traffic source breakdown?
2. MemberSpace integration — họ có paid tier thực sự không hay chỉ gating content free?
3. Competitor analysis cần thiết: PromptBase, FlowGPT, AgentGPT — so sánh model nào viable nhất?
4. RaaS pricing: execution-based vs seat-based vs outcome-based — cái nào phù hợp hơn với agency use case?
