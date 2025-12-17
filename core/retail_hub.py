"""
🛒 Retail Hub - Department Integration
========================================

Central hub connecting all Retail/E-commerce roles.

Integrates:
- E-commerce Manager
- Product Manager
- Inventory Manager
- Digital Merchandiser
- E-commerce Sales
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import role modules
from core.ecommerce_manager import EcommerceManager, StorePlatform
from core.product_manager import ProductManager, ProductCategory
from core.inventory_manager import InventoryManager
from core.digital_merchandiser import DigitalMerchandiser, DisplayType
from core.ecommerce_sales import EcommerceSales


@dataclass
class RetailMetrics:
    """Department-wide metrics."""
    total_stores: int
    active_stores: int
    total_products: int
    total_revenue: float
    avg_order_value: float
    inventory_alerts: int
    live_displays: int
    cart_recovery_rate: float


class RetailHub:
    """
    Retail/E-commerce Hub.
    
    Connects all retail roles.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize role modules
        self.ecom_manager = EcommerceManager(agency_name)
        self.product_manager = ProductManager(agency_name)
        self.inventory_manager = InventoryManager(agency_name)
        self.merchandiser = DigitalMerchandiser(agency_name)
        self.sales = EcommerceSales(agency_name)
    
    def get_department_metrics(self) -> RetailMetrics:
        """Get department-wide metrics."""
        ecom_stats = self.ecom_manager.get_portfolio_stats()
        sales_stats = self.sales.get_sales_stats()
        recovery_stats = self.sales.get_recovery_stats()
        inv_stats = self.inventory_manager.get_stats()
        merch_stats = self.merchandiser.get_stats()
        
        return RetailMetrics(
            total_stores=ecom_stats.get("total_stores", 0),
            active_stores=ecom_stats.get("active", 0),
            total_products=len(self.product_manager.products),
            total_revenue=sales_stats.get("total_revenue", 0),
            avg_order_value=sales_stats.get("avg_order_value", 0),
            inventory_alerts=inv_stats.get("reorder_alerts", 0),
            live_displays=merch_stats.get("live", 0),
            cart_recovery_rate=recovery_stats.get("recovery_rate", 0)
        )
    
    def format_hub_dashboard(self) -> str:
        """Format the hub dashboard."""
        metrics = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🛒 RETAIL / E-COMMERCE HUB                               ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    🏪 Active Stores:      {metrics.active_stores:>5}                          ║",
            f"║    📦 Total Products:     {metrics.total_products:>5}                          ║",
            f"║    💰 Total Revenue:      ${metrics.total_revenue:>10,.0f}                   ║",
            f"║    📊 Avg Order Value:    ${metrics.avg_order_value:>10,.0f}                   ║",
            f"║    ⚠️ Inventory Alerts:   {metrics.inventory_alerts:>5}                          ║",
            f"║    🖼️ Live Displays:      {metrics.live_displays:>5}                          ║",
            f"║    🛒 Cart Recovery:      {metrics.cart_recovery_rate:>5.1f}%                         ║",
            "║                                                           ║",
            "║  🔗 RETAIL ROLES                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    🏪 E-commerce Manager  → Store management             ║",
            "║    📦 Product Manager     → Catalog & pricing            ║",
            "║    📊 Inventory Manager   → Stock & fulfillment          ║",
            "║    🎨 Merchandiser        → Visual displays              ║",
            "║    💰 E-commerce Sales    → Revenue & recovery           ║",
            "║                                                           ║",
            "║  📋 TEAM STATS                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    🏪 Stores             │ {metrics.active_stores} active                   ║",
            f"║    📦 Products           │ {metrics.total_products} in catalog               ║",
            f"║    💰 Revenue            │ ${metrics.total_revenue:,.0f}                  ║",
            "║                                                           ║",
            "║  [📊 Reports]  [🛒 Stores]  [⚙️ Settings]                 ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - E-commerce excellence!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = RetailHub("Saigon Digital Hub")
    
    print("🛒 Retail / E-commerce Hub")
    print("=" * 60)
    print()
    
    # Simulate data
    hub.ecom_manager.create_store("Coffee Lab", "Coffee Shop", StorePlatform.SHOPIFY, "coffee.myshopify.com")
    hub.product_manager.add_product("STR-001", "Coffee Beans", ProductCategory.FOOD, 25, 12, 100)
    hub.inventory_manager.add_inventory("PRD-001", "Coffee Beans", 100, 20)
    hub.merchandiser.create_display("STR-001", "Summer Sale", DisplayType.HOMEPAGE_HERO)
    hub.sales.record_sale("STR-001", "Customer", 50, 2, "direct")
    
    print(hub.format_hub_dashboard())
