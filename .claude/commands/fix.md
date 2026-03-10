---
description: Debug và fix bug với mandatory SCAN phase + Jidoka safety gate
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# /fix — Smart Bug Fixer

## USAGE
```
/fix "<bug description>" [--file <path>] [--line <n>] [--confirmed]
```

## RULE #1 — KHÔNG ĐƯỢC NHẢY VÀO CODE NGAY
Bắt buộc SCAN đầy đủ trước khi sửa bất cứ thứ gì.

## BƯỚC 1 — MANDATORY SCAN (không được bỏ qua)

```
a. IF --file provided:
     Read file đầy đủ
     IF --line provided: focus context ±30 lines quanh line đó
     Đọc các file import/dependency liên quan

b. ELSE:
     Grep codebase cho error string hoặc keywords từ bug description
     Tìm tối đa 5 file liên quan nhất
     Đọc từng file

c. ALWAYS:
     Bash: git log --oneline -5   → xem 5 commits gần nhất
     Bash: git diff HEAD~1        → xem thay đổi gần nhất
     Đọc .mekong/cto-memory.md    → có note nào liên quan không

d. IF có test files liên quan:
     Đọc test file → hiểu expected behavior
```

Output SCAN summary:
```
🔍 SCAN COMPLETE
Files read   : {list}
Git activity : {recent commit messages}
Error found  : {file:line if found}
Root cause hypothesis: {1-2 sentences}
```

## BƯỚC 2 — ROOT CAUSE ANALYSIS
Trước khi đề xuất fix, xác định:
```
1. Lỗi xảy ra ở đâu? (file, function, line)
2. Tại sao xảy ra? (logic error, null ref, type mismatch, ...)
3. Ảnh hưởng đến gì khác? (side effects)
4. Fix ở tầng nào? (1 line / 1 function / 1 module)
```

## BƯỚC 3 — JIDOKA SAFETY GATE
Kiểm tra TRƯỚC khi đề xuất fix:

```
🚨 DỪNG nếu bất kỳ điều nào sau đây đúng:
  □ Fix đụng đến database schema / migration files
  □ Fix thay đổi public API contract (endpoint, request/response format)
  □ Fix liên quan đến payment, billing, MCU deduction logic
  □ Fix có thể gây mất data không rollback được
  □ Fix thay đổi authentication / authorization logic

Nếu bất kỳ ô nào được check:
→ DỪNG ngay
→ In: "🚨 JIDOKA STOP: {lý do cụ thể}"
→ In: "→ Cần CEO review. Gõ /fix '...' --confirmed để force proceed."
→ KHÔNG tự ý tiếp tục
```

Nếu `--confirmed` flag có sẵn → bỏ qua gate, tiếp tục nhưng in warning rõ ràng.

## BƯỚC 4 — PROPOSE MINIMAL FIX
**Rule:** Fix ÍT nhất có thể. Không refactor thêm. Không "tiện thể cải thiện".

```
Show diff preview:
--- a/{file}
+++ b/{file}
@@ -{line} +{line} @@
  (context line)
- {old code}
+ {new code}
  (context line)

Fix scope  : {file}:{line_range}
Lines changed: {n} lines
Risk level : LOW / MEDIUM / HIGH
```

Hỏi:
```
Apply fix? [y/N]
  y → write to file + run tests
  N → dừng, user tự apply
```

## BƯỚC 5 — APPLY + VERIFY

```
IF user confirms y:
  1. Edit file với minimal change
  2. Bash: chạy test liên quan nếu có
     (pytest {test_file} -v, hoặc npm test, ...)
  3. Verify output:
     □ Tests pass (nếu có)
     □ Syntax valid
     □ Không introduce new TODOs
  4. IF verify fail → báo lỗi, KHÔNG tự ý retry khác
```

## BƯỚC 6 — SUMMARY
```
✅ Fix applied
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File    : {file}:{lines}
Change  : {one-line description}
Tests   : {pass/fail/skipped}
MCU     : -3 (balance: {remaining})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Lưu vào `.mekong/memory.json` với key_decisions = ["Fixed: {description}"].
