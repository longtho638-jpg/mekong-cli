---
description: Code/content review với domain-specific checklist
allowed-tools: Read, Glob, Grep, Bash
---

# /review — Domain-Aware Reviewer

## USAGE
```
/review [<file>] [--security] [--perf] [--full]
```

## BƯỚC 1 — DETECT DOMAIN
```
IF file provided:
  Đọc file → detect domain từ extension + content

Domain detection:
  .py / .ts / .js / .go → code
  .md / blog / email / post → content/creative
  Dockerfile / .yaml / .sh / infra → ops
  .csv / metrics / report → analysis

IF không có file:
  Đọc tất cả files changed trong git:
    Bash: git diff --name-only HEAD~1
  Detect domain từ danh sách files
```

## BƯỚC 2 — RUN DOMAIN CHECKLIST

### Code Review Checklist
```
CORRECTNESS:
  □ Logic đúng với yêu cầu
  □ Edge cases được handle
  □ Return types consistent

SECURITY (luôn check):
  □ Không có hardcoded secrets, API keys, passwords
  □ Input validation có mặt
  □ SQL injection / XSS không thể xảy ra
  □ Authentication checks đầy đủ

PERFORMANCE (nếu --perf):
  □ Không có N+1 query
  □ Heavy operations được cache
  □ Không blocking async code

MAINTAINABILITY:
  □ File size < 200 lines
  □ Function size < 50 lines
  □ Không có TODO/placeholder comments
  □ Không có personal paths (Users/username/...)
  □ Naming conventions nhất quán

TESTS:
  □ Tests tồn tại cho logic mới
  □ Happy path + error path được cover
```

### Content/Creative Review Checklist
```
CLARITY:
  □ Headline rõ ràng, không mơ hồ
  □ 1 message chính cho 1 piece

TONE:
  □ Phù hợp với brand voice (đọc từ .mekong/company.json nếu có)
  □ Không quá formal hoặc quá casual cho context

SEO (nếu blog/web):
  □ Keyword xuất hiện trong title + đầu bài
  □ Meta description <= 160 chars

CTA:
  □ Có clear call-to-action
  □ CTA đặt đúng vị trí

LOCALIZATION (nếu bilingual):
  □ Không dùng idiom khó dịch
```

### Ops/Infra Review Checklist
```
  □ Idempotent (chạy nhiều lần không gây lỗi)
  □ Error handling + rollback plan
  □ Monitoring hooks / logging
  □ Không hardcode environment-specific values
  □ Secrets dùng env vars, không commit
```

### Analysis Review Checklist
```
  □ Data source được cite rõ ràng
  □ Sample size đủ lớn
  □ Không cherry-pick data
  □ Có actionable insights, không chỉ description
  □ Visualizations có labels đầy đủ
```

## BƯỚC 3 — UNIVERSAL CHECKS (luôn áp dụng)
```
□ Không có hardcoded secrets/keys
□ Không có personal file paths (Users/username/...)
□ Không có TODO hoặc placeholder comments
□ File < 200 lines (nếu code)
```

## BƯỚC 4 — OUTPUT REPORT

```
📋 REVIEW: {file or "staged changes"}
Domain: {code|content|ops|analysis}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ PASS ({n} checks)
  + {what's good}
  + {what's good}

⚠️  WARNINGS ({n} items) — không block merge
  ~ {line X}: {description}

❌ ISSUES ({n} items) — cần fix trước merge
  ✗ {line X}: {description}
  ✗ {line Y}: {description}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score: {n}/100
Verdict: APPROVE / APPROVE WITH CHANGES / REQUEST CHANGES
```

Nếu có issues → hỏi: `Auto-fix issues? [y/N]`
Nếu y → dùng `/fix` pipeline cho từng issue.
