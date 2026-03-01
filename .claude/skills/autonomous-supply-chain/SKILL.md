# Autonomous Supply Chain — AI-Driven Optimization

AI-powered supply chain skill covering demand forecasting, inventory optimization, supplier scoring, logistics routing, and autonomous reorder workflows.

## When to Use
- Building demand forecasting models (seasonal, trend, promotional lift)
- Automating inventory replenishment with min/max or ML-driven reorder points
- Scoring and tiering suppliers by reliability, cost, and lead time
- Optimizing last-mile delivery routing and warehouse slotting

## Key Concepts
- **Demand Forecasting**: ARIMA, Prophet, LightGBM with lag features; accuracy via MAPE/WMAPE
- **Inventory Policy**: EOQ (Economic Order Quantity), safety stock = Z × σ_LT × √LT, ROP = μ_demand × LT + safety stock
- **Supplier Scorecard**: On-time delivery rate, defect rate (PPM), lead time variance, pricing competitiveness, risk index
- **Autonomous Reorder**: Event-driven triggers (ROP breach → PO generation → supplier API → ETA tracking)
- **Network Optimization**: Multi-echelon inventory, DC placement (p-median problem), vehicle routing (VRP/TSP solvers)
- **Digital Twin**: Simulate supply chain disruptions (port delays, demand shocks) before they occur

## Implementation Patterns

```python
# Safety stock and reorder point calculator
import numpy as np

def reorder_point(avg_daily_demand, lead_time_days, demand_std, lead_time_std, service_level_z=1.645):
    # Safety stock covers demand variability during lead time
    safety_stock = service_level_z * np.sqrt(
        lead_time_days * demand_std**2 + avg_daily_demand**2 * lead_time_std**2
    )
    rop = avg_daily_demand * lead_time_days + safety_stock
    return round(rop), round(safety_stock)

def economic_order_quantity(annual_demand, order_cost, holding_cost_per_unit):
    return round(np.sqrt((2 * annual_demand * order_cost) / holding_cost_per_unit))
```

```python
# Supplier scoring model
WEIGHTS = {"on_time_rate": 0.35, "defect_ppm": 0.25, "lead_time_variance": 0.20, "price_score": 0.20}

def score_supplier(metrics: dict) -> float:
    normalized = {
        "on_time_rate":       metrics["on_time_rate"],                    # 0-1, higher = better
        "defect_ppm":         1 - min(metrics["defect_ppm"] / 1000, 1),  # invert
        "lead_time_variance": 1 - min(metrics["lead_time_cv"], 1),       # CV = std/mean
        "price_score":        metrics["price_competitiveness"],           # 0-1 vs market
    }
    return sum(normalized[k] * WEIGHTS[k] for k in WEIGHTS)
```

```yaml
# Autonomous reorder workflow (Temporal.io)
workflow: auto_reorder
triggers:
  - event: inventory.rop_breached
    condition: current_stock <= reorder_point
steps:
  - action: select_supplier       # highest score + available capacity
  - action: generate_po           # draft PO with EOQ quantity
  - action: send_to_supplier_api  # EDI 850 or REST API
  - action: track_eta             # poll ASN / carrier API
  - action: update_inventory      # on GRN confirmation
sla_hours: 4                      # escalate if PO not confirmed
```

## References
- OR-Tools VRP Solver: https://developers.google.com/optimization/routing
- Facebook Prophet Forecasting: https://facebook.github.io/prophet/
- ASCM Supply Chain Standards: https://www.ascm.org/
