# CHIẾN LƯỢC & PRD: AGENCYOS RAAS (CLIENT-FACING)

## PHẦN 1: CHIẾN LƯỢC SẢN PHẨM (STRATEGY)

### 1. Định vị (Positioning)

- **Concept:** "Vending Machine for Agency Work" (Máy bán hàng tự động cho công việc Agency).
- **Trải nghiệm:** Khách hàng bỏ tiền (Credits) → Chọn món (Leads, Content, Report) → Máy nhả ra kết quả.

### 2. Mô hình dòng tiền (Monetization Logic)

- **Currency:** `AgencyCoin` (1 Coin = $0.1).
- **Pricing:**
  - Lead Scraping: 2 Coins/lead
  - SEO Article: 50 Coins/bài
  - Competitor Report: 100 Coins/lần

- **Risk Control:** Cơ chế **"Hold & Release"**. Trừ tiền trước, nếu AI fail → Hoàn tiền tự động.

---

## PHẦN 2: ĐẶC TẢ KỸ THUẬT

### Tech Stack

- **Frontend:** Next.js 14 (App Router), TailwindCSS, ShadcnUI
- **Backend:** Node.js (Express/NestJS) or Python (FastAPI)
- **Database:** PostgreSQL (Supabase/Neon)
- **Queue:** BullMQ + Redis
- **Agent:** REST API webhook to OpenClaw (via Cloudflare Tunnel)

### Module A: Credit & Wallet System (The Fuel)

**Database Schema (`credits_wallet`):**

- `user_id` (UUID)
- `balance` (Integer)
- `transactions_history` (JSONB)

**API Endpoints:**

- `POST /api/billing/top-up`: Create Stripe session
- `GET /api/billing/balance`: Check credits

### Module B: Job Dispatcher (The Brain)

**Database Schema (`jobs`):**

- `id`, `user_id`, `type`, `status`, `input_params`, `output_data`, `cost`

**Workflow:**

1. User submits form → Validate credits
2. Deduct credits (Hold)
3. Push to Redis Queue (`raas_queue`)
4. Worker picks job → POST to OpenClaw
5. OpenClaw webhook back → Update status
6. Notify User

### Module C: Services

1. **Lead Hunter:** Form → OpenClaw → Table + CSV
2. **SEO Content Generator:** Form → OpenClaw → Doc/CMS Draft

---

## PHẦN 3: SECURITY & UX

### Security

- Rate Limiting: Prevent spam
- Timeout: 30 mins → FAILED → Refund
- Input Validation: Prevent prompt injection

### UX - "Fake Progress" (Perceived Value)

_"AI đang đọc báo..."_ → _"AI đang viết bài..."_ → _"AI đang tìm ảnh..."_
→ Tăng giá trị cảm nhận, 50 Credits là xứng đáng.

---

## PHẦN 4: IMPLEMENTATION ORDER

1. **Database:** Prisma schema (Users, Wallets, Jobs)
2. **Backend:** Express + BullMQ + Webhooks
3. **Agent Connector:** OpenClaw Cloudflare URL
4. **Frontend:** "New Job" wizard component
