"""
Gumroad Webhook processing logic.
"""

import logging
import uuid
from datetime import datetime

from backend.api.config.settings import settings
from backend.services.email_service import send_purchase_email
from core.infrastructure.notifications import Channel, NotificationService, NotificationType
from core.licensing.logic import license_generator

from .models import AffiliateReferral, GumroadPurchase

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


def extract_affiliate_code(purchase: GumroadPurchase) -> str | None:
    """
    Extract affiliate code from purchase data.
    Checks custom_fields first, then falls back to URL params if available.
    """
    # Check custom_fields first (Gumroad's recommended approach)
    if purchase.custom_fields and "affiliate_code" in purchase.custom_fields:
        return purchase.custom_fields.get("affiliate_code")

    # Fallback: check if referrer or other fields contain affiliate data
    # (This would require additional fields in GumroadPurchase model if needed)
    return None


def create_affiliate_referral(
    purchase: GumroadPurchase,
    affiliate_code: str,
    affiliates_store: dict
) -> AffiliateReferral:
    """
    Create affiliate referral record with 20% commission.

    Args:
        purchase: The purchase data
        affiliate_code: The affiliate's unique code
        affiliates_store: In-memory storage for affiliate referrals

    Returns:
        AffiliateReferral object
    """
    commission_rate = 0.20  # 20% commission
    commission_amount = float(purchase.price) * commission_rate

    referral = AffiliateReferral(
        id=str(uuid.uuid4()),
        affiliate_code=affiliate_code,
        sale_id=purchase.sale_id,
        customer_email=purchase.email,
        product_id=purchase.product_id,
        product_name=purchase.product_name,
        purchase_amount=float(purchase.price),
        commission_rate=commission_rate,
        commission_amount=commission_amount,
        status="pending",
        created_at=datetime.now().isoformat(),
    )

    # Store in affiliates dictionary by affiliate_code
    if affiliate_code not in affiliates_store:
        affiliates_store[affiliate_code] = {
            "code": affiliate_code,
            "total_referrals": 0,
            "total_sales": 0.0,
            "total_commission_pending": 0.0,
            "total_commission_paid": 0.0,
            "referrals": []
        }

    # Add to affiliate's referrals
    affiliates_store[affiliate_code]["referrals"].append(referral.model_dump())
    affiliates_store[affiliate_code]["total_referrals"] += 1
    affiliates_store[affiliate_code]["total_sales"] += float(purchase.price)
    affiliates_store[affiliate_code]["total_commission_pending"] += commission_amount

    logger.info(
        f"💰 Affiliate referral created: {affiliate_code} earned ${commission_amount:.2f} "
        f"(20% of ${purchase.price})"
    )

    return referral


async def process_purchase(
    purchase: GumroadPurchase,
    customers_store: dict,
    purchases_list: list,
    affiliates_store: dict | None = None
):
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

    # TASK J: Affiliate tracking
    if affiliates_store is not None:
        affiliate_code = extract_affiliate_code(purchase)
        if affiliate_code:
            try:
                referral = create_affiliate_referral(purchase, affiliate_code, affiliates_store)
                logger.info(
                    f"✅ Affiliate tracking: {affiliate_code} | "
                    f"Sale: ${purchase.price} | Commission: ${referral.commission_amount:.2f}"
                )
            except Exception as e:
                logger.error(f"❌ Failed to create affiliate referral: {e}", exc_info=True)
        else:
            logger.debug("No affiliate code found in purchase")

    # Send purchase confirmation email with license key
    try:
        email_sent = send_purchase_email(
            email=purchase.email,
            license_key=license_key,
            product_name=purchase.product_name
        )
        if email_sent:
            logger.info(f"📧 Purchase email sent successfully to {purchase.email}")
        else:
            logger.warning(f"⚠️ Failed to send purchase email to {purchase.email}")
    except Exception as e:
        logger.error(f"❌ Error sending purchase email to {purchase.email}: {str(e)}", exc_info=True)

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
