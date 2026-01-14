---
description: Generate professional quotes using Binh Pháp 13-chapter pricing matrix
agent: money-maker
---

# /quote Command

Generate a professional quote for a client using the 13-chapter pricing framework.

## Usage

```bash
/quote [client-name] [services...]
```

## Examples

```bash
/quote "ABC Corp" "Kế Hoạch" "Mưu Công"
/quote "XYZ Startup" "Thế Trận" --monthly
/quote "DEF Inc" "Speed Sprint" "VC Intelligence" --equity 5%
```

## Workflow

1. **Parse** client name and requested services
2. **Map** services to 13-chapter pricing
3. **Calculate** total quote value
4. **Validate** WIN-WIN-WIN alignment
5. **Generate** formatted proposal document
6. **Output** quote with payment terms

## 13-Chapter Pricing Matrix

| Chapter | Service | Price |
|---------|---------|-------|
| 1️⃣ | Kế Hoạch (Strategy) | $5,000 |
| 2️⃣ | Tác Chiến (Runway) | $3,000 |
| 3️⃣ | Mưu Công (Win-Without-Fighting) | $8,000 |
| 4️⃣ | Hình Thế (Moat Audit) | $5,000 |
| 5️⃣ | Thế Trận (Growth) | $5,000/mo |
| 6️⃣ | Hư Thực (Anti-Dilution) | $10,000 |
| 7️⃣ | Quân Tranh (Speed Sprint) | $15,000 |
| 8️⃣ | Cửu Biến (Pivot) | $5,000 |
| 9️⃣ | Hành Quân (OKR) | $3,000/qtr |
| 🔟 | Địa Hình (Market Entry) | $8,000 |
| 1️⃣1️⃣ | Cửu Địa (Crisis) | $5,000/mo |
| 1️⃣2️⃣ | Hỏa Công (Disruption) | $10,000 |
| 1️⃣3️⃣ | Dụng Gián (VC Intel) | $3,000 |

## Options

| Flag | Description |
|------|-------------|
| `--monthly` | Convert one-time to monthly retainer |
| `--equity [%]` | Add equity component |
| `--discount [%]` | Apply discount (max 20%) |
| `--rush` | 50% premium for expedited work |

## Output Format

```
╔════════════════════════════════════════╗
║  📋 QUOTE #Q-2026-0114                 ║
║  Client: [Client Name]                 ║
╠════════════════════════════════════════╣
║  Services                              ║
║  ────────                              ║
║  • [Chapter] [Service]: $X,XXX         ║
║  • [Chapter] [Service]: $X,XXX         ║
╠════════════════════════════════════════╣
║  Subtotal: $XX,XXX                     ║
║  Discount: -$X,XXX                     ║
║  TOTAL: $XX,XXX                        ║
╠════════════════════════════════════════╣
║  WIN-WIN-WIN: ✅ VALIDATED             ║
║  Payment: Net 15                       ║
╚════════════════════════════════════════╝
```

---

🏯 *"Kiếm tiền dễ như ăn kẹo"*
