"""
FBA Inventory Agent - Inventory & Storage Management
Manages FBA inventory tracking and restock alerts.
"""

from dataclasses import dataclass
from typing import List, Dict
from datetime import date
from enum import Enum
import random


class InventoryStatus(Enum):
    IN_STOCK = "in_stock"
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"
    RESERVED = "reserved"
    INBOUND = "inbound"


@dataclass
class FBAProduct:
    """FBA product"""
    id: str
    asin: str
    sku: str
    name: str
    units_available: int = 0
    units_inbound: int = 0
    units_reserved: int = 0
    status: InventoryStatus = InventoryStatus.IN_STOCK
    reorder_point: int = 50
    fba_fee: float = 0
    storage_fee: float = 0
    last_restock: date = None
    
    @property
    def total_units(self) -> int:
        return self.units_available + self.units_inbound
    
    @property
    def needs_restock(self) -> bool:
        return self.units_available <= self.reorder_point


class FBAInventoryAgent:
    """
    FBA Inventory Agent - Quản lý Kho FBA
    
    Responsibilities:
    - Inventory tracking
    - Restock alerts
    - FBA fees calculation
    - Storage optimization
    """
    
    def __init__(self):
        self.name = "FBA Inventory"
        self.status = "ready"
        self.products: Dict[str, FBAProduct] = {}
        
    def add_product(
        self,
        asin: str,
        sku: str,
        name: str,
        units: int = 0,
        reorder_point: int = 50
    ) -> FBAProduct:
        """Add FBA product"""
        product_id = f"fba_{random.randint(1000,9999)}"
        
        product = FBAProduct(
            id=product_id,
            asin=asin,
            sku=sku,
            name=name,
            units_available=units,
            reorder_point=reorder_point
        )
        
        # Calculate fees
        product.fba_fee = random.uniform(3.0, 8.0)
        product.storage_fee = random.uniform(0.5, 2.0)
        
        # Update status
        if units == 0:
            product.status = InventoryStatus.OUT_OF_STOCK
        elif units <= reorder_point:
            product.status = InventoryStatus.LOW_STOCK
        
        self.products[product_id] = product
        return product
    
    def update_inventory(self, product_id: str, units: int) -> FBAProduct:
        """Update inventory levels"""
        if product_id not in self.products:
            raise ValueError(f"Product not found: {product_id}")
            
        product = self.products[product_id]
        product.units_available = units
        
        if units == 0:
            product.status = InventoryStatus.OUT_OF_STOCK
        elif units <= product.reorder_point:
            product.status = InventoryStatus.LOW_STOCK
        else:
            product.status = InventoryStatus.IN_STOCK
        
        return product
    
    def create_shipment(self, product_id: str, units: int) -> FBAProduct:
        """Create inbound shipment"""
        if product_id not in self.products:
            raise ValueError(f"Product not found: {product_id}")
            
        product = self.products[product_id]
        product.units_inbound = units
        product.status = InventoryStatus.INBOUND
        
        return product
    
    def receive_shipment(self, product_id: str) -> FBAProduct:
        """Receive inbound shipment"""
        if product_id not in self.products:
            raise ValueError(f"Product not found: {product_id}")
            
        product = self.products[product_id]
        product.units_available += product.units_inbound
        product.units_inbound = 0
        product.status = InventoryStatus.IN_STOCK
        product.last_restock = date.today()
        
        return product
    
    def get_restock_alerts(self) -> List[FBAProduct]:
        """Get products needing restock"""
        return [p for p in self.products.values() if p.needs_restock]
    
    def get_stats(self) -> Dict:
        """Get inventory statistics"""
        products = list(self.products.values())
        
        return {
            "total_products": len(products),
            "total_units": sum(p.total_units for p in products),
            "low_stock": len([p for p in products if p.status == InventoryStatus.LOW_STOCK]),
            "out_of_stock": len([p for p in products if p.status == InventoryStatus.OUT_OF_STOCK]),
            "total_fba_fees": sum(p.fba_fee for p in products),
            "total_storage_fees": sum(p.storage_fee for p in products)
        }


# Demo
if __name__ == "__main__":
    agent = FBAInventoryAgent()
    
    print("📦 FBA Inventory Agent Demo\n")
    
    # Add products
    p1 = agent.add_product("B08N5WRWNW", "SKU-001", "Wireless Earbuds", 150, 50)
    p2 = agent.add_product("B09XR3WMXP", "SKU-002", "Phone Stand", 30, 50)
    
    print(f"📋 Product: {p1.name}")
    print(f"   ASIN: {p1.asin}")
    print(f"   Units: {p1.units_available}")
    print(f"   Status: {p1.status.value}")
    print(f"   FBA Fee: ${p1.fba_fee:.2f}")
    
    # Check restock
    alerts = agent.get_restock_alerts()
    print(f"\n⚠️ Restock Alerts: {len(alerts)}")
    
    # Create shipment
    agent.create_shipment(p2.id, 100)
    print(f"\n📦 Inbound: {p2.units_inbound} units")
    
    # Stats
    stats = agent.get_stats()
    print(f"\n📊 Total Units: {stats['total_units']}")
    print(f"   Low Stock: {stats['low_stock']}")
