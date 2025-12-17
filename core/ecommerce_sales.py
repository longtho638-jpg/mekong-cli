"""
💰 E-commerce Sales - Online Sales
====================================

Drive online sales and conversions.
Revenue that grows!

Roles:
- Sales tracking
- Conversion optimization
- Cart recovery
- Customer engagement
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class SaleStatus(Enum):
    """Sale status."""
    CART = "cart"
    CHECKOUT = "checkout"
    PAID = "paid"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class CartStatus(Enum):
    """Cart recovery status."""
    ABANDONED = "abandoned"
    RECOVERED = "recovered"
    EXPIRED = "expired"


@dataclass
class Sale:
    """A sale transaction."""
    id: str
    store_id: str
    customer: str
    amount: float
    items_count: int
    status: SaleStatus = SaleStatus.CART
    source: str = "direct"  # direct, ad, email, social
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class AbandonedCart:
    """An abandoned cart."""
    id: str
    store_id: str
    customer_email: str
    cart_value: float
    status: CartStatus = CartStatus.ABANDONED
    recovery_attempts: int = 0
    abandoned_at: datetime = field(default_factory=datetime.now)


class EcommerceSales:
    """
    E-commerce Sales.
    
    Drive online sales.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.sales: List[Sale] = []
        self.abandoned_carts: List[AbandonedCart] = []
    
    def record_sale(
        self,
        store_id: str,
        customer: str,
        amount: float,
        items_count: int,
        source: str = "direct"
    ) -> Sale:
        """Record a sale."""
        sale = Sale(
            id=f"SAL-{uuid.uuid4().hex[:6].upper()}",
            store_id=store_id,
            customer=customer,
            amount=amount,
            items_count=items_count,
            source=source,
            status=SaleStatus.PAID
        )
        self.sales.append(sale)
        return sale
    
    def record_abandoned_cart(
        self,
        store_id: str,
        customer_email: str,
        cart_value: float
    ) -> AbandonedCart:
        """Record abandoned cart."""
        cart = AbandonedCart(
            id=f"CRT-{uuid.uuid4().hex[:6].upper()}",
            store_id=store_id,
            customer_email=customer_email,
            cart_value=cart_value
        )
        self.abandoned_carts.append(cart)
        return cart
    
    def recover_cart(self, cart: AbandonedCart):
        """Mark cart as recovered."""
        cart.status = CartStatus.RECOVERED
    
    def attempt_recovery(self, cart: AbandonedCart):
        """Record recovery attempt."""
        cart.recovery_attempts += 1
    
    def get_sales_stats(self, days: int = 30) -> Dict[str, Any]:
        """Get sales statistics."""
        cutoff = datetime.now() - timedelta(days=days)
        recent_sales = [s for s in self.sales if s.created_at >= cutoff and s.status == SaleStatus.PAID]
        
        total_revenue = sum(s.amount for s in recent_sales)
        avg_order = (total_revenue / len(recent_sales)) if recent_sales else 0
        
        by_source = {}
        for sale in recent_sales:
            by_source[sale.source] = by_source.get(sale.source, 0) + sale.amount
        
        return {
            "total_sales": len(recent_sales),
            "total_revenue": total_revenue,
            "avg_order_value": avg_order,
            "by_source": by_source
        }
    
    def get_recovery_stats(self) -> Dict[str, Any]:
        """Get cart recovery stats."""
        recovered = sum(1 for c in self.abandoned_carts if c.status == CartStatus.RECOVERED)
        abandoned_value = sum(c.cart_value for c in self.abandoned_carts if c.status == CartStatus.ABANDONED)
        recovered_value = sum(c.cart_value for c in self.abandoned_carts if c.status == CartStatus.RECOVERED)
        
        return {
            "total_abandoned": len(self.abandoned_carts),
            "recovered": recovered,
            "recovery_rate": (recovered / len(self.abandoned_carts) * 100) if self.abandoned_carts else 0,
            "abandoned_value": abandoned_value,
            "recovered_value": recovered_value
        }
    
    def format_dashboard(self) -> str:
        """Format sales dashboard."""
        stats = self.get_sales_stats()
        recovery = self.get_recovery_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💰 E-COMMERCE SALES                                      ║",
            f"║  {stats['total_sales']} sales │ ${stats['total_revenue']:,.0f} revenue │ ${stats['avg_order_value']:.0f} AOV  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 SALES BY SOURCE                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        source_icons = {"direct": "🌐", "ad": "📢", "email": "📧", "social": "📱"}
        
        for source, revenue in stats['by_source'].items():
            icon = source_icons.get(source, "💰")
            pct = (revenue / stats['total_revenue'] * 100) if stats['total_revenue'] else 0
            lines.append(f"║    {icon} {source.title():<12} │ ${revenue:>10,.0f} │ {pct:>5.1f}%            ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 RECENT SALES                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for sale in self.sales[-4:]:
            icon = source_icons.get(sale.source, "💰")
            lines.append(f"║  ✅ {icon} {sale.customer[:12]:<12} │ ${sale.amount:>8,.0f} │ {sale.items_count:>2} items  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🛒 CART RECOVERY                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    🔴 Abandoned:      {recovery['total_abandoned'] - recovery['recovered']:>3} carts (${recovery['abandoned_value']:>8,.0f})  ║",
            f"║    ✅ Recovered:      {recovery['recovered']:>3} carts (${recovery['recovered_value']:>8,.0f})  ║",
            f"║    📊 Recovery Rate:  {recovery['recovery_rate']:>6.1f}%                       ║",
            "║                                                           ║",
            "║  [💰 Sales]  [🛒 Carts]  [📊 Analytics]                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Revenue that grows!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    sales = EcommerceSales("Saigon Digital Hub")
    
    print("💰 E-commerce Sales")
    print("=" * 60)
    print()
    
    sales.record_sale("STR-001", "John Doe", 125.00, 3, "direct")
    sales.record_sale("STR-001", "Jane Smith", 89.00, 2, "email")
    sales.record_sale("STR-001", "Bob Wilson", 245.00, 5, "ad")
    sales.record_sale("STR-002", "Alice Brown", 67.00, 1, "social")
    
    c1 = sales.record_abandoned_cart("STR-001", "test@email.com", 150.00)
    c2 = sales.record_abandoned_cart("STR-001", "user@email.com", 85.00)
    
    sales.attempt_recovery(c1)
    sales.recover_cart(c1)
    
    print(sales.format_dashboard())
