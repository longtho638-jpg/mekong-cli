# Mekong Engine — Founder SOPs

Hướng dẫn vận hành cho Founder/non-tech. Không cần CLI, không cần code.

## 1. Tạo Tenant Mới (Cấp API Key cho khách hàng)

```bash
curl -X POST https://mekong-engine.agencyos-openclaw.workers.dev/billing/tenants \
  -H "Content-Type: application/json" \
  -d '{"name":"Tên công ty khách"}'
```

**Response:**
```json
{
  "tenant_id": "abc-123...",
  "name": "Tên công ty khách",
  "api_key": "mk_7945abd8b629...",
  "tier": "free"
}
```

**LƯU Ý:** `api_key` chỉ hiện 1 lần duy nhất. Copy gửi khách ngay.

---

## 2. Khách Tự Cài LLM Key (BYOK)

Gửi hướng dẫn này cho khách:

### Bước 1: Chọn provider + paste API key

```bash
curl -X POST https://mekong-engine.agencyos-openclaw.workers.dev/v1/settings/llm \
  -H "Authorization: Bearer mk_xxx" \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai","api_key":"sk-proj-..."}'
```

| Provider | Chỉ cần gửi |
|----------|-------------|
| OpenAI | `{"provider":"openai","api_key":"sk-..."}` |
| Google | `{"provider":"google","api_key":"AIza..."}` |
| Anthropic | `{"provider":"anthropic","api_key":"sk-ant-..."}` |
| Custom | `{"provider":"custom","api_key":"...","base_url":"https://...","model":"..."}` |

base_url + model tự fill theo preset. Khách không cần biết.

### Bước 2: Kiểm tra (key được mask)

```bash
curl https://mekong-engine.agencyos-openclaw.workers.dev/v1/settings/llm \
  -H "Authorization: Bearer mk_xxx"
```

### Bước 3: Xóa key (quay về Workers AI miễn phí)

```bash
curl -X DELETE https://mekong-engine.agencyos-openclaw.workers.dev/v1/settings/llm \
  -H "Authorization: Bearer mk_xxx"
```

---

## 3. Kiểm Tra Hệ Thống

```bash
# Health check
curl https://mekong-engine.agencyos-openclaw.workers.dev/health

# Kết quả OK:
# {"status":"ok","version":"3.1.0","bindings":{"d1":true,"kv":true,"ai":true}}
```

Nếu `d1: false` → D1 database chưa link. Liên hệ dev.

---

## 4. Kiểm Tra Credits Khách

```bash
curl https://mekong-engine.agencyos-openclaw.workers.dev/billing/credits \
  -H "Authorization: Bearer mk_xxx"
```

---

## 5. Xem Missions Khách Đã Chạy

```bash
curl https://mekong-engine.agencyos-openclaw.workers.dev/v1/tasks \
  -H "Authorization: Bearer mk_xxx"
```

---

## 6. Test AI Trực Tiếp

```bash
# Workers AI test (miễn phí, Llama 3.1)
curl https://mekong-engine.agencyos-openclaw.workers.dev/ai/test

# PEV pipeline test
curl -X POST https://mekong-engine.agencyos-openclaw.workers.dev/cmd \
  -H "Content-Type: application/json" \
  -d '{"goal":"hello world"}'
```

---

## 7. Deploy (Khi Dev Push Code Mới)

```bash
cd packages/mekong-engine
pnpm exec wrangler deploy
```

Hoặc: push code lên `main` → CI/CD tự deploy.

---

## 8. Pricing Tiers

| Tier | Credits/tháng | Giá | BYOK |
|------|--------------|-----|------|
| Free | 100 MCU | $0 | Workers AI only |
| Pro | Unlimited | $29/mo | Tất cả providers |
| Enterprise | Custom | Custom | Custom models |

MCU = Mekong Credit Unit. 1 simple task = 1 MCU, complex = 5 MCU.

---

## 9. Xử Lý Sự Cố

| Vấn đề | Giải pháp |
|--------|-----------|
| Health trả `503` | D1/AI binding thiếu → check Cloudflare dashboard |
| `401 Invalid API key` | Key sai hoặc tenant đã xóa |
| `402 Insufficient credits` | Hết credits → nạp thêm qua Polar.sh |
| `503 SERVICE_TOKEN not configured` | Chưa set secret → `wrangler secret put SERVICE_TOKEN` |
| BYOK key không hoạt động | Kiểm tra key đúng provider, chưa hết hạn |

---

## 10. Liên Kết Quan Trọng

- **Production:** https://mekong-engine.agencyos-openclaw.workers.dev
- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **D1 Console:** Dashboard → Workers & Pages → D1 → mekong-db
- **Polar.sh:** https://polar.sh (payment provider)

---

**Version:** 3.1.0
