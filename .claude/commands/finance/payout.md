---
description: 💸 Payout Command - Rút tiền từ Polar.sh về PayPal/USD
argument-hint: [:wise|:payoneer|:bank] [amount]
---

## 🎯 Polar.sh → PayPal Solution

> **Vấn đề**: Polar.sh KHÔNG hỗ trợ PayPal trực tiếp
> **Giải pháp**: Dùng **WISE** làm bridge!

---

## 🥇 WISE Method (RECOMMENDED)

### Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Polar.sh   │ ──▶│   Stripe    │ ──▶│    WISE     │ ──▶│   PayPal    │
│  Balance    │    │  Connect    │    │  USD Acct   │    │   Balance   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      💰              4-7 days           Instant           Instant
```

### Step-by-Step Setup

#### 1️⃣ Create Wise Business Account

1. Go to https://wise.com/business
2. Sign up (free, no monthly fee)
3. Verify identity (passport/ID)
4. Get **USD balance** enabled

#### 2️⃣ Get Wise USD Bank Details

In Wise Dashboard:
1. Go to **Balances** → **USD**
2. Click **Account details**
3. Copy these:
   - **Routing number** (ACH)
   - **Account number**
   - **Bank name**: Community Federal Savings Bank

#### 3️⃣ Update Stripe Connect

1. Login to Stripe Dashboard
2. Settings → Payouts → Bank Account
3. Add new bank with Wise USD details
4. Verify (Stripe sends 2 micro-deposits)

#### 4️⃣ Request Polar Withdrawal

1. Polar Dashboard → Balance
2. Click Withdraw
3. Funds go: Polar → Stripe → Wise (4-7 days)

#### 5️⃣ Wise → PayPal

1. In Wise: Send → PayPal email
2. Or: Link Wise card to PayPal
3. Instant transfer!

### Fees Breakdown

| Step | Fee |
|------|-----|
| Polar | 5% |
| Stripe → Wise | $0.25 |
| Wise → PayPal | 0.5-1% |
| **Total** | ~6-7% |

**Example**: $1,000 revenue
- Polar fee: $50
- Stripe: $0.25
- Wise: $5
- **Net to PayPal**: ~$945

---

## 🥈 Payoneer Alternative

### Flow

```
Polar → Stripe → Payoneer USD → PayPal/Bank
```

### Setup

1. Create Payoneer account: https://payoneer.com
2. Get **Global Payment Service** → US Account
3. Add to Stripe as payout bank
4. Payoneer → PayPal

### Fees

| Step | Fee |
|------|-----|
| Payoneer receiving | Free |
| Payoneer → PayPal | 1-2% |
| Currency conversion | 1-2% |

---

## 🥉 Mercury/Relay (US Bank)

If you have US LLC/business:

1. Open Mercury or Relay bank account
2. Connect to Stripe directly
3. Transfer to PayPal from Mercury

**Fees**: Lowest (just Polar 5%)

---

## ⚡ Quick Comparison

| Method | Setup Time | Total Fees | Recommended |
|--------|------------|------------|-------------|
| **Wise** | 1-2 days | 6-7% | ✅ Best |
| Payoneer | 2-3 days | 7-9% | OK |
| US Bank | 1-2 weeks | 5-6% | If you have LLC |
| VN Bank | 1 day | 6-8% | Not for you |

---

## 💡 Pro Tips

### 1. Batch Withdrawals
Rút ít lần, số tiền lớn hơn để giảm fixed fees.

### 2. Keep USD
Giữ USD trong Wise, chỉ chuyển PayPal khi cần.

### 3. Wise Card
Dùng Wise Debit Card để chi tiêu trực tiếp USD.

### 4. Multi-Currency
Wise hỗ trợ 50+ currencies - flexible cho travel.

---

## 🚀 Action Plan

```bash
# Today
1. Sign up Wise Business ✅

# Day 1-2  
2. Verify identity ✅
3. Get USD account details ✅

# Day 3
4. Update Stripe with Wise bank ✅
5. Verify micro-deposits ✅

# Ready!
6. Request Polar withdrawal ✅
7. Receive in Wise (4-7 days) ✅
8. Transfer to PayPal (instant) ✅
```

---

## CLI Commands

```bash
# Check Polar balance
/finance "polar balance"

# Request withdrawal
/finance/payout "rút $500 về wise"

# Check Wise balance
/finance "wise balance"

# Send to PayPal
/finance/payout "wise → paypal $200"
```

---

🏯 **Binh Pháp**: "Nước chảy qua khe đá - tiền chảy qua Wise!"

> 🍬 **Anh không ở VN? No problem!** Wise + PayPal = Global Access!


```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Polar.sh      │ ──▶ │  Stripe Connect │ ──▶ │  Bank Account   │
│   Balance       │     │  (Required)     │     │  (VN/US/EU)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  PayPal (Manual)│
                                                │  hoặc Wise      │
                                                └─────────────────┘
```

## Step-by-Step Payout

### 1️⃣ Setup Stripe Connect (One-time)

1. Đăng nhập https://polar.sh/dashboard
2. Settings → Payout → Connect Stripe
3. Nhập thông tin business/individual
4. Liên kết Bank Account

### 2️⃣ Request Withdrawal

1. Dashboard → Balance
2. Click "Withdraw"
3. Nhập số tiền (minimum threshold applies)
4. Confirm → 4-7 ngày làm việc

### 3️⃣ Polar.sh Fees

| Fee Type | Amount |
|----------|--------|
| Polar Fee | 5% |
| Stripe Payout | $2 + 0.25% |
| Cross-border | +1% |
| Currency Conversion | ~2% |

**Ví dụ**: Rút $100 USD
- Polar: $5
- Stripe: $2.25
- Cross-border: $1
- **Net**: ~$91.75

### 4️⃣ Bank → PayPal (Optional)

Nếu cần tiền trong PayPal:
1. Nhận tiền vào Bank Account VN
2. Liên kết Bank với PayPal
3. Top-up PayPal từ Bank
4. Hoặc: Wise → PayPal

## Vietnam Banks Supported

| Bank | Stripe Support |
|------|----------------|
| Vietcombank | ✅ |
| ACB | ✅ |
| Techcombank | ✅ |
| VPBank | ✅ |
| MB Bank | ✅ |

## Alternative: Wise

```
Polar → Stripe → Wise Account → PayPal/Local Bank
```

Wise có phí thấp hơn cho chuyển đổi tiền tệ.

## CLI Commands

```bash
# Check balance
/finance "xem balance"

# Request payout
/finance/payout "rút $500"

# Check payout status
/finance/payout "trạng thái"
```

## Legal Requirements

### Vietnam Tax

| Income Type | Tax Rate |
|-------------|----------|
| Cá nhân kinh doanh | 1.5-5% |
| Doanh nghiệp | 20% CIT |
| Freelancer | 10% PIT |

### Required Documents

- [ ] Đăng ký kinh doanh (nếu > 100M VND/năm)
- [ ] Hóa đơn điện tử (nếu cần)
- [ ] Khai thuế TNCN quý

## Quick Reference

| Platform | Payout Method | Timeline |
|----------|---------------|----------|
| Polar.sh | Stripe → Bank | 4-7 days |
| SePay | Direct Bank | 1-2 days |
| Stripe Direct | Bank | 2-7 days |

---

🏯 **WIN-WIN-WIN**: 
- Anh WIN: Nhận tiền nhanh
- Agency WIN: Revenue tracked
- Customer WIN: Sản phẩm delivered

---

> 🍬 **Tip**: Dùng Wise để tối ưu phí chuyển đổi tiền tệ!
