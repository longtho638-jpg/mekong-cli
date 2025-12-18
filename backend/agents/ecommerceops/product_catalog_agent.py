"""
Product Catalog Agent - Products & Inventory
Manages product catalog, inventory, and pricing.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import random


class ProductStatus(Enum):
    ACTIVE = "active"
    DRAFT = "draft"
    ARCHIVED = "archived"
    OUT_OF_STOCK = "out_of_stock"


@dataclass
class ProductVariant:
    """Product variant"""
    id: str
    name: str  # e.g., "Size: Large, Color: Blue"
    sku: str
    price: float
    stock: int
    

@dataclass
class Product:
    """E-commerce product"""
    id: str
    name: str
    description: str
    category: str
    base_price: float
    status: ProductStatus = ProductStatus.DRAFT
    variants: List[ProductVariant] = field(default_factory=list)
    images: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    
    @property
    def total_stock(self) -> int:
        if self.variants:
            return sum(v.stock for v in self.variants)
        return 0
    
    @property
    def min_price(self) -> float:
        if self.variants:
            return min(v.price for v in self.variants)
        return self.base_price


class ProductCatalogAgent:
    """
    Product Catalog Agent - Quản lý Sản phẩm
    
    Responsibilities:
    - Product CRUD operations
    - Inventory tracking
    - Pricing & discounts
    - Variant management
    """
    
    def __init__(self):
        self.name = "Product Catalog"
        self.status = "ready"
        self.products: Dict[str, Product] = {}
        
    def create_product(
        self,
        name: str,
        description: str,
        category: str,
        base_price: float
    ) -> Product:
        """Create new product"""
        product_id = f"prod_{random.randint(1000,9999)}"
        
        product = Product(
            id=product_id,
            name=name,
            description=description,
            category=category,
            base_price=base_price
        )
        
        self.products[product_id] = product
        return product
    
    def add_variant(
        self,
        product_id: str,
        name: str,
        sku: str,
        price: float,
        stock: int
    ) -> Product:
        """Add variant to product"""
        if product_id not in self.products:
            raise ValueError(f"Product not found: {product_id}")
            
        variant_id = f"var_{random.randint(100,999)}"
        variant = ProductVariant(
            id=variant_id,
            name=name,
            sku=sku,
            price=price,
            stock=stock
        )
        
        self.products[product_id].variants.append(variant)
        return self.products[product_id]
    
    def publish_product(self, product_id: str) -> Product:
        """Publish product"""
        if product_id not in self.products:
            raise ValueError(f"Product not found: {product_id}")
        
        product = self.products[product_id]
        if product.total_stock > 0:
            product.status = ProductStatus.ACTIVE
        else:
            product.status = ProductStatus.OUT_OF_STOCK
        return product
    
    def update_stock(self, product_id: str, variant_id: str, quantity: int) -> Product:
        """Update variant stock"""
        if product_id not in self.products:
            raise ValueError(f"Product not found: {product_id}")
            
        product = self.products[product_id]
        variant = next((v for v in product.variants if v.id == variant_id), None)
        if variant:
            variant.stock = max(0, quantity)
        return product
    
    def get_low_stock(self, threshold: int = 10) -> List[Product]:
        """Get products with low stock"""
        return [p for p in self.products.values() if 0 < p.total_stock <= threshold]
    
    def get_stats(self) -> Dict:
        """Get catalog statistics"""
        products = list(self.products.values())
        active = [p for p in products if p.status == ProductStatus.ACTIVE]
        
        return {
            "total_products": len(products),
            "active": len(active),
            "total_stock": sum(p.total_stock for p in products),
            "low_stock": len(self.get_low_stock())
        }


# Demo
if __name__ == "__main__":
    agent = ProductCatalogAgent()
    
    print("📦 Product Catalog Agent Demo\n")
    
    # Create product
    p1 = agent.create_product(
        "Wireless Earbuds Pro",
        "Premium wireless earbuds with noise cancellation",
        "Electronics",
        99.99
    )
    
    print(f"📋 Product: {p1.name}")
    print(f"   Category: {p1.category}")
    print(f"   Base Price: ${p1.base_price}")
    
    # Add variants
    agent.add_variant(p1.id, "Color: Black", "WEP-BLK", 99.99, 50)
    agent.add_variant(p1.id, "Color: White", "WEP-WHT", 99.99, 35)
    agent.add_variant(p1.id, "Color: Blue", "WEP-BLU", 109.99, 5)  # Low stock
    
    print(f"   Variants: {len(p1.variants)}")
    print(f"   Total Stock: {p1.total_stock}")
    
    # Publish
    agent.publish_product(p1.id)
    print(f"   Status: {p1.status.value}")
    
    # Stats
    stats = agent.get_stats()
    print(f"\n📊 Catalog Stats:")
    print(f"   Active Products: {stats['active']}")
    print(f"   Total Stock: {stats['total_stock']}")
