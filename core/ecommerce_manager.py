"""
🏪 E-commerce Manager - Online Store Management
=================================================

Manage e-commerce operations for clients.
Online sales that scale!

Roles:
- Store setup
- Product management
- Order fulfillment
- Performance tracking
"""

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class StoreStatus(Enum):
    """Lifecycle status of an e-commerce store."""
    SETUP = "setup"
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    PAUSED = "paused"


class StorePlatform(Enum):
    """Supported e-commerce platforms."""
    SHOPIFY = "shopify"
    WOOCOMMERCE = "woocommerce"
    MAGENTO = "magento"
    TIKTOK_SHOP = "tiktok_shop"
    FACEBOOK_SHOP = "facebook_shop"
    CUSTOM = "custom"


@dataclass
class EcomStore:
    """An e-commerce store entity."""
    id: str
    client: str
    name: str
    platform: StorePlatform
    url: str
    status: StoreStatus = StoreStatus.SETUP
    products_count: int = 0
    orders_today: int = 0
    revenue_mtd: float = 0.0
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if self.products_count < 0:
            raise ValueError("Product count cannot be negative")


@dataclass
class StoreMetrics:
    """Snapshot of store performance metrics."""
    store_id: str
    date: datetime = field(default_factory=datetime.now)
    visitors: int = 0
    orders: int = 0
    revenue: float = 0.0
    conversion_rate: float = 0.0
    avg_order_value: float = 0.0


class EcommerceManager:
    """
    E-commerce Manager System.
    
    Orchestrates online storefront management, inventory tracking, and sales analytics.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.stores: Dict[str, EcomStore] = {}
        self.metrics: List[StoreMetrics] = []
        logger.info(f"E-commerce system initialized for {agency_name}")
    
    def create_store(
        self,
        client: str,
        name: str,
        platform: StorePlatform,
        url: str
    ) -> EcomStore:
        """Register a new e-commerce storefront for a client."""
        if not client or not name:
            raise ValueError("Client and store name are required")

        store = EcomStore(
            id=f"STR-{uuid.uuid4().hex[:6].upper()}",
            client=client, name=name, platform=platform, url=url
        )
        self.stores[store.id] = store
        logger.info(f"Store created: {name} on {platform.value}")
        return store
    
    def update_metrics(
        self,
        store_id: str,
        visitors: int,
        orders: int,
        revenue: float
    ) -> Optional[StoreMetrics]:
        """Record and calculate daily store performance metrics."""
        if store_id not in self.stores:
            return None
            
        s = self.stores[store_id]
        cvr = (orders / visitors * 100.0) if visitors > 0 else 0.0
        aov = (revenue / orders) if orders > 0 else 0.0
        
        m = StoreMetrics(
            store_id=store_id, visitors=visitors, orders=orders, 
            revenue=revenue, conversion_rate=cvr, avg_order_value=aov
        )
        self.metrics.append(m)
        
        s.orders_today = orders
        s.revenue_mtd += revenue
        
        logger.debug(f"Metrics logged for {s.name}: ${revenue:,.0f}")
        return m
    
    def format_dashboard(self) -> str:
        """Render the E-commerce Portfolio Dashboard."""
        total_rev = sum(s.revenue_mtd for s in self.stores.values())
        total_prod = sum(s.products_count for s in self.stores.values())
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🏪 E-COMMERCE MANAGER DASHBOARD{' ' * 30}║",
            f"║  {len(self.stores)} stores │ ${total_rev:,.0f} revenue │ {total_prod} products{' ' * 15}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🛒 STORE PORTFOLIO                                       ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        p_icons = {StorePlatform.SHOPIFY: "🛍️", StorePlatform.WOOCOMMERCE: "🔌", StorePlatform.TIKTOK_SHOP: "📱"}
        s_icons = {StoreStatus.ACTIVE: "🟢", StoreStatus.SETUP: "🔧", StoreStatus.MAINTENANCE: "🟡"}
        
        for s in list(self.stores.values())[:5]:
            icon = p_icons.get(s.platform, "🛒")
            stat = s_icons.get(s.status, "⚪")
            name_disp = (s.name[:15] + '..') if len(s.name) > 17 else s.name
            lines.append(f"║  {stat} {icon} {name_disp:<17} │ {s.client[:10]:<10} │ ${s.revenue_mtd:>8,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🛒 New Store]  [📊 Analytics]  [📦 Inventory]  [⚙️ Setup] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Selling!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🏪 Initializing E-commerce Manager...")
    print("=" * 60)
    
    try:
        ecom = EcommerceManager("Saigon Digital Hub")
        
        # Seed
        s1 = ecom.create_store("Coffee Lab", "CoffeeLab", StorePlatform.SHOPIFY, "coffee.myshopify.com")
        s1.status = StoreStatus.ACTIVE
        ecom.update_metrics(s1.id, 1000, 30, 3000.0)
        
        print("\n" + ecom.format_dashboard())
        
    except Exception as e:
        logger.error(f"Manager Error: {e}")
