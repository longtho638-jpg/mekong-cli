"""
📊 ROI Calculator - Show Clients Their Potential Return
=========================================================

Calculate and visualize ROI for agency services.
Perfect for sales calls and proposals!

Features:
- Input current metrics
- Project improvements
- Calculate ROI over time
- Visual charts
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum


class ServiceType(Enum):
    """Service types with expected improvements."""
    SEO = "seo"
    PPC = "ppc"
    SOCIAL = "social"
    CONTENT = "content"
    EMAIL = "email"


@dataclass
class ClientMetrics:
    """Current client metrics."""
    monthly_traffic: int
    conversion_rate: float  # As decimal (0.02 = 2%)
    avg_order_value: float
    current_leads: int
    current_customers: int


@dataclass
class ROIProjection:
    """ROI projection results."""
    service: ServiceType
    investment: float
    current_revenue: float
    projected_revenue: float
    revenue_increase: float
    roi_percentage: float
    payback_months: float


class ROICalculator:
    """
    ROI Calculator.
    
    Show clients their potential return on investment.
    """
    
    # Expected improvements by service (conservative estimates)
    IMPROVEMENTS = {
        ServiceType.SEO: {
            "traffic_increase": 0.50,      # +50% traffic
            "conversion_boost": 0.10,       # +10% conversion
            "timeline_months": 6
        },
        ServiceType.PPC: {
            "traffic_increase": 0.80,       # +80% traffic
            "conversion_boost": 0.15,       # +15% conversion
            "timeline_months": 2
        },
        ServiceType.SOCIAL: {
            "traffic_increase": 0.30,       # +30% traffic
            "conversion_boost": 0.05,       # +5% conversion
            "timeline_months": 3
        },
        ServiceType.CONTENT: {
            "traffic_increase": 0.40,       # +40% traffic
            "conversion_boost": 0.08,       # +8% conversion
            "timeline_months": 4
        },
        ServiceType.EMAIL: {
            "traffic_increase": 0.10,       # +10% traffic (re-engagement)
            "conversion_boost": 0.20,       # +20% conversion
            "timeline_months": 1
        }
    }
    
    # Service pricing
    PRICING = {
        ServiceType.SEO: 1500,
        ServiceType.PPC: 2000,
        ServiceType.SOCIAL: 1000,
        ServiceType.CONTENT: 1200,
        ServiceType.EMAIL: 800
    }
    
    def calculate_current_revenue(self, metrics: ClientMetrics) -> float:
        """Calculate current monthly revenue."""
        conversions = metrics.monthly_traffic * metrics.conversion_rate
        return conversions * metrics.avg_order_value
    
    def project_roi(
        self, 
        metrics: ClientMetrics, 
        service: ServiceType,
        months: int = 12
    ) -> ROIProjection:
        """Project ROI for a service."""
        improvements = self.IMPROVEMENTS[service]
        monthly_investment = self.PRICING[service]
        
        # Current state
        current_revenue = self.calculate_current_revenue(metrics)
        
        # Projected improvements
        new_traffic = metrics.monthly_traffic * (1 + improvements["traffic_increase"])
        new_conversion = metrics.conversion_rate * (1 + improvements["conversion_boost"])
        
        # Projected revenue
        new_conversions = new_traffic * new_conversion
        projected_revenue = new_conversions * metrics.avg_order_value
        
        # ROI calculation
        revenue_increase = projected_revenue - current_revenue
        total_investment = monthly_investment * months
        total_increase = revenue_increase * months
        
        roi_percentage = ((total_increase - total_investment) / total_investment) * 100
        
        # Payback period
        if revenue_increase > 0:
            payback_months = monthly_investment / revenue_increase
        else:
            payback_months = float('inf')
        
        return ROIProjection(
            service=service,
            investment=monthly_investment,
            current_revenue=current_revenue,
            projected_revenue=projected_revenue,
            revenue_increase=revenue_increase,
            roi_percentage=roi_percentage,
            payback_months=payback_months
        )
    
    def format_roi_report(self, projection: ROIProjection) -> str:
        """Format ROI as ASCII report."""
        service_name = projection.service.value.upper()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 ROI PROJECTION: {service_name:<35}    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  CURRENT STATE                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    Monthly Revenue: ${projection.current_revenue:>12,.0f}                  ║",
            "║                                                           ║",
            "║  PROJECTED STATE                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    Monthly Revenue: ${projection.projected_revenue:>12,.0f}                  ║",
            f"║    Monthly Increase: ${projection.revenue_increase:>11,.0f}                  ║",
            "║                                                           ║",
            "║  INVESTMENT                                               ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    Monthly Fee: ${projection.investment:>15,.0f}                  ║",
            f"║    12-Month Total: ${projection.investment * 12:>12,.0f}                  ║",
            "║                                                           ║",
            "║  📈 ROI SUMMARY                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        # ROI bar
        roi = min(projection.roi_percentage, 1000)  # Cap at 1000%
        bar_length = int(40 * (roi / 500)) if roi > 0 else 0
        bar = "█" * bar_length + "░" * (40 - bar_length)
        
        lines.extend([
            f"║    ROI: {projection.roi_percentage:>6.0f}%                                      ║",
            f"║    [{bar}]  ║",
            f"║                                                           ║",
            f"║    💰 Payback Period: {projection.payback_months:.1f} months                        ║",
        ])
        
        # Add verdict
        if projection.roi_percentage > 200:
            verdict = "🔥 EXCELLENT INVESTMENT!"
        elif projection.roi_percentage > 100:
            verdict = "✅ STRONG POSITIVE ROI"
        elif projection.roi_percentage > 0:
            verdict = "🟡 MODERATE RETURN"
        else:
            verdict = "⚠️ REVIEW STRATEGY"
        
        lines.extend([
            "║                                                           ║",
            f"║    Verdict: {verdict:<40}  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def compare_services(self, metrics: ClientMetrics) -> str:
        """Compare ROI across all services."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  📊 SERVICE COMPARISON - 12 MONTH ROI                     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  Service    │ Investment │ Revenue ↑  │ ROI      │ Grade ║",
            "║  ────────────────────────────────────────────────────────║",
        ]
        
        projections = []
        for service in ServiceType:
            proj = self.project_roi(metrics, service)
            projections.append(proj)
        
        # Sort by ROI
        projections.sort(key=lambda x: x.roi_percentage, reverse=True)
        
        for proj in projections:
            name = proj.service.value.upper()[:8]
            investment = f"${proj.investment:,.0f}"
            increase = f"${proj.revenue_increase:,.0f}"
            roi = f"{proj.roi_percentage:.0f}%"
            
            if proj.roi_percentage > 200:
                grade = "🔥 A+"
            elif proj.roi_percentage > 100:
                grade = "✅ A"
            elif proj.roi_percentage > 50:
                grade = "🟡 B"
            else:
                grade = "🟠 C"
            
            lines.append(f"║  {name:<9} │ {investment:>10} │ {increase:>10} │ {roi:>8} │ {grade:<5} ║")
        
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            "║  💡 Recommendation: Focus on highest ROI services first   ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    calculator = ROICalculator()
    
    print("📊 ROI Calculator")
    print("=" * 60)
    print()
    
    # Sample client metrics
    metrics = ClientMetrics(
        monthly_traffic=10000,
        conversion_rate=0.02,  # 2%
        avg_order_value=150,
        current_leads=200,
        current_customers=50
    )
    
    print(f"📈 Client Current State:")
    print(f"   Monthly Traffic: {metrics.monthly_traffic:,}")
    print(f"   Conversion Rate: {metrics.conversion_rate * 100:.1f}%")
    print(f"   Avg Order Value: ${metrics.avg_order_value}")
    print()
    
    # Single service ROI
    seo_roi = calculator.project_roi(metrics, ServiceType.SEO)
    print(calculator.format_roi_report(seo_roi))
    print()
    
    # Compare all services
    print(calculator.compare_services(metrics))
