---
description: Legal checklist — incorporation, IP protection, contracts, privacy policy, terms of service
allowed-tools: Read, Write
---

# /founder legal — Legal Foundation Kit

**⚠️ DISCLAIMER: Đây không phải tư vấn pháp lý. Luôn tham khảo luật sư trước khi ký bất cứ tài liệu pháp lý nào.**

## USAGE
```
/founder legal [--stage incorporation|ip|contracts|compliance|all]
```

## BƯỚC 0 — SCAN
```
□ Đọc .mekong/company.json    → country, product_type, stage
□ Infer jurisdiction từ company location hoặc hỏi:
  "Company ở đâu? (Vietnam / US Delaware / Singapore / other)"
```

## STAGE: INCORPORATION

```
FILE: .mekong/legal/incorporation-checklist.md

JURISDICTION GUIDE:
  Vietnam    → Công ty TNHH MTV (1 member LLC) or 2+ người
  US startup → Delaware C-Corp (standard for VC, Stripe Atlas = $500)
  SEA/global → Singapore Pte Ltd (tax-friendly, VC-friendly)
  Bootstrap  → Vietnam LLC sufficient if not raising from US VCs

VIETNAM LLC (TNHH 1 Thành Viên) CHECKLIST:
  □ Tên công ty (check availability: dangkykinhdoanh.gov.vn)
  □ Địa chỉ trụ sở (có thể thuê địa chỉ ảo ~500K/mo)
  □ Vốn điều lệ (tối thiểu không bắt buộc, nhưng nên 100-500 triệu)
  □ Ngành nghề kinh doanh (chọn đúng mã ngành)
  □ Hồ sơ đăng ký (CMND/CCCD + các form)
  □ Thời gian: 3-5 ngày làm việc
  □ Chi phí: ~500K-1M (phí nhà nước)
  □ Sau khi có: mở tài khoản ngân hàng doanh nghiệp

DELAWARE C-CORP (cho startup raise VC):
  □ Stripe Atlas: $500 all-in (recommended for solo founders)
  □ Or: Clerky, Firstbase, Doola
  □ EIN: apply free at IRS.gov after incorporation
  □ Registered agent: ~$50/year (included in Stripe Atlas)
  □ 83(b) election: file within 30 days if getting equity
  □ Bank: Mercury, Brex, or SVB (remote-friendly)
  
SINGAPORE PTE LTD:
  □ Nominee director needed if no Singapore resident
  □ Corppass setup for digital filing
  □ ACRA filing: ~SGD 300
  □ Bank: DBS, OCBC, or Aspire (startup-friendly)

UNIVERSAL POST-INCORPORATION:
  □ Founders agreement signed
  □ IP assignment agreement signed by all founders
  □ Vesting schedule: 4-year, 1-year cliff
  □ Cap table created (Carta free tier or spreadsheet)
```

## STAGE: IP PROTECTION

```
FILE: .mekong/legal/ip-checklist.md

CODE + PRODUCT:
  □ All code committed to private repo
  □ .gitignore protects secrets
  □ No personal paths in code (review with /review)
  □ License chosen: MIT (OSS) / Proprietary / Dual license
  □ All contributors signed IP assignment

TRADEMARK:
  □ Search: USPTO.gov (US), IP Vietnam (Vietnam), IPOS (Singapore)
  □ File trademark if: product name unique + revenue > $5K/mo
  □ Cost: ~$250-350 per class (US), ~4 triệu VND (Vietnam)
  □ Priority: file in your primary market first
  □ Timeline: 8-12 months to registration

DOMAIN:
  □ Primary .com registered
  □ Consider: .io, .co, .ai as defensive registrations (~$10-50/yr each)
  □ Privacy protection enabled (hides personal info from WHOIS)

TRADE SECRETS:
  □ All employees/contractors sign NDA before seeing code
  □ All employees/contractors sign IP assignment
  □ Customer data access logged and limited
```

## STAGE: CONTRACTS

**Agent: COO / sonnet / 2 MCU — generates templates, NOT legal advice**

```
TEMPLATE PACK — .mekong/legal/contracts/

1. CUSTOMER TERMS OF SERVICE:
   Generates: ToS appropriate for SaaS
   Includes:
     □ Acceptable use policy
     □ Payment + refund terms
     □ Data ownership (customer owns their data)
     □ Limitation of liability
     □ Dispute resolution
   Generate: /cook "draft ToS for {product_type} SaaS" --agent coo

2. PRIVACY POLICY:
   Required for: any user data collection
   Must include (GDPR + general):
     □ What data you collect
     □ How you use it
     □ Who you share with (LLM providers = important to disclose)
     □ Retention period
     □ User rights (access, delete, export)
     □ Contact for data requests
   Generate: /cook "draft privacy policy for {product}" --agent coo
   
   ⚠️  If you use Claude/Gemini/OpenAI: disclose in privacy policy
       "We use third-party AI providers to process certain content"

3. CONTRACTOR AGREEMENT:
   (see /founder hire --type contractor for brief)
   Template includes:
     □ Scope of work
     □ Payment terms
     □ IP assignment (all work belongs to you)
     □ Confidentiality
     □ Termination clause

4. ADVISOR AGREEMENT:
   Standard: 0.1-0.5% equity, 2-year vest, no cliff
   Template: FAST agreement (standard Silicon Valley)
   Generate: /cook "draft advisor agreement, 0.25% equity, 2yr vest" --agent coo

5. EMPLOYMENT OFFER LETTER (Vietnam):
   Must include:
     □ Job title + description
     □ Salary + bonus structure
     □ Start date
     □ Probation period (typically 60 days)
     □ Reference to company internal policies
     □ NDA + IP assignment attached
```

## STAGE: COMPLIANCE

```
FILE: .mekong/legal/compliance-checklist.md

GDPR (if serving EU users):
  □ Privacy policy updated (see above)
  □ Cookie consent banner implemented
  □ Data processing agreements with sub-processors (AWS, Anthropic, etc.)
  □ Right to be forgotten process documented
  □ DPO designated (or documented why not required)
  □ Breach notification process (72h to authority)

PDPA VIETNAM (Nghị định 13/2023):
  □ Privacy policy in Vietnamese
  □ Consent collection documented
  □ Data localization considered
  □ Breach notification: within 72h

SOC 2 (when enterprise customers ask):
  □ Not needed until enterprise deals require it (~$100K ARR)
  □ Prep: document security policies, access controls, logging

PCI DSS (if storing payment data):
  □ Don't store raw card data (use Stripe/Polar — they handle this)
  □ Compliance inherited from payment processor

GENERAL SECURITY CHECKLIST:
  □ All API keys in env vars, not in code
  □ All secrets in .env not committed to git
  □ Database backups automated
  □ Employee/contractor offboarding process
  □ 2FA on all critical services (GitHub, AWS, billing)
  □ Incident response plan documented
```

## OUTPUT

```
✅ Legal Kit Generated — {company_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 .mekong/legal/
  ✓ incorporation-checklist.md
  ✓ ip-checklist.md
  ✓ contracts/tos-draft.md
  ✓ contracts/privacy-policy-draft.md
  ✓ contracts/contractor-agreement.md
  ✓ compliance-checklist.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 MCU: -3 (balance: {remaining})

⚠️  CRITICAL REMINDER:
  All generated documents are STARTING POINTS only.
  Have a licensed attorney review before using.
  
  Vietnam: Luật sư chi phí ~2-5 triệu/tài liệu
  US: Clerky, Stripe Atlas handle most startup docs
  Singapore: RocketLawyer, Zegal for templates
```
