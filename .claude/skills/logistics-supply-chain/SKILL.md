---
name: logistics-supply-chain
description: Supply chain management, warehouse ops, last-mile delivery, freight, inventory optimization. Use for logistics platforms, 3PL integration, shipping automation, demand forecasting.
license: MIT
version: 1.0.0
---

# Logistics & Supply Chain Skill

Build and optimize supply chain operations, warehouse management, last-mile delivery, and freight logistics with modern platforms and AI.

## When to Use

- Supply chain visibility and tracking implementation
- Warehouse management system (WMS) integration
- Last-mile delivery API integration
- Inventory optimization and demand forecasting
- Freight rate comparison and booking
- 3PL (third-party logistics) platform integration
- Returns/reverse logistics workflow
- Carbon tracking and sustainable logistics
- Order management and fulfillment automation
- Cold chain monitoring and compliance

## Tool Selection

| Need | Choose |
|------|--------|
| Shipping APIs | EasyPost (USPS/UPS/FedEx unified), Shippo, ShipStation |
| Freight/LTL | Flexport API, Freightos, project44 |
| Supply chain visibility | FourKites, project44, Overhaul |
| WMS | ShipBob (API-first), Deposco, Manhattan Associates |
| Inventory optimization | Inventory Planner, Lokad (probabilistic forecasting) |
| Last-mile delivery | DoorDash Drive API, Uber Direct, Lalamove |
| Route optimization | Google OR-Tools, Routific, OptimoRoute |
| Returns management | Loop Returns, Returnly, Happy Returns |
| EDI/Integration | SPS Commerce, TrueCommerce, Orderful (API-EDI) |
| Carbon tracking | Pledge API, Climatiq, EcoTransIT |

## Supply Chain Architecture

```
Suppliers → Procurement → Warehouse → Fulfillment → Last Mile → Customer
    ↓            ↓            ↓            ↓           ↓          ↓
 Sourcing    PO Mgmt      WMS/Pick    OMS/TMS     Delivery    Returns
 Platform    ERP/API      Pack/Ship   Rate Shop    Tracking    RMA Flow
```

## Shipping Integration Pattern

```python
# EasyPost unified shipping (Python SDK)
import easypost
client = easypost.EasyPostClient(api_key="EASYPOST_API_KEY")

shipment = client.shipment.create(
    from_address={"street1": "...", "city": "...", "state": "...", "zip": "..."},
    to_address={"street1": "...", "city": "...", "state": "...", "zip": "..."},
    parcel={"length": 10, "width": 8, "height": 4, "weight": 16}
)
# Auto rate-shops across USPS, UPS, FedEx
lowest = min(shipment.rates, key=lambda r: float(r.rate))
bought = client.shipment.buy(shipment.id, rate=lowest)
print(f"Label: {bought.postage_label.label_url}")
print(f"Tracking: {bought.tracking_code}")
```

## Inventory Optimization Model

```
Reorder Point = (Avg Daily Demand × Lead Time) + Safety Stock
Safety Stock = Z-score × √(Lead Time × Demand Variance²)
Economic Order Quantity (EOQ) = √(2 × Demand × Order Cost / Holding Cost)
```

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Order Accuracy | Correct orders / Total orders | > 99.5% |
| On-Time Delivery | On-time / Total shipments | > 95% |
| Inventory Turnover | COGS / Avg Inventory | 4-8x/year |
| Fill Rate | Orders filled from stock / Total orders | > 97% |
| Perfect Order Rate | (On-time ∩ Complete ∩ Undamaged ∩ Accurate) / Total | > 90% |
| Warehouse Utilization | Used space / Total space | 80-85% |
| Cost per Order | Total logistics cost / Orders shipped | Minimize |
| Days Sales of Inventory | (Avg Inventory / COGS) × 365 | < 30 days |
| Return Rate | Returns / Total orders | < 5% |
| Carbon per Shipment | Total CO2e / Shipments | Track & reduce |

## Demand Forecasting Architecture

```
Historical Sales Data
  → Time Series (Prophet/ARIMA)
  → Feature Engineering (seasonality, promotions, weather)
  → ML Model (XGBoost, LSTM)
  → Ensemble prediction
  → Safety stock calculation
  → Auto-replenishment trigger
```

## EDI vs API Integration

| Standard | Use Case | Modern Alternative |
|----------|----------|-------------------|
| EDI 850 | Purchase Order | REST API + webhooks |
| EDI 856 | Advance Ship Notice | Real-time tracking API |
| EDI 810 | Invoice | Automated billing API |
| EDI 940 | Warehouse Ship Order | WMS API integration |
| EDI 945 | Warehouse Ship Advice | Webhook notifications |

**Modern approach:** Use Orderful or SPS Commerce to bridge EDI ↔ API for legacy partners.

## References

- EasyPost API: https://docs.easypost.com
- Shippo API: https://docs.goshippo.com
- project44 docs: https://docs.project44.com
- Google OR-Tools: https://developers.google.com/optimization
- Flexport API: https://developers.flexport.com
