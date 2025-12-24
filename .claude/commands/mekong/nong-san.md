# /nong-san - Agricultural Commodity Analysis

Spawn agent: `market-analyst`

## Purpose

Analyze agricultural commodity prices and market trends. Supports global commodity markets.

## Usage

```
/nong-san
/nong-san "rice ST25"
/nong-san "organic avocados" --market=USA
```

---

## Interactive Mode (5 Questions)

**If `$ARGUMENTS` is empty**, ask the user these 5 questions:

| # | Question (EN) | Câu hỏi (VI) | Example |
|---|---------------|--------------|---------|
| 1 | **What commodity?** | Sản phẩm gì? | "Rice", "Mangoes", "Coffee" |
| 2 | **Which market/region?** | Thị trường? | "Vietnam", "USA", "Global" |
| 3 | **Time period?** | Thời gian? | "This week", "Monthly" |
| 4 | **Buy or sell perspective?** | Mua hay bán? | "Buyer", "Farmer" |
| 5 | **Volume interest?** | Khối lượng? | "1 ton", "Container" |

**After collecting answers** → Generate price report.

---

## Workflow

1. **Identify Commodity**
   - Parse input to identify commodity
   - Map to category (grains, fruits, seafood, livestock)

2. **Data Collection**
   - Query from configured sources
   - Aggregate prices from major markets

3. **Analysis**
   - Compare with last week/month
   - Identify trends and anomalies
   - Short-term forecast

4. **Report Generation**

---

## Output Format

```markdown
## Commodity Report: [Product]

📅 Date: [date]
📍 Market: [Region]
💱 Currency: [USD/VND/etc]

### Current Prices
| Market/Location | Price | Change |
|-----------------|-------|--------|
| [Market 1] | $X | +5% |
| [Market 2] | $X | +3% |

### Price History
| Period | Price | Change |
|--------|-------|--------|
| Today | $X | -- |
| Last week | $X | +X% |
| Last month | $X | +X% |

### Trend Analysis
📈 Trend: [Rising/Falling/Stable]
📊 Forecast: [Next 2 weeks prediction]
⚠️ Alert: [Any warnings]

### Recommendations
- **For Buyers**: [Action]
- **For Sellers**: [Action]
```

---

## Example

```
/nong-san "coffee arabica" --market=global

☕ Coffee Arabica Report - Dec 24, 2024

📍 Global Market
💱 Prices in USD/lb

ICE Futures: $2.85/lb (+8.2%)
Vietnam FOB: $2.45/lb (+5.1%)
Brazil FOB: $2.50/lb (+6.3%)

📈 Trend: Strong upward due to weather concerns
⚠️ Alert: Supply shortage expected Q1 2025

💡 Recommendation:
- Buyers: Lock in contracts now
- Sellers: Hold, prices may rise further
```

---

## Supported Commodities

| Category | Examples |
|----------|----------|
| **Grains** | Rice, Wheat, Corn, Soybeans |
| **Fruits** | Mangoes, Avocados, Durian, Citrus |
| **Seafood** | Shrimp, Pangasius, Tuna, Salmon |
| **Beverages** | Coffee, Tea, Cocoa |
| **Other** | Pepper, Cashews, Rubber |

---

## Best Practices

1. **Multiple sources** - Cross-check prices
2. **Currency aware** - Use local or USD
3. **Seasonality** - Consider harvest cycles
4. **Volume sensitive** - Prices vary by quantity
