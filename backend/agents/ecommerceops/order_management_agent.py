"""
Order Management Agent - Orders & Fulfillment
Manages order processing, fulfillment, and returns.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import random


class OrderStatus(Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"


@dataclass
class OrderItem:
    """Order line item"""
    product_id: str
    product_name: str
    variant_name: str
    quantity: int
    unit_price: float
    
    @property
    def total(self) -> float:
        return self.quantity * self.unit_price


@dataclass
class Order:
    """E-commerce order"""
    id: str
    customer_email: str
    items: List[OrderItem] = field(default_factory=list)
    status: OrderStatus = OrderStatus.PENDING
    subtotal: float = 0
    shipping: float = 0
    tax: float = 0
    created_at: datetime = field(default_factory=datetime.now)
    shipped_at: Optional[datetime] = None
    tracking_number: Optional[str] = None
    
    @property
    def total(self) -> float:
        return self.subtotal + self.shipping + self.tax


class OrderManagementAgent:
    """
    Order Management Agent - Quản lý Đơn hàng
    
    Responsibilities:
    - Order processing pipeline
    - Fulfillment tracking
    - Returns & refunds
    - Revenue analytics
    """
    
    def __init__(self):
        self.name = "Order Management"
        self.status = "ready"
        self.orders: Dict[str, Order] = {}
        
    def create_order(self, customer_email: str) -> Order:
        """Create new order"""
        order_id = f"ORD-{random.randint(10000,99999)}"
        
        order = Order(
            id=order_id,
            customer_email=customer_email
        )
        
        self.orders[order_id] = order
        return order
    
    def add_item(
        self,
        order_id: str,
        product_id: str,
        product_name: str,
        variant_name: str,
        quantity: int,
        unit_price: float
    ) -> Order:
        """Add item to order"""
        if order_id not in self.orders:
            raise ValueError(f"Order not found: {order_id}")
            
        item = OrderItem(
            product_id=product_id,
            product_name=product_name,
            variant_name=variant_name,
            quantity=quantity,
            unit_price=unit_price
        )
        
        order = self.orders[order_id]
        order.items.append(item)
        order.subtotal = sum(i.total for i in order.items)
        order.tax = order.subtotal * 0.08  # 8% tax
        order.shipping = 9.99 if order.subtotal < 50 else 0  # Free shipping over $50
        
        return order
    
    def confirm_order(self, order_id: str) -> Order:
        """Confirm order"""
        if order_id not in self.orders:
            raise ValueError(f"Order not found: {order_id}")
        
        order = self.orders[order_id]
        order.status = OrderStatus.CONFIRMED
        return order
    
    def ship_order(self, order_id: str, tracking: str) -> Order:
        """Ship order"""
        if order_id not in self.orders:
            raise ValueError(f"Order not found: {order_id}")
        
        order = self.orders[order_id]
        order.status = OrderStatus.SHIPPED
        order.shipped_at = datetime.now()
        order.tracking_number = tracking
        return order
    
    def deliver_order(self, order_id: str) -> Order:
        """Mark order as delivered"""
        if order_id not in self.orders:
            raise ValueError(f"Order not found: {order_id}")
        
        order = self.orders[order_id]
        order.status = OrderStatus.DELIVERED
        return order
    
    def get_pipeline(self) -> Dict[str, int]:
        """Get order pipeline counts"""
        pipeline = {}
        for status in OrderStatus:
            pipeline[status.value] = len([o for o in self.orders.values() if o.status == status])
        return pipeline
    
    def get_stats(self) -> Dict:
        """Get order statistics"""
        orders = list(self.orders.values())
        delivered = [o for o in orders if o.status == OrderStatus.DELIVERED]
        
        return {
            "total_orders": len(orders),
            "total_revenue": sum(o.total for o in delivered),
            "avg_order_value": sum(o.total for o in delivered) / len(delivered) if delivered else 0,
            "pending": len([o for o in orders if o.status == OrderStatus.PENDING])
        }


# Demo
if __name__ == "__main__":
    agent = OrderManagementAgent()
    
    print("🛒 Order Management Agent Demo\n")
    
    # Create order
    o1 = agent.create_order("customer@example.com")
    
    print(f"📋 Order: {o1.id}")
    
    # Add items
    agent.add_item(o1.id, "prod_123", "Wireless Earbuds Pro", "Color: Black", 1, 99.99)
    agent.add_item(o1.id, "prod_456", "Phone Case", "Size: Large", 2, 19.99)
    
    print(f"   Items: {len(o1.items)}")
    print(f"   Subtotal: ${o1.subtotal:.2f}")
    print(f"   Tax: ${o1.tax:.2f}")
    print(f"   Shipping: ${o1.shipping:.2f}")
    print(f"   Total: ${o1.total:.2f}")
    
    # Process order
    agent.confirm_order(o1.id)
    print(f"\n   Status: {o1.status.value}")
    
    agent.ship_order(o1.id, "1Z999AA10123456784")
    print(f"   Status: {o1.status.value}")
    print(f"   Tracking: {o1.tracking_number}")
    
    agent.deliver_order(o1.id)
    print(f"   Status: {o1.status.value}")
    
    # Stats
    stats = agent.get_stats()
    print(f"\n📊 Stats:")
    print(f"   Total Revenue: ${stats['total_revenue']:.2f}")
    print(f"   Avg Order Value: ${stats['avg_order_value']:.2f}")
