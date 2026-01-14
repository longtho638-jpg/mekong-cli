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

import uuid
import logging
import re
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SaleStatus(Enum):
    """Sale lifecycle status."""
    CART = "cart"
    CHECKOUT = "checkout"
    PAID = "paid"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class CartStatus(Enum):
    """Cart recovery lifecycle status."""
    ABANDONED = "abandoned"
    RECOVERED = "recovered"
    EXPIRED = "expired"


@dataclass
class Sale:
    """A single e-commerce sale transaction entity."""
    id: str
    store_id: str
    customer: str
    amount: float
    items_count: int
    status: SaleStatus = SaleStatus.CART
    source: str = "direct"  # direct, ad, email, social
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if self.amount < 0:
            raise ValueError("Sale amount cannot be negative")
        if self.items_count < 0:
            raise ValueError("Item count cannot be negative")


@dataclass
class AbandonedCart:
    """An abandoned cart record for recovery operations."""
    id: str
    store_id: str
    customer_email: str
    cart_value: float
    status: CartStatus = CartStatus.ABANDONED
    recovery_attempts: int = 0
    abandoned_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if self.cart_value < 0:
            raise ValueError("Cart value cannot be negative")


class EcommerceSales:
    """
    E-commerce Sales System.
    
    Orchestrates transaction tracking and automated cart recovery workflows.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.sales: List[Sale] = []
        self.abandoned_carts: List[AbandonedCart] = []
        logger.info(f"E-commerce Sales system initialized for {agency_name}")
    
    def _validate_email(self, email: str) -> bool:
        return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))

    def record_sale(
        self,
        store_id: str,
        customer: str,
        amount: float,
        items_count: int,
        source: str = "direct"
    ) -> Sale:
        """Log a successful sale transaction."""
        if not customer:
            raise ValueError("Customer name required")

        sale = Sale(
            id=f"SAL-{uuid.uuid4().hex[:6].upper()}",
            store_id=store_id, customer=customer,
            amount=amount, items_count=items_count,
            source=source, status=SaleStatus.PAID
        )
        self.sales.append(sale)
        logger.info(f"Sale recorded: {customer} (${amount:,.2f}) via {source}")
        return sale
    
    def log_abandoned_cart(
        self,
        store_id: str,
        email: str,
        value: float
    ) -> AbandonedCart:
        """Register a cart for potential recovery."""
        if not self._validate_email(email):
            raise ValueError(f"Invalid email: {email}")

        cart = AbandonedCart(
            id=f"CRT-{uuid.uuid4().hex[:6].upper()}",
            store_id=store_id, customer_email=email, cart_value=value
        )
        self.abandoned_carts.append(cart)
        logger.info(f"Abandoned cart logged: {email} (${value:,.0f})")
        return cart
    
    def get_stats(self, days: int = 30) -> Dict[str, Any]:
        """Aggregate sales and recovery performance data."""
        cutoff = datetime.now() - timedelta(days=days)
        recent_sales = [s for s in self.sales if s.created_at >= cutoff and s.status == SaleStatus.PAID]
        
        revenue = sum(s.amount for s in recent_sales)
        aov = (revenue / len(recent_sales)) if recent_sales else 0.0
        
        recovered_carts = [c for c in self.abandoned_carts if c.status == CartStatus.RECOVERED]
        
        return {
            "sales_count": len(recent_sales),
            "total_revenue": revenue,
            "avg_order_value": aov,
            "recovery_rate": (len(recovered_carts) / len(self.abandoned_carts) * 100) if self.abandoned_carts else 0.0
        }
    
    def format_dashboard(self) -> str:
        """Render the Sales Dashboard."""
        s = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💰 E-COMMERCE SALES DASHBOARD{' ' * 31}║",
            f"║  {s['sales_count']} sales │ ${s['total_revenue']:,.0f} revenue │ ${s['avg_order_value']:.0f} AOV{' ' * 14}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 RECENT TRANSACTIONS                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        # Display latest 4 sales
        for sale in self.sales[-4:]:
            icon = {"direct": "🌐", "email": "📧", "ad": "📢", "social": "📱"}.get(sale.source, "💰")
            cust_disp = (sale.customer[:12] + '..') if len(sale.customer) > 14 else sale.customer
            lines.append(f"║  ✅ {icon} {cust_disp:<14} │ ${sale.amount:>8,.0f} │ {sale.items_count:>2} items  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🛒 RECOVERY TRACKER                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    📊 Recovery Rate:  {s['recovery_rate']:>6.1f}%                       ║",
            "║                                                           ║",
            "║  [💰 Sales]  [🛒 Carts]  [📊 Conversion]  [⚙️ Settings]   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Profits!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("💰 Initializing Sales System...")
    print("=" * 60)
    
    try:
        sales_system = EcommerceSales("Saigon Digital Hub")
        
        # Seed data
        sales_system.record_sale("ST-1", "John Doe", 150.0, 2, "direct")
        sales_system.log_abandoned_cart("ST-1", "test@user.co", 200.0)
        
        print("\n" + sales_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"Sales Error: {e}")