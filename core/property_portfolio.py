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

import uuid
import logging
from typing import Dict
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AssetClass(Enum):
    """Broad categories for real estate assets."""
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    INDUSTRIAL = "industrial"
    MIXED_USE = "mixed_use"
    LAND = "land"


class AssetStatus(Enum):
    """Operational status of a property asset."""
    HOLDING = "holding"
    RENTED = "rented"
    FOR_SALE = "for_sale"
    DEVELOPMENT = "development"
    SOLD = "sold"


@dataclass
class PropertyAsset:
    """A real estate asset entity record."""
    id: str
    owner_id: str
    name: str
    asset_class: AssetClass
    purchase_price: float
    current_value: float
    rental_income: float = 0.0
    status: AssetStatus = AssetStatus.HOLDING
    purchase_date: datetime = field(default_factory=datetime.now)
    location: str = ""

    def __post_init__(self):
        if self.purchase_price < 0 or self.current_value < 0:
            raise ValueError("Valuation cannot be negative")


@dataclass
class PortfolioSummary:
    """High-level metrics for an asset collection."""
    total_assets: int = 0
    total_value: float = 0.0
    total_rental: float = 0.0
    roi_percent: float = 0.0
    unrealized_gain: float = 0.0


class PropertyPortfolio:
    """
    Property Portfolio System.
    
    Orchestrates the tracking of real estate assets, performance monitoring, and valuation reporting.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.assets: Dict[str, PropertyAsset] = {}
        logger.info(f"Property Portfolio initialized for {agency_name}")
    
    def add_asset(
        self,
        owner_id: str,
        name: str,
        a_class: AssetClass,
        price: float,
        value: float,
        location: str = "",
        rental: float = 0.0
    ) -> PropertyAsset:
        """Register a new asset into the portfolio tracking system."""
        if not owner_id or not name:
            raise ValueError("Owner ID and Asset Name are required")

        asset = PropertyAsset(
            id=f"AST-{uuid.uuid4().hex[:6].upper()}",
            owner_id=owner_id, name=name, asset_class=a_class,
            purchase_price=float(price), current_value=float(value),
            rental_income=float(rental), location=location
        )
        self.assets[asset.id] = asset
        logger.info(f"Asset registered: {name} (${value:,.0f})")
        return asset
    
    def get_aggregate_summary(self) -> PortfolioSummary:
        """Calculate performance across all tracked assets."""
        if not self.assets: return PortfolioSummary()
        
        total_v = sum(a.current_value for a in self.assets.values())
        total_p = sum(a.purchase_price for a in self.assets.values())
        total_r = sum(a.rental_income for a in self.assets.values())
        gain = total_v - total_p
        
        return PortfolioSummary(
            total_assets=len(self.assets),
            total_value=total_v,
            total_rental=total_r,
            unrealized_gain=gain,
            roi_percent=(gain / total_p * 100.0) if total_p > 0 else 0.0
        )
    
    def format_dashboard(self) -> str:
        """Render the Property Portfolio Dashboard."""
        s = self.get_aggregate_summary()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🏢 PROPERTY PORTFOLIO DASHBOARD{' ' * 29}║",
            f"║  {s.total_assets} assets │ ${s.total_value:,.0f} valuation │ {s.roi_percent:+.1f}% avg ROI{' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 ASSET ALLOCATION & YIELD                              ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    💰 Total Value:        ${s.total_value:>15,.0f}       ║",
            f"║    📈 Unrealized Gain:    ${s.unrealized_gain:>15,.0f}       ║",
            f"║    🏠 Monthly Rental:     ${s.total_rental:>15,.0f}       ║",
            "║                                                           ║",
            "║  🏠 CORE ASSET LIST                                       ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        class_icons = {AssetClass.RESIDENTIAL: "🏠", AssetClass.COMMERCIAL: "🏢", AssetClass.LAND: "🌳"}
        
        for a in list(self.assets.values())[:5]:
            icon = class_icons.get(a.asset_class, "🏢")
            gain = a.current_value - a.purchase_price
            gain_pct = (gain / a.purchase_price * 100) if a.purchase_price else 0
            lines.append(f"║  🟢 {icon} {a.name[:18]:<18} │ ${a.current_value:>10,.0f} │ {gain_pct:>+5.1f}% ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Asset]  [📈 Revaluation]  [📂 Report]  [⚙️]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Growth!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🏢 Initializing Portfolio System...")
    print("=" * 60)
    
    try:
        portfolio = PropertyPortfolio("Saigon Digital Hub")
        # Seed
        portfolio.add_asset("C1", "Villa District 2", AssetClass.RESIDENTIAL, 2000000.0, 2500000.0, "D2", 8000.0)
        
        print("\n" + portfolio.format_dashboard())
        
    except Exception as e:
        logger.error(f"Portfolio Error: {e}")
