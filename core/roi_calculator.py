"""
📊 ROI Calculator - Show Clients Their Potential Return
=========================================================

Calculate and visualize ROI for agency services.
Perfect for sales calls and proposals!

Features:
- current client metrics analysis
- Projection of service-based improvements
- Mathematical ROI modeling
- Comparative service analysis
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ServiceType(Enum):
    """Categorization of growth services."""
    SEO = "seo"
    PPC = "ppc"
    SOCIAL = "social"
    CONTENT = "content"
    EMAIL = "email"


@dataclass
class ClientMetrics:
    """Snapshot of a client's current performance data."""
    monthly_traffic: int
    conversion_rate: float  # e.g. 0.02 for 2%
    avg_order_value: float
    current_leads: int = 0
    current_customers: int = 0

    def __post_init__(self):
        if self.monthly_traffic < 0 or self.avg_order_value < 0:
            raise ValueError("Metrics cannot be negative")


@dataclass
class ROIProjection:
    """Derived results of an ROI simulation."""
    service: ServiceType
    investment: float
    current_revenue: float
    projected_revenue: float
    revenue_increase: float
    roi_percentage: float
    payback_months: float


class ROICalculator:
    """
    ROI Calculation System.
    
    Orchestrates the mathematical modeling of marketing improvements to demonstrate potential value.
    """
    
    # Conservative standard improvement factors
    BENCHMARKS = {
        ServiceType.SEO: {"traffic_up": 0.50, "cvr_up": 0.10, "fee": 1500.0},
        ServiceType.PPC: {"traffic_up": 0.80, "cvr_up": 0.15, "fee": 2000.0},
        ServiceType.EMAIL: {"traffic_up": 0.10, "cvr_up": 0.20, "fee": 800.0}
    }
    
    def __init__(self, agency_name: str = "Saigon Digital"):
        self.agency_name = agency_name
        logger.info(f"ROI Calculator initialized for {agency_name}")
    
    def simulate_roi(
        self, 
        metrics: ClientMetrics, 
        service: ServiceType,
        horizon_mo: int = 12
    ) -> ROIProjection:
        """Execute simulation logic for a specific growth service."""
        b = self.BENCHMARKS.get(service, {"traffic_up": 0.3, "cvr_up": 0.05, "fee": 1000.0})
        
        # 1. Base Revenue
        curr_rev = (metrics.monthly_traffic * metrics.conversion_rate) * metrics.avg_order_value
        
        # 2. Projected Growth
        p_traffic = metrics.monthly_traffic * (1 + b["traffic_up"])
        p_cvr = metrics.conversion_rate * (1 + b["cvr_up"])
        p_rev = (p_traffic * p_cvr) * metrics.avg_order_value
        
        # 3. Model ROI
        mo_inc = p_rev - curr_rev
        total_inc = mo_inc * horizon_mo
        total_inv = b["fee"] * horizon_mo
        
        roi = ((total_inc - total_inv) / total_inv) * 100.0 if total_inv > 0 else 0.0
        payback = b["fee"] / mo_inc if mo_inc > 0 else 99.9
        
        logger.info(f"ROI Projection for {service.value}: {roi:.1f}%")
        return ROIProjection(
            service=service, investment=b["fee"], current_revenue=curr_rev,
            projected_revenue=p_rev, revenue_increase=mo_inc,
            roi_percentage=roi, payback_months=payback
        )
    
    def format_report(self, p: ROIProjection) -> str:
        """Render ASCII ROI Projection report."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 ROI PROJECTION - {p.service.value.upper():<28} ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Current Revenue:   ${p.current_revenue:>12,.0f} /mo {' ' * 14}║",
            f"║  Projected Revenue: ${p.projected_revenue:>12,.0f} /mo {' ' * 14}║",
            f"║  Net Growth:        ${p.revenue_increase:>12,.0f} /mo {' ' * 14}║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║  📈 ROI SUMMARY (12 Months):                              ║",
            f"║    ANNUAL RETURN: {p.roi_percentage:>10.1f}% {' ' * 26}║",
            f"║    PAYBACK PERIOD: {p.payback_months:>10.1f} months {' ' * 23}║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Scale!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📊 Initializing ROI System...")
    print("=" * 60)
    
    try:
        calc = ROICalculator("Saigon Digital Hub")
        # Sample
        client_m = ClientMetrics(10000, 0.02, 150.0)
        proj = calc.simulate_roi(client_m, ServiceType.SEO)
        
        print("\n" + calc.format_report(proj))
        
    except Exception as e:
        logger.error(f"ROI Error: {e}")
