# /finance/invoice - Xuất Hóa Đơn Chuyên Nghiệp

Spawn agents: `planner`

## 🎯 Mục đích

Tạo invoice chuyên nghiệp để gửi khách hàng - sẵn sàng thanh toán.

## 💰 Money Flow
```
/finance/invoice → Invoice đẹp → Client pay → $$$
```

## 🚀 Cách sử dụng

```bash
/finance/invoice "Website ABC Company" --amount 50000000 --currency VND
/finance/invoice "Consulting 20 hours" --rate 100 --currency USD
/finance/invoice "Monthly retainer March" --package pro
```

## 📋 Workflow

1. **Thu thập thông tin**
   - Client details
   - Services rendered
   - Payment terms

2. **Tính toán**
   - Subtotal
   - Tax (if applicable)
   - Discounts
   - Total due

3. **Generate invoice**
   - Professional format
   - Payment instructions
   - Terms & conditions

## 📝 Output Format

```markdown
# 🧾 INVOICE

---

## FROM
**[Your Agency Name]**
Address: [Your address]
Email: [your@email.com]
Phone: [+84 xxx xxx xxx]
Tax ID: [if applicable]

---

## TO
**[Client Company Name]**
Attn: [Contact person]
Address: [Client address]
Email: [client@email.com]

---

## INVOICE DETAILS

| Field | Value |
|-------|-------|
| Invoice # | INV-2024-001 |
| Date | [Today] |
| Due Date | [Today + 14 days] |
| Currency | VND / USD |

---

## ITEMS

| # | Description | Qty | Rate | Amount |
|---|-------------|-----|------|--------|
| 1 | [Service 1] | 1 | 10,000,000 | 10,000,000 |
| 2 | [Service 2] | 5 | 2,000,000 | 10,000,000 |
| 3 | [Service 3] | 1 | 5,000,000 | 5,000,000 |

---

## SUMMARY

| | Amount |
|--|--------|
| Subtotal | 25,000,000 VND |
| Discount (10%) | -2,500,000 VND |
| VAT (10%) | 2,250,000 VND |
| **TOTAL DUE** | **24,750,000 VND** |

---

## 💳 PAYMENT METHODS

### Bank Transfer (Preferred)
- Bank: [Bank name]
- Account: [Account number]
- Name: [Account holder]
- Swift: [SWIFT code]

### PayPal
- [your@paypal.com]

### Wise
- [your@wise.com]

---

## 📋 TERMS & CONDITIONS

1. Payment due within 14 days
2. Late payment fee: 2%/month
3. All prices in VND unless specified

---

## 🙏 Thank You!

Thank you for your business. We appreciate your prompt payment.

Questions? Contact us at [support@email.com]
```

## 🎨 Invoice Types

| Type | Use Case | Payment Terms |
|------|----------|---------------|
| **Standard** | One-time project | Net 14 |
| **Recurring** | Monthly retainer | Due on 1st |
| **Milestone** | Large project | Per phase |
| **Proforma** | Upfront payment | Before work |

## 🔗 Kết hợp với

- `/sales/proposal` → Proposal → Invoice flow
- `/finance/expense` → Track costs vs revenue
- `/ops/billing` → Auto-send reminders

---

*AgencyOS v10.0 | Hư Thực Cluster | Finance Suite*
