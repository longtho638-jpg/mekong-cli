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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class ProductStatus(Enum):
    """Product status."""
    DRAFT = "draft"
    ACTIVE = "active"
    OUT_OF_STOCK = "out_of_stock"
    DISCONTINUED = "discontinued"


class ProductCategory(Enum):
    """Product categories."""
    ELECTRONICS = "electronics"
    FASHION = "fashion"
    FOOD = "food"
    BEAUTY = "beauty"
    HOME = "home"
    OTHER = "other"


@dataclass
class Product:
    """A product."""
    id: str
    store_id: str
    name: str
    category: ProductCategory
    sku: str
    price: float
    cost: float
    quantity: int
    status: ProductStatus = ProductStatus.DRAFT


@dataclass
class Supplier:
    """A supplier."""
    id: str
    name: str
    contact: str
    products_count: int = 0
    rating: int = 5  # 1-5
    lead_time_days: int = 7


class ProductManager:
    """
    Product Manager.
    
    Manage product catalogs.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.products: Dict[str, Product] = {}
        self.suppliers: Dict[str, Supplier] = {}
    
    def add_product(
        self,
        store_id: str,
        name: str,
        category: ProductCategory,
        price: float,
        cost: float,
        quantity: int = 0
    ) -> Product:
        """Add a product."""
        product = Product(
            id=f"PRD-{uuid.uuid4().hex[:6].upper()}",
            store_id=store_id,
            name=name,
            category=category,
            sku=f"SKU-{uuid.uuid4().hex[:8].upper()}",
            price=price,
            cost=cost,
            quantity=quantity
        )
        self.products[product.id] = product
        return product
    
    def activate_product(self, product: Product):
        """Activate a product."""
        product.status = ProductStatus.ACTIVE
    
    def add_supplier(
        self,
        name: str,
        contact: str,
        lead_time: int = 7
    ) -> Supplier:
        """Add a supplier."""
        supplier = Supplier(
            id=f"SUP-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            contact=contact,
            lead_time_days=lead_time
        )
        self.suppliers[supplier.id] = supplier
        return supplier
    
    def get_margin_analysis(self) -> Dict[str, Any]:
        """Get margin analysis."""
        if not self.products:
            return {}
        
        total_revenue = sum(p.price * p.quantity for p in self.products.values())
        total_cost = sum(p.cost * p.quantity for p in self.products.values())
        margin = ((total_revenue - total_cost) / total_revenue * 100) if total_revenue else 0
        
        return {
            "total_products": len(self.products),
            "total_revenue_potential": total_revenue,
            "total_cost": total_cost,
            "margin_percent": margin
        }
    
    def format_dashboard(self) -> str:
        """Format product manager dashboard."""
        analysis = self.get_margin_analysis()
        active = sum(1 for p in self.products.values() if p.status == ProductStatus.ACTIVE)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📦 PRODUCT MANAGER                                       ║",
            f"║  {len(self.products)} products │ {len(self.suppliers)} suppliers │ {analysis.get('margin_percent', 0):.0f}% margin  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 PRODUCT CATALOG                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        status_icons = {"draft": "📝", "active": "✅", "out_of_stock": "❌", "discontinued": "🚫"}
        
        for product in list(self.products.values())[:5]:
            icon = status_icons.get(product.status.value, "⚪")
            margin = ((product.price - product.cost) / product.price * 100) if product.price else 0
            
            lines.append(f"║  {icon} {product.name[:18]:<18} │ ${product.price:>6.0f} │ {margin:>3.0f}% │ {product.quantity:>3} qty  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY CATEGORY                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        cat_icons = {"electronics": "📱", "fashion": "👗", "food": "🍕",
                    "beauty": "💄", "home": "🏠", "other": "📦"}
        
        for cat in list(ProductCategory)[:4]:
            count = sum(1 for p in self.products.values() if p.category == cat)
            icon = cat_icons.get(cat.value, "📦")
            lines.append(f"║    {icon} {cat.value.title():<15} │ {count:>3} products                  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🏭 SUPPLIERS                                             ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for supplier in list(self.suppliers.values())[:3]:
            stars = "⭐" * supplier.rating
            lines.append(f"║    📦 {supplier.name[:15]:<15} │ {stars:<5} │ {supplier.lead_time_days:>2} days        ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ Add Product]  [🏭 Suppliers]  [📊 Analysis]          ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Products that sell!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    pm = ProductManager("Saigon Digital Hub")
    
    print("📦 Product Manager")
    print("=" * 60)
    print()
    
    p1 = pm.add_product("STR-001", "Premium Coffee Beans", ProductCategory.FOOD, 25, 12, 100)
    p2 = pm.add_product("STR-001", "Coffee Mug Set", ProductCategory.HOME, 35, 15, 50)
    p3 = pm.add_product("STR-002", "Designer T-Shirt", ProductCategory.FASHION, 45, 18, 75)
    
    pm.activate_product(p1)
    pm.activate_product(p2)
    
    pm.add_supplier("Vietnam Coffee Co", "info@vncoffee.vn", 5)
    pm.add_supplier("Fashion Wholesale", "sales@fashion.com", 10)
    
    print(pm.format_dashboard())
