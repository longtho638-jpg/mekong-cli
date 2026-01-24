"""
Gumroad Webhook processing logic.
"""

import logging
from datetime import datetime

from backend.api.config.settings import settings
from core.infrastructure.notifications import Channel, NotificationService, NotificationType
from core.licensing.logic import license_generator

from .models import GumroadPurchase

logger = logging.getLogger(__name__)

# Product ID → Tier mapping based on Gumroad products
# Prices: $0=free, $27=starter, $47=pro, $67-97=franchise, $197-497=enterprise
GUMROAD_TIER_MAPPING: dict[str, str] = {
    # Free tier - $0 products
    "cxcpz": "free",  # vscode-starter-pack ($0)
    # Starter tier - $27 products
    "geioa": "starter",  # vibe-starter ($27)
    "vxynr": "starter",  # ai-skills-pack ($27)
    # Pro tier - $47 products
    "vlhelc": "pro",  # fastapi-starter ($47)
    "vlrvh": "pro",  # auth-starter-supabase ($47)
    # Franchise tier - $67-97 products
    "iisxjg": "franchise",  # vietnamese-agency-kit ($67)
    # Enterprise tier - $197+ products
    "oxvdrj": "enterprise",  # agencyos-pro ($197)
    "coyds": "enterprise",  # agencyos-enterprise ($497)
}


def get_tier_from_product(product_id: str, price: float = 0) -> str:
    """
    Determine license tier from Gumroad product_id or price.
    Falls back to price-based logic if product_id not found.
    """
    # First try exact product_id mapping
    if product_id in GUMROAD_TIER_MAPPING:
        return GUMROAD_TIER_MAPPING[product_id]

    # Fallback: determine tier by price
    if price <= 0:
        return "free"
    elif price < 40:
        return "starter"
    elif price < 70:
        return "pro"
    elif price < 150:
        return "franchise"
    else:
        return "enterprise"


async def send_welcome_email(customer: dict):
    """Send welcome email with license and portal link."""
    logger.info(f"📧 Sending welcome email to {customer['email']}")
    notifier = NotificationService()
    notifier.create_notification(
        n_type=NotificationType.WELCOME,
        channel=Channel.EMAIL,
        recipient=customer["email"],
        variables={
            "client_name": customer.get("email").split("@")[0],
            "agency_name": "AgencyOS",
            "company": "Customer",
        },
    )
    portal_url = f"{settings.webhook_portal_url}/activate?key={customer['license_key']}"
    logger.info(f"   Portal: {portal_url}")


async def process_purchase(purchase: GumroadPurchase, customers_store: dict, purchases_list: list):
    """Process Gumroad purchase and create platform account."""
    logger.info(f"💰 Processing purchase: {purchase.email} bought {purchase.product_name}")

    # FIXED: Use dynamic tier mapping instead of hardcoded 'pro'
    tier = get_tier_from_product(purchase.product_id, float(purchase.price or 0))
    logger.info(f"   📊 Tier determined: {tier} (product_id: {purchase.product_id})")

    license_key = purchase.license_key or license_generator.generate(
        format="mekong", tier=tier, email=purchase.email, product_id=purchase.product_id
    )

    customer = {
        "email": purchase.email,
        "product_id": purchase.product_id,
        "product_name": purchase.product_name,
        "license_key": license_key,
        "purchase_date": datetime.now().isoformat(),
        "sale_id": purchase.sale_id,
        "status": "active",
        "source": "gumroad",
    }

    customers_store[purchase.email] = customer
    purchases_list.append({**customer, "price": purchase.price, "currency": purchase.currency})

    # Trigger Workflow Engine
    try:
        from scripts.vibeos.workflow_engine import WorkflowEngine

        engine = WorkflowEngine()
        if "gumroad_closed_loop" not in engine.workflows:
            engine.install_templates()

        context = {
            "email": purchase.email,
            "product_id": purchase.product_id,
            "product_name": purchase.product_name,
            "price": purchase.price,
            "sale_id": purchase.sale_id,
            "license_key": license_key,
        }
        engine.execute("gumroad_closed_loop", context)
    except Exception as e:
        logger.error(f"⚠️ Workflow execution failed: {e}")

    await send_welcome_email(customer)
    logger.info(f"✅ Customer created: {purchase.email}")
    return customer
