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

    license_key = purchase.license_key or license_generator.generate(
        format='mekong', tier='pro', email=purchase.email, product_id=purchase.product_id
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
            "email": purchase.email, "product_id": purchase.product_id,
            "product_name": purchase.product_name, "price": purchase.price,
            "sale_id": purchase.sale_id, "license_key": license_key,
        }
        engine.execute("gumroad_closed_loop", context)
    except Exception as e:
        logger.error(f"⚠️ Workflow execution failed: {e}")

    await send_welcome_email(customer)
    logger.info(f"✅ Customer created: {purchase.email}")
    return customer
