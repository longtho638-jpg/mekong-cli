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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class StoreStatus(Enum):
    """Store status."""
    SETUP = "setup"
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    PAUSED = "paused"


class StorePlatform(Enum):
    """E-commerce platforms."""
    SHOPIFY = "shopify"
    WOOCOMMERCE = "woocommerce"
    MAGENTO = "magento"
    TIKTOK_SHOP = "tiktok_shop"
    FACEBOOK_SHOP = "facebook_shop"
    CUSTOM = "custom"


@dataclass
class EcomStore:
    """An e-commerce store."""
    id: str
    client: str
    name: str
    platform: StorePlatform
    url: str
    status: StoreStatus = StoreStatus.SETUP
    products_count: int = 0
    orders_today: int = 0
    revenue_mtd: float = 0
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class StoreMetrics:
    """Store performance metrics."""
    store_id: str
    date: datetime
    visitors: int
    orders: int
    revenue: float
    conversion_rate: float
    avg_order_value: float


class EcommerceManager:
    """
    E-commerce Manager.
    
    Manage online stores.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.stores: Dict[str, EcomStore] = {}
        self.metrics: List[StoreMetrics] = []
    
    def create_store(
        self,
        client: str,
        name: str,
        platform: StorePlatform,
        url: str
    ) -> EcomStore:
        """Create an e-commerce store."""
        store = EcomStore(
            id=f"STR-{uuid.uuid4().hex[:6].upper()}",
            client=client,
            name=name,
            platform=platform,
            url=url
        )
        self.stores[store.id] = store
        return store
    
    def launch_store(self, store: EcomStore):
        """Launch a store."""
        store.status = StoreStatus.ACTIVE
    
    def record_metrics(
        self,
        store: EcomStore,
        visitors: int,
        orders: int,
        revenue: float
    ) -> StoreMetrics:
        """Record daily metrics."""
        conversion = (orders / visitors * 100) if visitors else 0
        aov = (revenue / orders) if orders else 0
        
        metrics = StoreMetrics(
            store_id=store.id,
            date=datetime.now(),
            visitors=visitors,
            orders=orders,
            revenue=revenue,
            conversion_rate=conversion,
            avg_order_value=aov
        )
        self.metrics.append(metrics)
        
        store.orders_today = orders
        store.revenue_mtd += revenue
        
        return metrics
    
    def get_portfolio_stats(self) -> Dict[str, Any]:
        """Get portfolio statistics."""
        active = sum(1 for s in self.stores.values() if s.status == StoreStatus.ACTIVE)
        total_revenue = sum(s.revenue_mtd for s in self.stores.values())
        total_products = sum(s.products_count for s in self.stores.values())
        
        return {
            "total_stores": len(self.stores),
            "active": active,
            "total_revenue": total_revenue,
            "total_products": total_products
        }
    
    def format_dashboard(self) -> str:
        """Format e-commerce manager dashboard."""
        stats = self.get_portfolio_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🏪 E-COMMERCE MANAGER                                    ║",
            f"║  {stats['total_stores']} stores │ ${stats['total_revenue']:,.0f} revenue │ {stats['total_products']} products  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🛒 STORE PORTFOLIO                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        status_icons = {"setup": "🔧", "active": "🟢", "maintenance": "🟡", "paused": "⏸️"}
        platform_icons = {"shopify": "🛍️", "woocommerce": "🔌", "magento": "🏬",
                         "tiktok_shop": "📱", "facebook_shop": "📘", "custom": "⚙️"}
        
        for store in list(self.stores.values())[:5]:
            s_icon = status_icons.get(store.status.value, "⚪")
            p_icon = platform_icons.get(store.platform.value, "🛒")
            
            lines.append(f"║  {s_icon} {p_icon} {store.name[:15]:<15} │ {store.client[:10]:<10} │ ${store.revenue_mtd:>8,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY PLATFORM                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for platform in list(StorePlatform)[:4]:
            count = sum(1 for s in self.stores.values() if s.platform == platform)
            revenue = sum(s.revenue_mtd for s in self.stores.values() if s.platform == platform)
            icon = platform_icons.get(platform.value, "🛒")
            lines.append(f"║    {icon} {platform.value.replace('_', ' ').title():<15} │ {count:>2} stores │ ${revenue:>10,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🛒 New Store]  [📊 Analytics]  [⚙️ Settings]            ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - E-commerce excellence!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ecom = EcommerceManager("Saigon Digital Hub")
    
    print("🏪 E-commerce Manager")
    print("=" * 60)
    print()
    
    s1 = ecom.create_store("Coffee Lab", "CoffeeLab Shop", StorePlatform.SHOPIFY, "coffeelab.myshopify.com")
    s2 = ecom.create_store("Fashion Brand", "Style Store", StorePlatform.WOOCOMMERCE, "style.com")
    s3 = ecom.create_store("Tech Startup", "Gadget Store", StorePlatform.TIKTOK_SHOP, "tiktok.com/@gadgets")
    
    s1.products_count = 45
    s2.products_count = 120
    s3.products_count = 30
    
    ecom.launch_store(s1)
    ecom.launch_store(s2)
    
    ecom.record_metrics(s1, 1500, 45, 4500)
    ecom.record_metrics(s2, 2500, 75, 9500)
    
    print(ecom.format_dashboard())
