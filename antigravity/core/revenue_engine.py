"""
💰 RevenueEngine - Financial Performance & Forecasting
======================================================

The operational heart of the Agency OS financial system. Tracks invoices,
calculates MRR/ARR, and monitors progress toward the $1M 2026 milestone.

Key Performance Indicators:
- 💵 MRR: Monthly Recurring Revenue.
- 📅 ARR: Annualized Recurring Revenue.
- 📉 Churn Impact: Loss of recurring revenue.
- 🚀 Rule of 40: Growth + Profitability index.

Binh Pháp: 💂 Tướng (Leadership) - Managing the numbers that drive the march.

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.revenue package.
"""

from antigravity.core.revenue import RevenueEngine
from antigravity.core.config import Currency

__all__ = ["RevenueEngine", "Currency"]
