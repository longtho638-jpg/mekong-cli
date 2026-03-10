---
description: Customer discovery — interview scripts, PMF survey, hypothesis testing, insight synthesis
allowed-tools: Read, Write, Bash
---

# /founder validate — Customer Discovery Engine

## USAGE
```
/founder validate [--idea "<description>"] [--interviews <n>] [--survey] [--analyze]
```

## BƯỚC 0 — SCAN CONTEXT
```
□ Đọc .mekong/company.json       → product_type, company_name
□ Đọc .mekong/founder/persona.json (nếu có) → ICP đã có
□ Đọc .mekong/validate/ (nếu có) → previous validation data

IF --idea: override product description với flag value
IF không có idea + không có company.json:
  Hỏi: "Mô tả ngắn gọn vấn đề bạn đang giải quyết?"
  Đọc input → lưu vào session
```

## BƯỚC 1 — HYPOTHESIS FRAMEWORK

**Agent: Data / local / 1 MCU**

Từ idea/product description, generate:

```
VALIDATION FRAMEWORK — {company_name}

RISKIEST ASSUMPTIONS (sắp xếp theo risk):
  A1: "{assumption 1}" — nếu sai → toàn bộ model sụp đổ
  A2: "{assumption 2}" — nếu sai → revenue model sai
  A3: "{assumption 3}" — nếu sai → need pivot

HYPOTHESIS TO TEST:
  H1: {specific, falsifiable statement}
      Test: {how to test in <1 week}
      Success metric: {number}
  
  H2: {specific, falsifiable statement}
      Test: {how to test}
      Success metric: {number}

WHO TO TALK TO:
  Primary: {job title / persona}
  Secondary: {job title / persona}
  Avoid: {who would give biased data}
```

## BƯỚC 2 — INTERVIEW KIT

**Agent: CS + CMO / haiku + gemini / 2 MCU**

Generate The Mom Test-style interview scripts:

```
FILE: .mekong/validate/interview-script.md

INTERVIEW SCRIPT — {hypothesis being tested}
Duration: 20-30 minutes
Goal: Validate/invalidate H1 + H2

PRE-INTERVIEW RULES (print these, read before every call):
  □ Ask about the PAST, not the future ("Would you use..." = useless)
  □ Never pitch. Never mention your solution.
  □ If they say "that's a great idea" — probe harder
  □ 3 consecutive "yes" answers = bad interviewer, not good signal
  □ Write down exact words they use (for copy later)

OPENING (2 min):
  "Tôi đang nghiên cứu về {problem_space}. Bạn có thể kể cho tôi nghe
   lần cuối bạn phải deal với {problem} là như thế nào không?"

CORE QUESTIONS (15 min):
  1. "Bạn đã thử giải quyết vấn đề này bằng cách nào?"
     → Probe: "Tại sao cách đó không đủ?"
  
  2. "Bạn tốn bao nhiêu thời gian/tiền cho vấn đề này mỗi tháng?"
     → Probe: "Đó là ước tính thấp hay cao?"
  
  3. "Nếu vấn đề này biến mất ngay ngày mai, cuộc sống của bạn thay đổi
      như thế nào?"
     → Listen for: emotion, specific outcomes, dollar amounts
  
  4. "Ai khác trong tổ chức của bạn bị ảnh hưởng bởi vấn đề này?"
     → Map: who's the buyer vs user vs decision maker
  
  5. "Bạn đã search gì gần đây để tìm giải pháp?"
     → Gold: exact search terms = your SEO keywords

CLOSING (5 min):
  "Nếu có giải pháp hoàn hảo cho vấn đề này, bạn sẵn sàng trả bao
   nhiêu một tháng?"
  → Then shut up. Wait. Don't suggest a number.
  
  "Bạn có biết ai khác đang deal với vấn đề tương tự không?
   Tôi có thể nói chuyện với họ được không?"
  → Referral rate = engagement signal

POST-INTERVIEW (fill in ngay sau call):
  Pain level (1-10): ___
  Budget signal: $___/mo
  Current solution: ___
  Key quote: "___________"
  Referral given: Y/N
  Verdict: PROBLEM CONFIRMED / WEAK SIGNAL / PIVOT NEEDED
```

## BƯỚC 3 — OUTREACH SEQUENCES

**Agent: Sales / haiku / 2 MCU**

Generate 3 variants outreach message:

```
FILE: .mekong/validate/outreach-messages.md

CHANNEL: LinkedIn / Twitter DM / Email Cold

VARIANT A — Problem-first (tỷ lệ reply cao nhất):
  "Tôi đang nghiên cứu về {problem_space} và thấy bạn làm {role} tại {company}.
   Tôi không bán gì cả — chỉ muốn nghe về kinh nghiệm của bạn với {specific_pain}.
   20 phút qua Zoom tuần này được không?"

VARIANT B — Mutual connection:
  "Tôi được {name} giới thiệu. Họ nói bạn là người hiểu nhất về {problem_space}.
   Đang nghiên cứu cho {project} — bạn có thể spare 20 phút không?"

VARIANT C — Content hook:
  "Vừa đọc bài bạn viết về {topic} — rất hay.
   Đang research về {problem_space} và muốn nghe quan điểm của bạn.
   Có thể chat 20 phút không?"

FOLLOW-UP (nếu không reply sau 3 ngày):
  "Just bumping this up — {1 sentence reminder of ask}."
  (chỉ follow up 1 lần)

TARGET LIST TEMPLATE (10 người):
  Generate danh sách 10 personas phù hợp nhất từ ICP
  Format: Name | Title | Company | Platform | DM/Email | Priority
```

## BƯỚC 4 — PMF SURVEY (nếu --survey flag)

**Agent: Data / local / 1 MCU**

Sean Ellis PMF survey + analysis template:

```
FILE: .mekong/validate/pmf-survey.md

THE 4 PMF QUESTIONS (Sean Ellis method):
  Q1: "How would you feel if you could no longer use {product}?"
      [ ] Very disappointed
      [ ] Somewhat disappointed
      [ ] Not disappointed (it isn't really that useful)
      [ ] N/A — I no longer use it

  Q2: "What type of people do you think would most benefit from {product}?"
      (open text)

  Q3: "What is the main benefit you receive from {product}?"
      (open text)

  Q4: "How can we improve {product} for you?"
      (open text)

PMF THRESHOLD:
  IF Q1 "very disappointed" >= 40% → PMF achieved
  IF Q1 "very disappointed" 25-39% → close, optimize
  IF Q1 "very disappointed" < 25% → pivot needed

SURVEY DISTRIBUTION:
  Send to: first 50+ users who've used product ≥2 times
  Tool: Typeform (free) or Google Forms
  Follow up: personal email to "very disappointed" group

ANALYSIS PROMPT (giao cho Data agent khi có results):
  "Analyze Q2+Q3 open text from {n} responses.
   Extract: top 3 use cases, exact language for positioning,
   segments with highest PMF score."
```

## BƯỚC 5 — ANALYZE (nếu --analyze flag)

**Agent: Data / local / 1 MCU**

Sau khi có interview notes:

```
Input: paste nội dung notes từ interviews vào

Data agent synthesizes:
  1. PATTERN ANALYSIS:
     Most common pain: "{exact words}
     Most common current solution: {tool/workaround}
     Average willingness to pay: ${range}/mo
     Pain level average: {n}/10
     Problem confirmed: Y/N

  2. KEY QUOTES (for marketing copy):
     "{exact quote}" — {title}, {company}
     "{exact quote}" — {title}, {company}

  3. POSITIONING INSIGHT:
     "Customers describe the problem as: {their words}"
     "They measure success by: {their metric}"
     "Their current budget for this: ${range}"

  4. VERDICT:
     PMF SIGNAL: STRONG / MODERATE / WEAK / PIVOT
     Recommended next step: {specific action}
     
  5. ICP REFINEMENT:
     "Based on {n} interviews, your best customer is:
      {job title} at {company size} in {industry}
      who currently uses {tool} and spends ${n}/mo on this problem"
```

## OUTPUT SUMMARY

```
✅ Validation Kit Ready — {company_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 .mekong/validate/
  ✓ hypothesis-framework.md
  ✓ interview-script.md
  ✓ outreach-messages.md (3 variants)
  ✓ pmf-survey.md
  ✓ target-list.md (10 contacts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 MCU: -2 (balance: {remaining})

NEXT 48H ACTIONS (OpenClaw executes, Human approves):
  1. Human: Review outreach-messages.md → approve/edit
  2. OpenClaw (/founder outreach): Send to 10 targets
  3. Human: Do interviews (20 min each)
  4. OpenClaw (/founder validate --analyze): Synthesize findings
  5. Human: Make go/no-go decision
```
