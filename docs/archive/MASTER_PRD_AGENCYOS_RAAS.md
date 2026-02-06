# MASTER PRD: AGENCYOS RAAS ECOSYSTEM

## 1. Executive Summary (Tầm nhìn)

**AgencyOS** chuyển mình từ một SaaS quản lý (CRM/PM) sang một nền tảng **RaaS (Results-as-a-Service)**.

- **Core Philosophy:** "We don't sell tools. We sell Deliverables." (Chúng tôi không bán công cụ, chúng tôi bán kết quả công việc).
- **Architecture Pattern:** Hub-and-Spoke.
- **Hub:** Hệ thống Backend điều phối Agent (Orchestrator).
- **Spoke 1 (Money Maker):** Web Platform dành cho khách hàng trả phí (No-code).
- **Spoke 2 (Traffic Engine):** Open Source Kit dành cho Developer (Low-code/Antigravity).

---

## 2. System Architecture (Kiến trúc tổng thể)

### Zone A: The "Money" Layer (Client Web App)

- **User:** Agency Owners (Non-tech).
- **Interface:** Next.js Web App.
- **Function:** Nạp tiền → Chọn Service → Nhận kết quả.
- **Stack:** Next.js 14, Tailwind, Supabase (Postgres), Stripe.

### Zone B: The "Viral" Layer (Community Dev Kit)

- **User:** Developers, Tech-savvy Marketers.
- **Interface:** CLI Tool & Antigravity IDE.
- **Function:** Viết "Recipe" (Quy trình), Chạy thử local, Đóng góp vào Marketplace.
- **Stack:** Python CLI, NixOS Config (.idx), Markdown Recipes.

### Zone C: The "Engine" Layer (Infrastructure)

- **User:** System Admin / AI Agents.
- **Interface:** API & Worker Process.
- **Function:** Thực thi tasks, quản lý hàng đợi, bảo mật.
- **Stack:** GCP Compute (Dockerized OpenClaw), Cloudflare Worker (Gateway), Redis (BullMQ), Vertex AI.

---

## 3. Data Model Strategy (Cốt lõi dữ liệu)

### The "Recipe" Standard (JSON Schema)

```json
{
  "id": "lead_gen_v1",
  "name": "CEO Hunter",
  "version": "1.0.0",
  "inputs": [{ "key": "domain", "type": "string", "label": "Target Website" }],
  "price_per_run": 10,
  "logic": {
    "engine": "openclaw",
    "workflow_file": "workflows/ceo_hunt.lb",
    "model": "gemini-1.5-pro"
  }
}
```

---

## 4. Implementation Specs

### PHẦN I: INFRASTRUCTURE (The Engine) - Ưu tiên số 1

1. **Job Queue System (Redis + BullMQ):**
   - Xây dựng hàng đợi `raas_tasks`.
   - Cơ chế `concurrency`: Giới hạn số Agent chạy đồng thời.
   - Cơ chế `retry`: Tự động thử lại 3 lần.

2. **Cloudflare Gateway (Moltworker):**
   - Chỉ chấp nhận Request có `Authorization: Bearer <SECRET_KEY>`.
   - Validate Payload: Chống Prompt Injection.

3. **OpenClaw Wrapper:**
   - API Server bọc quanh OpenClaw.
   - Endpoint: `POST /execute` nhận Recipe ID + Inputs.

### PHẦN II: CLIENT WEB APP (The Money) - Ưu tiên số 2

1. **Service Marketplace UI:** Danh sách Recipes dạng Card.
2. **Real-time Status (WebSocket/Polling):** Processing states.
3. **Result Delivery:** Markdown/File download.

### PHẦN III: OPEN SOURCE KIT (The Viral) - Ưu tiên số 3

1. **Recipe Converter:** Markdown → JSON Schema.
2. **Local Runner:** Dev chạy Agent local với API Key.
3. **Upsell Hook:** Đóng góp Recipe nhận 20% hoa hồng.

---

## 5. Security & Risk Management

1. **Credit Shield:** Hold → Deduct (SUCCESS) or Release (FAILED).
2. **Sandbox Isolation:** Stateless containers, auto-reset.

---

## 6. Monorepo Structure

```
/apps/web         (Next.js 14): Client-facing RaaS platform
/apps/worker      (Node.js): Backend orchestrator BullMQ
/apps/cli         (Python): Open-source community tool
/packages/recipes (Shared): JSON/Markdown recipes
/infrastructure   (Terraform/Docker): OpenClaw + Redis + Postgres
```

---

## 7. Next Step Action

- **Tuần 1:** /apps/worker + /infrastructure
- **Tuần 2:** /apps/web + Worker integration
- **Tuần 3:** /apps/cli → Github Viral
