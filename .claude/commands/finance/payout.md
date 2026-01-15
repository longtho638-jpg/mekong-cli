---
description: 💸 Payout Command - Rút tiền từ Polar.sh về PayPal/Bank
argument-hint: [:polar|:stripe|:bank] [amount]
---

## Payout Overview

Hướng dẫn rút tiền từ các nền tảng thanh toán.

## ⚠️ Polar.sh → PayPal Flow

Polar.sh **KHÔNG** hỗ trợ PayPal trực tiếp. Luồng rút tiền:

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
