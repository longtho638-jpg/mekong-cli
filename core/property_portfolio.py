"""
🏢 Property Portfolio - Portfolio Management
==============================================

Manage property portfolios for clients.
Assets that grow!

Roles:
- Portfolio tracking
- Asset valuation
- Performance metrics
- Investment returns
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class AssetClass(Enum):
    """Asset classes."""
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    INDUSTRIAL = "industrial"
    MIXED_USE = "mixed_use"
    LAND = "land"


class AssetStatus(Enum):
    """Asset status."""
    HOLDING = "holding"
    RENTED = "rented"
    FOR_SALE = "for_sale"
    DEVELOPMENT = "development"
    SOLD = "sold"


@dataclass
class PropertyAsset:
    """A property asset."""
    id: str
    owner_id: str
    name: str
    asset_class: AssetClass
    purchase_price: float
    current_value: float
    rental_income: float = 0  # monthly
    status: AssetStatus = AssetStatus.HOLDING
    purchase_date: datetime = field(default_factory=datetime.now)
    location: str = ""


@dataclass
class PortfolioSummary:
    """Portfolio summary."""
    total_assets: int
    total_value: float
    total_rental: float
    roi_percent: float
    unrealized_gain: float


class PropertyPortfolio:
    """
    Property Portfolio Manager.
    
    Manage property portfolios.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.assets: Dict[str, PropertyAsset] = {}
    
    def add_asset(
        self,
        owner_id: str,
        name: str,
        asset_class: AssetClass,
        purchase_price: float,
        current_value: float,
        location: str = "",
        rental_income: float = 0
    ) -> PropertyAsset:
        """Add a property asset."""
        asset = PropertyAsset(
            id=f"AST-{uuid.uuid4().hex[:6].upper()}",
            owner_id=owner_id,
            name=name,
            asset_class=asset_class,
            purchase_price=purchase_price,
            current_value=current_value,
            rental_income=rental_income,
            location=location
        )
        self.assets[asset.id] = asset
        return asset
    
    def update_valuation(self, asset: PropertyAsset, new_value: float):
        """Update asset valuation."""
        asset.current_value = new_value
    
    def set_rental(self, asset: PropertyAsset, monthly_rent: float):
        """Set rental income."""
        asset.rental_income = monthly_rent
        asset.status = AssetStatus.RENTED
    
    def get_portfolio_summary(self, owner_id: str = None) -> PortfolioSummary:
        """Get portfolio summary."""
        assets = self.assets.values() if not owner_id else [a for a in self.assets.values() if a.owner_id == owner_id]
        
        total_value = sum(a.current_value for a in assets)
        total_cost = sum(a.purchase_price for a in assets)
        total_rental = sum(a.rental_income for a in assets)
        unrealized_gain = total_value - total_cost
        roi = (unrealized_gain / total_cost * 100) if total_cost else 0
        
        return PortfolioSummary(
            total_assets=len(list(assets)),
            total_value=total_value,
            total_rental=total_rental,
            roi_percent=roi,
            unrealized_gain=unrealized_gain
        )
    
    def format_dashboard(self) -> str:
        """Format portfolio dashboard."""
        summary = self.get_portfolio_summary()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🏢 PROPERTY PORTFOLIO                                    ║",
            f"║  {summary.total_assets} assets │ ${summary.total_value:,.0f} value │ {summary.roi_percent:+.1f}% ROI  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 PORTFOLIO OVERVIEW                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    💰 Total Value:        ${summary.total_value:>15,.0f}       ║",
            f"║    📈 Unrealized Gain:    ${summary.unrealized_gain:>15,.0f}       ║",
            f"║    🏠 Monthly Rental:     ${summary.total_rental:>15,.0f}       ║",
            f"║    📊 Portfolio ROI:      {summary.roi_percent:>15.1f}%       ║",
            "║                                                           ║",
            "║  🏠 ASSETS                                                ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        class_icons = {"residential": "🏠", "commercial": "🏢", "industrial": "🏭",
                      "mixed_use": "🏬", "land": "🌳"}
        status_icons = {"holding": "📦", "rented": "🔑", "for_sale": "🏷️",
                       "development": "🏗️", "sold": "✅"}
        
        for asset in list(self.assets.values())[:5]:
            c_icon = class_icons.get(asset.asset_class.value, "🏠")
            s_icon = status_icons.get(asset.status.value, "⚪")
            gain = asset.current_value - asset.purchase_price
            gain_pct = (gain / asset.purchase_price * 100) if asset.purchase_price else 0
            
            lines.append(f"║  {c_icon} {s_icon} {asset.name[:15]:<15} │ ${asset.current_value:>10,.0f} │ {gain_pct:>+5.1f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY ASSET CLASS                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for aclass in list(AssetClass)[:4]:
            count = sum(1 for a in self.assets.values() if a.asset_class == aclass)
            value = sum(a.current_value for a in self.assets.values() if a.asset_class == aclass)
            icon = class_icons.get(aclass.value, "🏠")
            lines.append(f"║    {icon} {aclass.value.title():<12} │ {count:>2} │ ${value:>14,.0f}    ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ Add Asset]  [📊 Valuation]  [📈 Performance]         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Assets that grow!               ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    portfolio = PropertyPortfolio("Saigon Digital Hub")
    
    print("🏢 Property Portfolio")
    print("=" * 60)
    print()
    
    a1 = portfolio.add_asset("CLT-001", "D2 Villa Complex", AssetClass.RESIDENTIAL, 2000000, 2500000, "District 2", 8000)
    a2 = portfolio.add_asset("CLT-001", "Office Tower A", AssetClass.COMMERCIAL, 5000000, 5800000, "District 1", 45000)
    a3 = portfolio.add_asset("CLT-002", "Industrial Park", AssetClass.INDUSTRIAL, 3000000, 3200000, "Binh Duong", 25000)
    a4 = portfolio.add_asset("CLT-002", "Development Land", AssetClass.LAND, 1000000, 1500000, "Thu Duc")
    
    portfolio.set_rental(a1, 8000)
    portfolio.set_rental(a2, 45000)
    
    print(portfolio.format_dashboard())
