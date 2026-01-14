"""
📦 Product Manager - Product Catalog Management
=================================================

Manage product catalogs for e-commerce clients.
Products that sell!

Roles:
- Product sourcing
- Catalog management
- Pricing strategy
- Supplier relations
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

class ProductStatus(Enum):
    """Lifecycle status of a catalog product."""
    DRAFT = "draft"
    ACTIVE = "active"
    OUT_OF_STOCK = "out_of_stock"
    DISCONTINUED = "discontinued"


class ProductCategory(Enum):
    """Broad categories for product classification."""
    ELECTRONICS = "electronics"
    FASHION = "fashion"
    FOOD = "food"
    BEAUTY = "beauty"
    HOME = "home"
    OTHER = "other"


@dataclass
class Product:
    """A single catalog product entity."""
    id: str
    store_id: str
    name: str
    category: ProductCategory
    sku: str
    price: float
    cost: float
    quantity: int
    status: ProductStatus = ProductStatus.DRAFT

    def __post_init__(self):
        if self.price < 0 or self.cost < 0:
            raise ValueError("Financials cannot be negative")
        if self.quantity < 0:
            raise ValueError("Quantity cannot be negative")


@dataclass
class Supplier:
    """A product sourcing partner entity."""
    id: str
    name: str
    contact: str
    products_count: int = 0
    rating: int = 5  # 1-5
    lead_time_days: int = 7


class ProductManager:
    """
    Product Manager System.
    
    Orchestrates the lifecycle of e-commerce products, supplier relations, and inventory health.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.products: Dict[str, Product] = {}
        self.suppliers: Dict[str, Supplier] = {}
        logger.info(f"Product Manager initialized for {agency_name}")
    
    def add_product(
        self,
        store_id: str,
        name: str,
        category: ProductCategory,
        price: float,
        cost: float,
        quantity: int = 0
    ) -> Product:
        """Register a new product in the catalog."""
        if not store_id or not name:
            raise ValueError("Store ID and Name are mandatory")

        p = Product(
            id=f"PRD-{uuid.uuid4().hex[:6].upper()}",
            store_id=store_id, name=name, category=category,
            sku=f"SKU-{uuid.uuid4().hex[:8].upper()}",
            price=float(price), cost=float(cost), quantity=max(0, quantity)
        )
        self.products[p.id] = p
        logger.info(f"Product added: {name} (SKU: {p.sku})")
        return p
    
    def calculate_potential_margin(self) -> float:
        """Derive aggregate profit margin for all inventoried products."""
        rev = sum(p.price * p.quantity for p in self.products.values())
        cost = sum(p.cost * p.quantity for p in self.products.values())
        if rev <= 0: return 0.0
        return ((rev - cost) / rev) * 100.0
    
    def format_dashboard(self) -> str:
        """Render the Product Manager Dashboard."""
        margin = self.calculate_potential_margin()
        active = [p for p in self.products.values() if p.status == ProductStatus.ACTIVE]
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📦 PRODUCT MANAGER DASHBOARD{' ' * 31}║",
            f"║  {len(self.products)} products │ {len(self.suppliers)} suppliers │ {margin:.1f}% potential margin{' ' * 8}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 CORE CATALOG                                          ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for p in list(self.products.values())[:5]:
            stat_icon = "✅" if p.status == ProductStatus.ACTIVE else "📝"
            lines.append(f"║  {stat_icon} {p.name[:18]:<18} │ ${p.price:>10,.2f} │ Qty: {p.quantity:>4}  ║")
            
        lines.extend([
            "║                                                           ║",
            "║  🏭 ACTIVE SUPPLIERS                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for s in list(self.suppliers.values())[:3]:
            stars = "★" * s.rating + "☆" * (5 - s.rating)
            lines.append(f"║    📦 {s.name[:15]:<15} │ {stars} │ {s.lead_time_days:>2} days lead  ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [➕ Product]  [🏭 Suppliers]  [📊 Analysis]  [⚙️ Setup]  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Selling!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📦 Initializing Product Manager...")
    print("=" * 60)
    
    try:
        pm_system = ProductManager("Saigon Digital Hub")
        # Seed
        pm_system.add_product("S1", "Coffee Beans", ProductCategory.FOOD, 25.0, 12.0, 100)
        pm_system.suppliers["S1"] = Supplier("SUP-1", "VNCoffee", "info@vn.co")
        
        print("\n" + pm_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"Product Error: {e}")
