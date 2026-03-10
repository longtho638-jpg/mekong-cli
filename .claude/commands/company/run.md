---
description: Universal task runner — dev và non-tech đều dùng được, auto-route đến đúng agent
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# /company run — Universal Task Runner

**Cái này là main command cho mọi người.**
Dev gõ tiếng Anh. Non-tech gõ tiếng Việt. Cùng một kết quả.

## USAGE
```
/company run "<goal>" [--agent <role>] [--urgent] [--silent] [--dry-run]
```

## BƯỚC 0 — GUARD: COMPANY PHẢI ĐƯỢC INIT
```
IF NOT .mekong/company.json:
  Print:
    ❌ Chưa setup company.
    Chạy: /company init
    (chỉ mất 2 phút, miễn phí)
  DỪNG
```

## BƯỚC 1 — ĐỌC COMPANY CONTEXT
```
Đọc .mekong/company.json:
  company_name, product_type, primary_language, scenario

Đọc .openclaw/config.json:
  routing_rules, fallback_chain

Đọc .mekong/mcu_balance.json:
  balance (nếu balance < 5 MCU → warn nhưng không block)
```

## BƯỚC 2 — LANGUAGE DETECTION
```
Detect ngôn ngữ của goal input.

IF goal là tiếng Việt:
  Translate internally sang English cho routing/classification
  Nhưng OUTPUT vẫn trả về theo primary_language của company
  (Nếu primary_language = "vi" → output tiếng Việt)
  (Nếu primary_language = "en" → output tiếng Anh)
  (Nếu primary_language = "both" → bilingual output)
```

## BƯỚC 3 — INJECT COMPANY IDENTITY
Thêm vào agent prompt:
```
Company: {company_name}
Product type: {product_type}
Tone: professional, helpful
Language output: {primary_language}
```

## BƯỚC 4 — ROUTE ĐẾN /COOK PIPELINE

Gọi đầy đủ `/cook` pipeline với:
- goal (đã translate nếu cần)
- company context injected
- IF --agent: override agent_role
- IF --urgent: force complexity = "standard" minimum, force API model
- IF --silent: suppress MCU info in output
- IF --dry-run: pass --dry-run xuống /cook

**Đây là thin wrapper.** Toàn bộ logic nằm trong /cook.
/company run chỉ add: company context + language handling + guard check.

## EXAMPLES

Non-tech (tiếng Việt):
```
/company run "viết bài blog về tính năng mới của sản phẩm"
/company run "trả lời email khiếu nại của khách hàng về billing"
/company run "tạo báo cáo doanh thu tuần này"
/company run "đăng social media thông báo update"
```

Dev (English):
```
/company run "refactor auth module to use dependency injection"
/company run "write integration tests for /v1/missions endpoint"
/company run "deploy to fly.io staging" --urgent
/company run "analyze MCU usage patterns last 30 days" --agent data
```

Mixed:
```
/company run "fix lỗi JWT expired quá nhanh" --agent cto
/company run "viết email upsell cho users dùng nhiều MCU" --agent sales
```
