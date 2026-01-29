"""
Example integration of email service with Gumroad webhook

This shows how to integrate the email service into the webhook handler
to send purchase confirmation emails automatically.
"""

import logging

from backend.services.email_service import send_purchase_email
from backend.services.license_service import generate_license_key

logger = logging.getLogger(__name__)


def handle_purchase_webhook(webhook_data: dict) -> dict:
    """
    Handle Gumroad purchase webhook and send confirmation email

    Args:
        webhook_data: Webhook payload from Gumroad

    Returns:
        dict with status and details
    """
    try:
        # Extract purchase information
        purchase = webhook_data.get("purchase", {})
        product = webhook_data.get("product", {})

        customer_email = purchase.get("email")
        product_name = product.get("name", "BizPlan Generator")
        purchase_id = purchase.get("id")

        if not customer_email:
            logger.error("No customer email in webhook data")
            return {"success": False, "error": "Missing customer email"}

        # Generate license key
        license_key = generate_license_key(
            product_name=product_name,
            customer_email=customer_email,
            tier="pro",  # Could be extracted from product variant
        )

        logger.info(f"Generated license key {license_key} for {customer_email}")

        # Send welcome email with license key
        email_sent = send_purchase_email(
            email=customer_email, license_key=license_key, product_name=product_name
        )

        if email_sent:
            logger.info(f"Welcome email sent to {customer_email} for purchase {purchase_id}")
            return {
                "success": True,
                "email_sent": True,
                "license_key": license_key,
                "customer_email": customer_email,
            }
        else:
            logger.warning(f"Failed to send email to {customer_email}, but license generated")
            return {
                "success": True,  # Purchase still valid even if email fails
                "email_sent": False,
                "license_key": license_key,
                "customer_email": customer_email,
                "warning": "Email delivery failed, but license is valid",
            }

    except Exception as e:
        logger.error(f"Error handling purchase webhook: {str(e)}")
        return {"success": False, "error": str(e)}


def resend_purchase_email(customer_email: str, license_key: str, product_name: str) -> bool:
    """
    Resend purchase email (for customer support)

    Args:
        customer_email: Customer's email address
        license_key: Previously generated license key
        product_name: Product name

    Returns:
        True if email sent successfully
    """
    try:
        logger.info(f"Resending purchase email to {customer_email}")

        success = send_purchase_email(
            email=customer_email, license_key=license_key, product_name=product_name
        )

        if success:
            logger.info(f"Purchase email resent successfully to {customer_email}")
        else:
            logger.error(f"Failed to resend email to {customer_email}")

        return success

    except Exception as e:
        logger.error(f"Error resending email: {str(e)}")
        return False


# Example usage in FastAPI endpoint
"""
from fastapi import APIRouter, Request, HTTPException
from backend.services.email_integration import handle_purchase_webhook

router = APIRouter()

@router.post("/webhooks/gumroad/purchase")
async def gumroad_purchase_webhook(request: Request):
    '''Handle Gumroad purchase webhook'''
    try:
        # Parse webhook data
        webhook_data = await request.json()

        # Process purchase and send email
        result = handle_purchase_webhook(webhook_data)

        if result["success"]:
            return {
                "status": "success",
                "license_key": result["license_key"],
                "email_sent": result.get("email_sent", False)
            }
        else:
            raise HTTPException(status_code=500, detail=result.get("error"))

    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
"""
