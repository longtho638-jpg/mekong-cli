"""
📊 Inventory Manager - Stock & Fulfillment
============================================

Manage inventory and fulfillment.
Right stock, right time!

Roles:
- Stock tracking
- Reorder management
- Warehouse coordination
- Fulfillment tracking
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

class StockLevel(Enum):
    """Visual indicators for stock availability."""
    IN_STOCK = "in_stock"
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"
    OVERSTOCK = "overstock"


class FulfillmentStatus(Enum):
    """Lifecycle stages of a customer order."""
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    RETURNED = "returned"


@dataclass
class InventoryItem:
    """An individual SKU in the warehouse entity."""
    id: str
    product_id: str
    product_name: str
    quantity: int
    reorder_point: int = 10
    reorder_quantity: int = 50
    location: str = "Warehouse A"
    last_restocked: Optional[datetime] = None

    def __post_init__(self):
        if self.quantity < 0:
            raise ValueError("Quantity cannot be negative")


@dataclass
class Order:
    """A fulfillment request record entity."""
    id: str
    store_id: str
    customer: str
    items: List[str]
    total: float
    status: FulfillmentStatus = FulfillmentStatus.PENDING
    created_at: datetime = field(default_factory=datetime.now)
    shipped_at: Optional[datetime] = None

    def __post_init__(self):
        if self.total < 0:
            raise ValueError("Order total cannot be negative")


class InventoryManager:
    """
    Inventory Management System.
    
    Orchestrates stock levels, automated reordering, and the order fulfillment pipeline.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.inventory: Dict[str, InventoryItem] = {}
        self.orders: List[Order] = []
        logger.info(f"Inventory Manager initialized for {agency_name}")
    
    def add_sku(
        self,
        prod_id: str,
        name: str,
        qty: int,
        reorder_pt: int = 10
    ) -> InventoryItem:
        """Register a new product SKU into the inventory."""
        if not prod_id or not name:
            raise ValueError("Product ID and Name are required")

        item = InventoryItem(
            id=f"INV-{uuid.uuid4().hex[:6].upper()}",
            product_id=prod_id, product_name=name,
            quantity=max(0, qty), reorder_point=reorder_pt
        )
        self.inventory[item.id] = item
        logger.info(f"SKU Added: {name} ({qty} units)")
        return item
    
    def create_fulfillment_order(
        self,
        store_id: str,
        customer: str,
        items: List[str],
        total: float
    ) -> Order:
        """Initialize a new customer order for fulfillment."""
        order = Order(
            id=f"ORD-{uuid.uuid4().hex[:6].upper()}",
            store_id=store_id, customer=customer,
            items=items, total=float(total)
        )
        self.orders.append(order)
        logger.info(f"Order created: {order.id} for {customer}")
        return order
    
    def get_stock_alerts(self) -> List[InventoryItem]:
        """Filter items that have fallen below their reorder point."""
        return [i for i in self.inventory.values() if i.quantity <= i.reorder_point]
    
    def format_dashboard(self) -> str:
        """Render the Inventory & Fulfillment Dashboard."""
        alerts = self.get_stock_alerts()
        pending_orders = [o for o in self.orders if o.status == FulfillmentStatus.PENDING]
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 INVENTORY DASHBOARD{' ' * 36}║",
            f"║  {len(self.inventory)} SKUs │ {len(self.orders)} orders │ {len(alerts)} stock alerts{' ' * 14}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📦 CURRENT STOCK LEVELS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for i in list(self.inventory.values())[:5]:
            icon = "🟢" if i.quantity > i.reorder_point else "🔴"
            lines.append(f"║  {icon} {i.product_name[:20]:<20} │ {i.quantity:>5} qty │ {i.location[:10]:<10}  ║")
            
        lines.extend([
            "║                                                           ║",
            "║  🚚 PENDING SHIPMENTS                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for o in pending_orders[:3]:
            lines.append(f"║  ⏳ {o.id:<10} │ {o.customer[:15]:<15} │ ${o.total:>10,.0f}  ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [📦 Restock]  [🚚 Fulfill]  [📊 Audit]  [⚙️ Setup]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Logistics!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📊 Initializing Inventory System...")
    print("=" * 60)
    
    try:
        inv = InventoryManager("Saigon Digital Hub")
        # Seed
        inv.add_sku("BEANS-1", "Arabica Coffee 1kg", 150, 20)
        inv.add_sku("MUG-1", "Ceramic Mug", 5, 10) # Alert
        inv.create_fulfillment_order("STORE-1", "John Smith", ["BEANS-1"], 45.0)
        
        print("\n" + inv.format_dashboard())
        
    except Exception as e:
        logger.error(f"Inventory Error: {e}")
