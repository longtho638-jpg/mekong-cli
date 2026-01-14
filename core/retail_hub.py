"""
🛒 Retail Hub - Department Integration
========================================

Central hub connecting all Retail/E-commerce roles within the agency.

Integrates:
- E-commerce Manager
- Product Manager
- Inventory Manager
- Digital Merchandiser
- E-commerce Sales
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime

# Import role modules with fallback
try:
    from core.ecommerce_manager import EcommerceManager, StorePlatform
    from core.product_manager import ProductManager, ProductCategory
    from core.inventory_manager import InventoryManager
    from core.digital_merchandiser import DigitalMerchandiser, DisplayType
    from core.ecommerce_sales import EcommerceSales
except ImportError:
    from ecommerce_manager import EcommerceManager, StorePlatform
    from product_manager import ProductManager, ProductCategory
    from inventory_manager import InventoryManager
    from digital_merchandiser import DigitalMerchandiser, DisplayType
    from ecommerce_sales import EcommerceSales

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class RetailMetrics:
    """Department-wide E-commerce performance metrics."""
    total_stores: int = 0
    active_stores: int = 0
    total_products: int = 0
    total_revenue: float = 0.0
    avg_order_value: float = 0.0
    inventory_alerts: int = 0
    live_displays: int = 0
    cart_recovery_rate: float = 0.0


class RetailHub:
    """
    Retail/E-commerce Hub System.
    
    Orchestrates department-wide integration between catalog management, inventory, visuals, and sales analytics.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        logger.info(f"Initializing Retail Hub for {agency_name}")
        
        try:
            self.ecom_manager = EcommerceManager(agency_name)
            self.product_manager = ProductManager(agency_name)
            self.inventory_manager = InventoryManager(agency_name)
            self.merchandiser = DigitalMerchandiser(agency_name)
            self.sales = EcommerceSales(agency_name)
        except Exception as e:
            logger.error(f"Retail Hub initialization failed: {e}")
            raise
    
    def get_aggregate_stats(self) -> RetailMetrics:
        """Fetch and aggregate data from all retail sub-modules."""
        m = RetailMetrics()
        
        try:
            # 1. Store Data
            e_stats = self.ecom_manager.get_portfolio_stats()
            m.total_stores = e_stats.get("total_stores", 0)
            m.active_stores = e_stats.get("active", 0)
            
            # 2. Product Data
            m.total_products = len(self.product_manager.products)
            
            # 3. Sales Data
            s_stats = self.sales.get_sales_stats()
            m.total_revenue = float(s_stats.get("total_revenue", 0.0))
            m.avg_order_value = float(s_stats.get("avg_order_value", 0.0))
            
            # 4. Inventory Alerts
            i_stats = self.inventory_manager.get_stats()
            m.inventory_alerts = i_stats.get("reorder_alerts", 0)
            
            # 5. Merchandising
            merch_stats = self.merchandiser.get_stats()
            m.live_displays = merch_stats.get("live", 0)
            
        except Exception as e:
            logger.warning(f"Error aggregating Retail metrics: {e}")
            
        return m
    
    def format_hub_dashboard(self) -> str:
        """Render the unified Retail Department Dashboard."""
        m = self.get_aggregate_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🛒 RETAIL / E-COMMERCE HUB DASHBOARD{' ' * 28}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT PERFORMANCE METRICS                        ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    🏪 Active Stores:      {m.active_stores:>5}                          ║",
            f"║    📦 Total Products:     {m.total_products:>5}                          ║",
            f"║    💰 Total Revenue:      ${m.total_revenue:>12,.0f}              ║",
            f"║    📊 Avg Order Value:    ${m.avg_order_value:>12,.0f}              ║",
            f"║    ⚠️ Inventory Alerts:   {m.inventory_alerts:>5}                          ║",
            f"║    🖼️ Live Displays:      {m.live_displays:>5}                          ║",
            "║                                                           ║",
            "║  🔗 SERVICE INTEGRATIONS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    🏪 Stores │ 📦 Catalog │ 📊 Stock │ 🎨 Visuals │ 💰 Sales ║",
            "║                                                           ║",
            "║  [📊 Reports]  [🛒 My Stores]  [📦 Inventory]  [⚙️]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Selling!      ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🛒 Initializing Retail Hub...")
    print("=" * 60)
    
    try:
        hub = RetailHub("Saigon Digital Hub")
        print("\n" + hub.format_hub_dashboard())
    except Exception as e:
        logger.error(f"Retail Hub Error: {e}")
