# Financial Operations Guide - Vietnam Market

## Overview

**Multi-Gateway Strategy for Vietnam Market**

This guide documents the payment infrastructure for receiving international payments in Vietnam, optimized for SaaS and digital product sales.

**Architecture:**
- **Primary Gateway:** PayPal (Production LIVE) - Direct bank withdrawals
- **Backup Gateway:** Polar.sh - Subscription management + USD intermediary accounts
- **Settlement:** Local Vietnam banks (SWIFT-enabled)

**Key Principle:** All USD payments → Vietnam Dong (VND) via regulated banking channels

---

## 1. PayPal (Primary Gateway)

### Configuration

**Mode:** Production LIVE (Sandbox disabled)

**Account Type:** PayPal Business Account

**Withdrawal Method:** Direct to Local Vietnam Bank

### Payout Flow

```
Customer Payment (USD)
    ↓
PayPal Business Account (USD)
    ↓
Withdraw to Bank (PayPal → SWIFT)
    ↓
Vietnam Bank Account (VND)
```

### Currency Conversion

- **Source:** USD (PayPal balance)
- **Destination:** VND (Vietnam bank account)
- **Exchange Rate:** Bank's USD/VND rate (typically VND 23,000-25,000 per USD)
- **Rate Timing:** Applied at withdrawal execution time

### Fees Structure

| Fee Type | Rate | Applied By |
|----------|------|------------|
| PayPal Transaction Fee | 2.9% + $0.30 | PayPal (on incoming payment) |
| PayPal Withdrawal Fee | $0-$5 (varies by amount) | PayPal |
| Bank Conversion Fee | 0.5%-1.5% | Vietnam Bank |
| SWIFT Processing Fee | ~$10-$15 | Vietnam Bank |

**Total Cost Example (100 USD withdrawal):**
- PayPal withdrawal: $2
- Bank conversion: $1 (1%)
- SWIFT fee: $12
- **Net received:** ~VND 2,125,000 (assuming 25,000 VND/USD rate)

### Setup Instructions

1. **PayPal Business Account:**
   - Register at paypal.com/vn
   - Complete business verification (tax ID, business documents)
   - Enable international payments

2. **Link Vietnam Bank:**
   - Bank must support SWIFT transfers (Vietcombank, BIDV, Techcombank recommended)
   - Add bank account in PayPal settings
   - Provide: Account number, SWIFT code, bank branch

3. **Test Withdrawal:**
   - Initiate small withdrawal ($10-$20)
   - Verify arrival in 3-5 business days
   - Check conversion rate accuracy

### Environment Variables

```bash
# .env.production
PAYPAL_MODE=production
PAYPAL_CLIENT_ID=<production-client-id>
PAYPAL_SECRET=<production-secret>
PAYPAL_WEBHOOK_ID=<webhook-id>

# Bank details (for reconciliation reference)
VN_BANK_NAME=Vietcombank
VN_BANK_SWIFT=BFTVVNVX
VN_BANK_ACCOUNT=<account-number>
```

### Withdrawal Schedule

**Recommended Frequency:** Monthly (consolidate fees)

**Process:**
1. Month-end: Review PayPal balance
2. Initiate withdrawal via PayPal dashboard
3. Wait 3-5 business days for bank credit
4. Reconcile VND amount received vs. expected

---

## 2. Polar.sh (Backup/Subscriptions)

### Configuration

**Purpose:**
- Subscription management for SaaS products
- Backup payment gateway if PayPal unavailable
- Automated recurring billing

**Payout Method:** Intermediary USD Account (Payoneer or PingPong Payment)

### Why Intermediary Account?

Polar.sh requires US bank account details (Routing Number + Account Number). Vietnam banks cannot provide these directly. Solution: Virtual USD accounts.

### Supported Intermediaries

#### Option A: Payoneer (Recommended)

**Pros:**
- Established service (15+ years)
- Lower fees (up to 2%)
- Direct transfer to Vietnam banks
- Multi-currency support

**Setup:**
1. Register at payoneer.com
2. Complete KYC verification (passport, business docs)
3. Request US Payment Service
4. Receive: US Routing Number + Account Number
5. Add to Polar Payout Settings

**Fees:**
- Receiving from Polar: 0%
- Transfer to VN bank: 2% or $3 (whichever lower)
- Currency conversion: 2% above mid-market rate

#### Option B: PingPong Payment

**Pros:**
- Lower currency conversion fees (~0.5%)
- Fast VN bank transfers (1-2 days)
- Designed for e-commerce

**Setup:**
1. Register at pingpongx.com
2. Complete business verification
3. Activate Global Account (US)
4. Get virtual US bank details

**Fees:**
- Receiving: 0%
- Withdrawal to VN: 0.5%-1%
- Better rates for >$1,000 transfers

### Payout Flow

```
Customer Subscription Payment (USD)
    ↓
Polar.sh Balance (USD)
    ↓
Payout to Payoneer/PingPong US Account (USD)
    ↓
Transfer to Vietnam Bank (USD → VND)
    ↓
Vietnam Bank Account (VND)
```

### Polar Configuration

**Dashboard:** polar.sh/dashboard/finance

1. **Add Payout Account:**
   - Account Type: US Bank
   - Routing Number: [from Payoneer/PingPong]
   - Account Number: [from Payoneer/PingPong]
   - Account Holder: [Business Name]

2. **Payout Schedule:**
   - Frequency: Monthly (default)
   - Minimum: $100 (configurable)
   - Auto-payout: Enable for recurring revenue

3. **Webhook Setup:**
   - Endpoint: `https://api.yourdomain.com/webhooks/polar`
   - Events: `subscription.created`, `subscription.canceled`, `payment.succeeded`

### Environment Variables

```bash
# .env.production
POLAR_ACCESS_TOKEN=<access-token>
POLAR_TENANT_ID=<tenant-id>
POLAR_WEBHOOK_SECRET=<webhook-secret>

# Intermediary account (for reference)
PAYONEER_ACCOUNT_ID=<account-id>
PINGPONG_ACCOUNT_ID=<account-id>
```

---

## 3. Troubleshooting

### Issue 1: Wise Cannot Provide Account Number

**Symptom:** Wise (formerly TransferWise) no longer offers US account details for Vietnam residents.

**Solution:**
1. **Immediate:** Switch to PingPong Payment (fastest setup, ~2-3 days)
2. **Alternative:** Use Payoneer (more established, ~5-7 days setup)
3. **Verification:** Ensure account type supports "Receiving from US companies"

**Steps:**
```bash
# 1. Close Wise integration attempt
# 2. Register PingPong
curl -X POST https://pingpongx.com/api/register \
  -d '{"business_type": "individual", "country": "VN"}'

# 3. Update Polar payout settings with new account details
```

### Issue 2: PayPal Withdrawal Blocked

**Symptom:** PayPal flags withdrawal as "Needs Review" or "Blocked for Compliance."

**Root Causes:**
- First-time large withdrawal (>$500)
- Unverified business documents
- Suspicious transaction patterns

**Solution:**
1. **Contact PayPal Support:**
   - Phone: +84-28-3520-2947 (Vietnam)
   - Email: service@paypal.com
   - Reference: Account ID, withdrawal transaction ID

2. **Use Payoneer Intermediary:**
   - Transfer from PayPal to Payoneer USD account
   - Then Payoneer → Vietnam bank
   - Adds 1-2 days but bypasses direct SWIFT issues

3. **Document Verification:**
   - Upload business registration certificate
   - Provide proof of service delivery (invoices, customer contracts)

### Issue 3: Polar Payout Fails

**Symptom:** Payout status shows "Failed" or "Returned."

**Root Causes:**
- Incorrect routing/account number
- Account not enabled for ACH transfers
- Payoneer/PingPong account suspended

**Solution:**
1. **Verify Account Details:**
   ```bash
   # Check Payoneer routing number
   echo "Routing: 084106768"  # Payoneer's US routing

   # Check account number format
   echo "Account: 12-digit number (no spaces/hyphens)"
   ```

2. **Contact Polar Support:**
   - Email: support@polar.sh
   - Include: Tenant ID, payout ID, error screenshot
   - Response time: 24-48 hours

3. **Re-verify Intermediary Account:**
   - Log into Payoneer/PingPong
   - Confirm account status: Active
   - Check receiving limits not exceeded

### Issue 4: Currency Conversion Rate Discrepancy

**Symptom:** VND received is 5-10% less than expected.

**Root Causes:**
- Hidden conversion fees
- Poor exchange rate timing
- Multiple intermediaries

**Solution:**
1. **Document Expected Rate:**
   ```bash
   # Get market rate at withdrawal time
   curl https://api.exchangerate-api.com/v4/latest/USD
   # Expected: 25,000 VND/USD
   ```

2. **Calculate Fee Breakdown:**
   - PayPal withdrawal: Known fixed fee
   - Bank conversion: Request detailed fee statement
   - Compare with historical rates

3. **Optimize Timing:**
   - Withdraw when USD/VND rate is favorable
   - Avoid month-end (high bank volume = worse rates)

---

## 4. Monthly Reconciliation Checklist

### Week 1: Transaction Review

**Tasks:**
- [ ] Export PayPal transaction history (CSV)
- [ ] Export Polar payout history (API or Dashboard)
- [ ] Cross-reference with bank statements (VND received)

**Tools:**
```bash
# Export PayPal transactions
# Via Dashboard: Activity → Statements → Download CSV

# Export Polar via API
curl -X GET "https://api.polar.sh/v1/payouts" \
  -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  > polar_payouts.json
```

### Week 2: Fee Calculation

**Spreadsheet Template:**

| Date | Gateway | USD Sent | Fees Paid | VND Received | Effective Rate |
|------|---------|----------|-----------|--------------|----------------|
| 2025-01-15 | PayPal | 1,000 | 17 (PayPal) + 25 (Bank) | 24,270,000 | 24,270 |
| 2025-01-20 | Polar | 500 | 10 (Payoneer) | 12,225,000 | 24,450 |

**Formulas:**
```excel
Effective Rate = VND Received / (USD Sent - Fees Paid)
Fee Percentage = (Fees Paid / USD Sent) * 100
```

### Week 3: MRR Tracking

**Metrics to Update:**

1. **Monthly Recurring Revenue (MRR):**
   - Sum all active Polar subscriptions
   - Convert to VND using month-end rate
   - Compare vs. previous month

2. **One-Time Revenue:**
   - PayPal single payments
   - Add-on sales

3. **Churn Analysis:**
   - Canceled subscriptions (Polar webhook data)
   - Refunds issued

**Dashboard Update:**
```bash
# Update financial dashboard
# File: docs/FINANCIAL_DASHBOARD.md

Total Revenue (USD): $X,XXX
Total Revenue (VND): XXX,XXX,XXX VND
MRR Growth: +X%
Churn Rate: X%
```

### Week 4: Compliance & Reporting

**Tax Documentation:**
- [ ] Update revenue records for Vietnam tax filing
- [ ] Categorize income: Service export (0% VAT in Vietnam)
- [ ] Prepare receipts for fee deductions

**Emergency Fund Review:**
- [ ] Maintain 3-month operational buffer in VND
- [ ] Transfer excess USD to VND if favorable rate

---

## 5. Environment Variables Reference

### Production (.env.production)

```bash
# PayPal Production
PAYPAL_MODE=production
PAYPAL_CLIENT_ID=<client-id>
PAYPAL_SECRET=<secret>
PAYPAL_WEBHOOK_ID=<webhook-id>

# Polar.sh
POLAR_ACCESS_TOKEN=<access-token>
POLAR_TENANT_ID=<tenant-id>
POLAR_WEBHOOK_SECRET=<webhook-secret>

# Bank Details (Reference Only - DO NOT COMMIT)
VN_BANK_NAME=Vietcombank
VN_BANK_SWIFT=BFTVVNVX
VN_BANK_ACCOUNT=<account-number>
VN_BANK_BENEFICIARY=<business-name>

# Intermediary Accounts
PAYONEER_ACCOUNT_ID=<account-id>
PINGPONG_ACCOUNT_ID=<account-id>

# Exchange Rate API (for reconciliation)
EXCHANGE_RATE_API_KEY=<api-key>
```

### Security Notes

- **Never commit .env files to Git**
- Store credentials in 1Password/Bitwarden
- Rotate API keys every 90 days
- Use separate keys for staging/production

---

## 6. Emergency Contacts

### PayPal Vietnam Support

- **Phone:** +84-28-3520-2947
- **Hours:** Mon-Fri 9:00-18:00 ICT
- **Email:** service@paypal.com
- **Escalation:** Request case number for follow-up

### Polar.sh Support

- **Email:** support@polar.sh
- **Discord:** discord.gg/polar (community support)
- **Documentation:** docs.polar.sh
- **SLA:** 24-48 hours response time

### Payoneer Vietnam

- **Phone:** +1-646-518-6970 (International)
- **Email:** vietnam@payoneer.com
- **Hours:** 24/7 email support
- **Dashboard:** payoneer.com/support

### PingPong Payment

- **Phone:** +86-400-820-8252 (China HQ)
- **Email:** service@pingpongx.com
- **Vietnam Rep:** support-vn@pingpongx.com
- **Live Chat:** Available in dashboard

### Vietnam Banks (SWIFT Support)

**Vietcombank:**
- **Hotline:** 1900-54-54-13
- **International Dept:** +84-24-3942-6629
- **SWIFT:** BFTVVNVX

**BIDV:**
- **Hotline:** 1900-9247
- **SWIFT:** BIDVVNVX

**Techcombank:**
- **Hotline:** 1800-58-88-22
- **SWIFT:** VTCBVNVX

---

## 8. Vietnam Tax Strategy 2026 - Legal Escalation Ladder

### Overview

Vietnam tax obligations scale based on annual revenue thresholds. This three-phase escalation ladder ensures compliance while minimizing administrative burden and tax liability.

**Key Principle:** Delay formal business registration until revenue justifies the compliance overhead.

---

### Phase 1: GUERILLA (<500M VND/year)

**Legal Status:** Individual Freelancer (No registration required)

**Tax Obligation:** 0% (Under threshold - exempt from registration)

**Revenue Range:** 0 - 499,999,999 VND/year (~$0 - $20,000 USD/year)

**Compliance Requirements:**
- ✅ No business registration needed
- ✅ No tax filing required
- ✅ No VAT obligations
- ✅ No accounting records required (recommended for tracking)

**Operational Rules:**
1. **Income Tracking:**
   - Maintain private revenue records (not submitted to authorities)
   - Use AgencyOS revenue module for internal tracking
   - Monitor annual total to avoid exceeding 500M threshold

2. **Invoicing:**
   - Issue invoices as "Individual Service Provider"
   - Include service type: "Software Subscription / Exported Software Service"
   - Keep copies for transition to Phase 2

3. **Banking:**
   - Receive payments to personal bank account
   - PayPal → Vietnam bank (SWIFT)
   - Polar → Payoneer/PingPong → Vietnam bank

4. **Alert System:**
   - **Soft Cap (450M VND):** Dashboard alert triggers
   - **Alert Message:** "Sắp đạt ngưỡng chịu thuế 500M. Chuẩn bị hồ sơ đăng ký kinh doanh."
   - **Action:** Begin preparing registration documents (see Phase 2)

**Exit Criteria:**
- Annual revenue reaches 450M VND → Prepare for Phase 2
- Annual revenue reaches 500M VND → **MUST** register within 30 days

---

### Phase 2: PROFESSIONAL (500M - 2B VND/year)

**Legal Status:** Registered Individual Business (Hộ kinh doanh cá thể)

**Tax Obligation:** 2% TNCN (Personal Income Tax) only

**Revenue Range:** 500,000,000 - 1,999,999,999 VND/year (~$20,000 - $80,000 USD/year)

**VAT Treatment:** 0% for exported software services

**Compliance Requirements:**
- ✅ Business registration certificate
- ✅ Quarterly tax filing (TNCN 2%)
- ✅ Invoice issuance (red invoice - hóa đơn đỏ)
- ✅ Basic accounting records

**Registration Process:**

1. **Documents Required:**
   - National ID (CCCD/CMND)
   - Household registration book (Sổ hộ khẩu)
   - Business location proof (lease/ownership)
   - Business activity description: "Software Development Services"

2. **Registration Steps:**
   - Submit to District Business Registration Office (Phòng Đăng ký kinh doanh)
   - Fee: ~300,000 VND (~$12 USD)
   - Processing time: 3-5 business days
   - Receive: Business Registration Certificate (Giấy chứng nhận đăng ký kinh doanh)

3. **Tax Code Activation:**
   - Register with Tax Department (Cục Thuế) within 10 days
   - Receive Tax Identification Number (Mã số thuế)
   - Activate e-filing account (https://thuedientu.gdt.gov.vn)

4. **Invoice System Setup:**
   - Option A: Order red invoices from Tax Department (traditional)
   - Option B: Register for e-invoices (Hóa đơn điện tử) - recommended
   - System: VNPT-Invoice, Viettel-Invoice, or similar

**Tax Calculation:**

**Formula:** `Tax = Annual Revenue × 2%`

**Example:**
- Revenue: 800M VND/year
- Tax: 800M × 2% = 16M VND (~$640 USD/year)
- Quarterly payment: 4M VND (~$160 USD/quarter)

**VAT Exemption (Critical):**
- Exported software services qualify for 0% VAT
- **Evidence required:**
  - Customer location outside Vietnam (IP logs, billing address)
  - Service delivery online (no physical goods)
  - Invoice marked: "Service Type: Software Subscription / Exported Software Service"
- **Submit to Tax Authority:** Annual export service declaration (Tờ khai dịch vụ xuất khẩu)

**Quarterly Filing Schedule:**

| Quarter | Period | Filing Deadline | Payment Deadline |
|---------|--------|-----------------|------------------|
| Q1 | Jan-Mar | April 30 | April 30 |
| Q2 | Apr-Jun | July 30 | July 30 |
| Q3 | Jul-Sep | October 30 | October 30 |
| Q4 | Oct-Dec | January 30 (next year) | January 30 (next year) |

**Exit Criteria:**
- Annual revenue reaches 1.8B VND → Prepare for Phase 3
- Annual revenue reaches 2B VND → **SHOULD** upgrade to TNHH structure

---

### Phase 3: TYCOON (>2B VND/year)

**Legal Status:** Limited Liability Company - 1 Member (TNHH 1 thành viên)

**Tax Obligation:** Corporate Income Tax (CIT) with technology incentives

**Revenue Range:** 2,000,000,000+ VND/year (~$80,000+ USD/year)

**VAT Treatment:** 0% for exported software services (same as Phase 2)

**Compliance Requirements:**
- ✅ Company registration (Investment Planning Department)
- ✅ Company seal (Con dấu)
- ✅ Legal representative
- ✅ Annual financial audit (if revenue >20B VND)
- ✅ Monthly/quarterly CIT filing
- ✅ Full accounting system (Vietnamese Accounting Standards)

**Registration Process:**

1. **Documents Required:**
   - Company charter (Điều lệ công ty)
   - Shareholder/member list (1 member = owner)
   - Legal representative ID
   - Business address proof (lease minimum 1 year)
   - Industry: "Software Development and Technology Services"

2. **Registration Steps:**
   - Submit to District Investment Planning Department
   - Fee: ~500,000 - 1,000,000 VND (~$20-$40 USD)
   - Processing time: 5-7 business days
   - Receive: Enterprise Registration Certificate (Giấy chứng nhận đăng ký doanh nghiệp)

3. **Company Seal:**
   - Order from authorized seal maker
   - Fee: ~300,000 - 500,000 VND (~$12-$20 USD)
   - Required for all official documents

4. **Bank Account:**
   - Open corporate bank account (Vietcombank, BIDV, Techcombank)
   - Documents: Enterprise certificate, company seal, legal rep ID
   - Minimum deposit: 0 VND (no minimum for TNHH 1 member)

**Tax Incentives for Technology/AI Companies:**

**Standard CIT Rate:** 20%

**Incentives Available:**
1. **Technology Enterprise Recognition:**
   - Criteria: >70% revenue from software/technology services
   - Benefit: 10% CIT rate (reduced from 20%)
   - Duration: First 15 years

2. **New Technology Investment:**
   - Criteria: Invest in AI, cloud, or high-tech R\u0026D
   - Benefit: 10% CIT + 4-year tax holiday (0% tax years 1-4, 50% reduction years 5-9)
   - Application: Ministry of Science \u0026 Technology approval

3. **Export Service Priority:**
   - Criteria: >70% revenue from export (foreign customers)
   - Benefit: Additional 50% CIT reduction (effective 5% rate)
   - Documentation: Export service contracts, foreign payment receipts

**Effective Tax Rate Scenarios:**

| Scenario | Base CIT | Incentive Applied | Effective Rate |
|----------|----------|-------------------|----------------|
| Standard TNHH | 20% | None | 20% |
| Tech Enterprise | 20% | Tech recognition (10%) | 10% |
| Tech + Export | 20% | Tech (10%) + Export (50% off 10%) | 5% |
| New Tech Investment (Years 1-4) | 20% | Tax holiday | 0% |
| New Tech Investment (Years 5-9) | 20% | Tech (10%) + 50% reduction | 5% |

**Example Calculation (Tech + Export):**
- Revenue: 5B VND/year (~$200,000 USD)
- Expenses: 2B VND
- Taxable profit: 3B VND
- Tax rate: 5% (Tech + Export incentives)
- Tax payable: 3B × 5% = 150M VND (~$6,000 USD/year)
- Effective tax on revenue: 3% (150M / 5B)

**Monthly/Quarterly Filing:**
- Provisional CIT: Quarterly (estimate based on projected profit)
- Final CIT: Annual (finalize within 90 days of year-end)
- VAT: Monthly (0% declaration for export services)

**Exit Criteria:**
- N/A - TNHH structure scales indefinitely
- Optional: Convert to Joint Stock Company (Công ty cổ phần) if raising investment

---

### Transition Management

**450M Alert (Soft Cap):**
1. Dashboard displays: "Sắp đạt ngưỡng chịu thuế 500M. Chuẩn bị hồ sơ đăng ký kinh doanh."
2. Begin gathering Phase 2 registration documents
3. Estimate time to 500M threshold (rate of growth)
4. Plan 30-day registration window

**500M Threshold (Hard Cap):**
1. **IMMEDIATE ACTION REQUIRED:** Register within 30 days
2. Consequences of non-registration:
   - Penalties: 20M - 50M VND fine
   - Back taxes + interest (10%/year)
   - Potential business suspension
3. Transition checklist:
   - [ ] Submit registration documents
   - [ ] Activate tax code
   - [ ] Set up invoice system
   - [ ] File first quarterly return (prorated)

**2B Threshold (Phase 3 Entry):**
1. **Optional but recommended:**
   - Better legal protection (limited liability)
   - Professional corporate structure
   - Access to CIT incentives (5% effective rate)
2. Transition timeline: 2-3 months
3. Cost: ~10M - 20M VND setup + annual accounting fees

---

### Revenue Monitoring (AgencyOS Integration)

**Dashboard Alerts:**

| Annual Revenue | Alert Level | Message | Action |
|----------------|-------------|---------|--------|
| 0 - 400M VND | 🟢 Safe | "Phase 1: Guerilla - No tax obligations" | Continue operations |
| 400M - 449M VND | 🟡 Monitor | "Phase 1: Approaching soft cap" | Track monthly growth |
| 450M - 499M VND | 🟠 Warning | "Sắp đạt ngưỡng chịu thuế 500M. Chuẩn bị hồ sơ đăng ký kinh doanh." | Prepare Phase 2 docs |
| 500M+ VND | 🔴 Action Required | "ĐĂNG KÝ KINH DOANH BẮT BUỘC trong 30 ngày" | Register immediately |
| 1.8B - 2B VND | 🟣 Optimize | "Consider TNHH structure for tax incentives" | Evaluate Phase 3 |
| 2B+ VND | 💎 Scale | "TNHH recommended - 5% effective tax rate available" | Upgrade structure |

**Implementation (cc revenue module):**
- File: `backend/core/config/payment_config.py`
- Constants: `REVENUE_THRESHOLD_SOFT_CAP = 450_000_000`, `REVENUE_THRESHOLD_HARD_CAP = 500_000_000`
- Logic: Check annual revenue total against thresholds after each transaction
- Alert trigger: Display on dashboard + email notification (if configured)

---

### Compliance Checklist by Phase

**Phase 1 (GUERILLA):**
- [ ] Track revenue privately (do not exceed 500M/year)
- [ ] Issue invoices with service type field
- [ ] Maintain payment receipts (PayPal, Polar, bank statements)
- [ ] Monitor annual total (dashboard alert at 450M)

**Phase 2 (PROFESSIONAL):**
- [ ] Business registration certificate obtained
- [ ] Tax code activated
- [ ] E-invoice system configured
- [ ] Quarterly tax filing schedule (calendar reminders)
- [ ] Annual export service declaration submitted
- [ ] Keep 5 years of records (invoices, bank statements, tax receipts)

**Phase 3 (TYCOON):**
- [ ] TNHH registration completed
- [ ] Corporate bank account opened
- [ ] Company seal obtained
- [ ] Technology enterprise recognition applied (if eligible)
- [ ] Export service priority applied (if >70% foreign revenue)
- [ ] Monthly/quarterly CIT filing (provisional)
- [ ] Annual financial audit (if revenue >20B VND)
- [ ] Annual CIT finalization (within 90 days of year-end)

---

### References

**Legal Framework:**
- Law on Enterprises 2020 (Luật Doanh nghiệp 2020)
- Law on Tax Administration 2019 (Luật Quản lý thuế 2019)
- Decree 126/2020/NĐ-CP (Individual Business Registration)
- Circular 80/2021/TT-BTC (CIT incentives for technology)

**Tax Authority:**
- General Department of Taxation: https://gdt.gov.vn
- E-filing portal: https://thuedientu.gdt.gov.vn
- Hotline: 1800-8000 (toll-free)

**Consulting Resources:**
- KPMG Vietnam - Technology Tax Guide
- PwC Vietnam - Startup Taxation Handbook
- EY Vietnam - Digital Business Compliance

---

*End of Legal Escalation Ladder - Vietnam Tax Strategy 2026*

---

## 7. Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-25 | 1.0 | Initial guide created | System |
| 2025-01-25 | 1.1 | Added Vietnam Tax Strategy 2026 - Legal Escalation Ladder | System |

**Next Review Date:** 2025-04-25 (Quarterly update)

---

## Appendix A: Regulatory Compliance (Vietnam)

### Foreign Currency Regulations

**State Bank of Vietnam (SBV) Rules:**
- Foreign companies can pay Vietnam individuals/businesses in USD
- Recipients must convert USD → VND within regulated timeframes
- Banks handle conversion (no individual FX trading required)

**Tax Implications:**
- Service export: 0% VAT (if customer is overseas)
- Corporate income tax: 20% on net profit
- Declare all foreign income in annual tax filing

**Documentation Required:**
- Contracts with foreign clients (prove service export)
- Payment receipts (PayPal/Polar transaction history)
- Bank conversion statements

### Anti-Money Laundering (AML)

**Thresholds:**
- Transactions >$10,000 USD: Require source of funds declaration
- Annual income >$50,000 USD: Enhanced scrutiny

**Best Practices:**
- Maintain detailed customer invoices
- Keep records for 5 years (Vietnam audit requirement)
- Report large deposits to bank proactively

---

## Appendix B: Fee Optimization Strategies

### 1. Consolidate Withdrawals

**Problem:** Multiple small withdrawals = high fixed fees

**Solution:**
- Wait until balance >$1,000 before withdrawing
- Monthly batch vs. weekly small transfers

**Savings Example:**
- 4x $250 withdrawals = 4x $15 SWIFT fee = $60
- 1x $1,000 withdrawal = 1x $15 SWIFT fee = $60 savings

### 2. Negotiate Bank Rates

**Eligible:** Businesses with >$5,000/month volume

**Process:**
1. Contact bank relationship manager
2. Request preferential USD/VND conversion rate
3. Commit to minimum monthly volume

**Potential Discount:** 0.3-0.5% better exchange rate

### 3. Dual-Gateway Load Balancing

**Strategy:** Route different customer types to different gateways

**Example:**
- PayPal: One-time purchases, small amounts (<$100)
- Polar: Subscriptions, recurring revenue (>$10/month)

**Benefit:** Optimize for PayPal's transaction fee vs. Polar's lower payout fees

---

*End of Financial Operations Guide*
