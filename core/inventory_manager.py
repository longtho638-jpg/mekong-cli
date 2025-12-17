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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class StockLevel(Enum):
    """Stock level status."""
    IN_STOCK = "in_stock"
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"
    OVERSTOCK = "overstock"


class FulfillmentStatus(Enum):
    """Fulfillment status."""
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    RETURNED = "returned"


@dataclass
class InventoryItem:
    """An inventory item."""
    id: str
    product_id: str
    product_name: str
    quantity: int
    reorder_point: int = 10
    reorder_quantity: int = 50
    location: str = "Warehouse A"
    last_restocked: Optional[datetime] = None


@dataclass
class Order:
    """A customer order."""
    id: str
    store_id: str
    customer: str
    items: List[str]
    total: float
    status: FulfillmentStatus = FulfillmentStatus.PENDING
    created_at: datetime = field(default_factory=datetime.now)
    shipped_at: Optional[datetime] = None


class InventoryManager:
    """
    Inventory Manager.
    
    Manage stock and fulfillment.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.inventory: Dict[str, InventoryItem] = {}
        self.orders: List[Order] = []
    
    def add_inventory(
        self,
        product_id: str,
        product_name: str,
        quantity: int,
        reorder_point: int = 10,
        location: str = "Warehouse A"
    ) -> InventoryItem:
        """Add inventory item."""
        item = InventoryItem(
            id=f"INV-{uuid.uuid4().hex[:6].upper()}",
            product_id=product_id,
            product_name=product_name,
            quantity=quantity,
            reorder_point=reorder_point,
            location=location
        )
        self.inventory[item.id] = item
        return item
    
    def restock(self, item: InventoryItem, quantity: int):
        """Restock inventory."""
        item.quantity += quantity
        item.last_restocked = datetime.now()
    
    def create_order(
        self,
        store_id: str,
        customer: str,
        items: List[str],
        total: float
    ) -> Order:
        """Create an order."""
        order = Order(
            id=f"ORD-{uuid.uuid4().hex[:6].upper()}",
            store_id=store_id,
            customer=customer,
            items=items,
            total=total
        )
        self.orders.append(order)
        return order
    
    def update_order(self, order: Order, status: FulfillmentStatus):
        """Update order status."""
        order.status = status
        if status == FulfillmentStatus.SHIPPED:
            order.shipped_at = datetime.now()
    
    def get_stock_level(self, item: InventoryItem) -> StockLevel:
        """Get stock level status."""
        if item.quantity == 0:
            return StockLevel.OUT_OF_STOCK
        elif item.quantity <= item.reorder_point:
            return StockLevel.LOW_STOCK
        elif item.quantity > item.reorder_quantity * 2:
            return StockLevel.OVERSTOCK
        return StockLevel.IN_STOCK
    
    def get_reorder_alerts(self) -> List[InventoryItem]:
        """Get items needing reorder."""
        return [i for i in self.inventory.values() if i.quantity <= i.reorder_point]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get inventory stats."""
        pending = sum(1 for o in self.orders if o.status == FulfillmentStatus.PENDING)
        shipped = sum(1 for o in self.orders if o.status == FulfillmentStatus.SHIPPED)
        alerts = len(self.get_reorder_alerts())
        
        return {
            "total_items": len(self.inventory),
            "total_orders": len(self.orders),
            "pending": pending,
            "shipped": shipped,
            "reorder_alerts": alerts
        }
    
    def format_dashboard(self) -> str:
        """Format inventory dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 INVENTORY MANAGER                                     ║",
            f"║  {stats['total_items']} items │ {stats['total_orders']} orders │ {stats['reorder_alerts']} alerts     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📦 INVENTORY STATUS                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        level_icons = {"in_stock": "🟢", "low_stock": "🟡", "out_of_stock": "🔴", "overstock": "🔵"}
        
        for item in list(self.inventory.values())[:5]:
            level = self.get_stock_level(item)
            icon = level_icons.get(level.value, "⚪")
            
            lines.append(f"║  {icon} {item.product_name[:18]:<18} │ {item.quantity:>4} qty │ {item.location[:10]:<10}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  ⚠️ REORDER ALERTS                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for item in self.get_reorder_alerts()[:3]:
            lines.append(f"║  🔴 {item.product_name[:20]:<20} │ {item.quantity:>3}/{item.reorder_point:>3} │ Reorder: {item.reorder_quantity:>3}  ║")
        
        if not self.get_reorder_alerts():
            lines.append("║    ✅ All stock levels healthy                            ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 RECENT ORDERS                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        status_icons = {"pending": "⏳", "processing": "🔄", "shipped": "📦",
                       "delivered": "✅", "returned": "↩️"}
        
        for order in self.orders[-4:]:
            icon = status_icons.get(order.status.value, "⚪")
            lines.append(f"║  {icon} {order.id:<10} │ {order.customer[:12]:<12} │ ${order.total:>8,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📦 Restock]  [📋 Orders]  [📊 Reports]                  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Right stock, right time!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    inv = InventoryManager("Saigon Digital Hub")
    
    print("📊 Inventory Manager")
    print("=" * 60)
    print()
    
    i1 = inv.add_inventory("PRD-001", "Coffee Beans 1kg", 150, 20)
    i2 = inv.add_inventory("PRD-002", "Coffee Mug Set", 8, 10)  # Low stock
    i3 = inv.add_inventory("PRD-003", "T-Shirt Large", 0, 15)   # Out of stock
    
    o1 = inv.create_order("STR-001", "John Doe", ["PRD-001", "PRD-002"], 55.00)
    o2 = inv.create_order("STR-001", "Jane Smith", ["PRD-001"], 25.00)
    
    inv.update_order(o1, FulfillmentStatus.SHIPPED)
    
    print(inv.format_dashboard())
