from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.core.config import settings
from app.services.verification.providers import StripeVerifier, GithubVerifier, GumroadVerifier, ShopifyVerifier
from app.services.webhook_sender import WebhookSender
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

async def verify_signature(
    request: Request,
    provider: str,
    secret: str
) -> bool:
    # Read body once
    payload = await request.body()
    headers = request.headers

    verifier = None
    if provider == "stripe":
        verifier = StripeVerifier()
    elif provider == "github":
        verifier = GithubVerifier()
    elif provider == "gumroad":
        verifier = GumroadVerifier()
    elif provider == "shopify":
        verifier = ShopifyVerifier()

    if verifier:
        return verifier.verify(payload, dict(headers), secret)
    return False

@router.post("/{provider}")
async def receive_webhook(
    provider: str,
    request: Request,
    db: Session = Depends(deps.get_db)
):
    """
    Receive webhooks from external providers (Stripe, GitHub, etc.)
    """
    secret = None
    if provider == "stripe":
        secret = settings.STRIPE_WEBHOOK_SECRET
    elif provider == "github":
        secret = settings.GITHUB_WEBHOOK_SECRET
    elif provider == "gumroad":
        # Gumroad might not enforce secret check if not configured,
        # but if we set one, we expect it (e.g. in URL path or custom logic).
        # For now, we use the config if available.
        secret = settings.GUMROAD_WEBHOOK_SECRET or "optional"
    elif provider == "shopify":
        secret = settings.SHOPIFY_WEBHOOK_SECRET

    if not secret and provider != "gumroad":
        logger.warning(f"Provider {provider} not configured with a secret")
        raise HTTPException(status_code=501, detail=f"Provider {provider} not configured")

    # Only verify if we have a real secret and provider is strict
    if secret and secret != "optional":
        if not await verify_signature(request, provider, secret):
             logger.warning(f"Invalid signature for provider {provider}")
             raise HTTPException(status_code=401, detail="Invalid signature")

    # If valid, parse payload
    try:
        # Check content type
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            payload = await request.json()
        elif "application/x-www-form-urlencoded" in content_type:
             # Gumroad sends form data
             form_data = await request.form()
             payload = dict(form_data)
        else:
             # Fallback to json if possible
             payload = await request.json()
    except Exception as e:
        logger.error(f"Error parsing payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")

    # Determine event type
    event_type = f"{provider}.unknown"
    if provider == "stripe":
        event_type = payload.get("type", event_type)
    elif provider == "github":
        # GitHub sends event type in header X-GitHub-Event
        # And action in payload usually
        gh_event = request.headers.get("X-GitHub-Event", "unknown")
        action = payload.get("action")
        if action:
            event_type = f"github.{gh_event}.{action}"
        else:
            event_type = f"github.{gh_event}"
    elif provider == "shopify":
         # Shopify sends topic in header X-Shopify-Topic
        topic = request.headers.get("X-Shopify-Topic", "unknown")
        event_type = f"shopify.{topic}"
    elif provider == "gumroad":
        if "resource_name" in payload:
             event_type = f"gumroad.{payload['resource_name']}"
        else:
             event_type = "gumroad.sale" # Default for gumroad ping usually

    # Process event
    # This will store the event and trigger delivery (sync or via internal background task for now)
    # In Phase 2, this call will push to Redis queue
    await WebhookSender.process_event(db, event_type, payload)

    return {"status": "received", "event_type": event_type}
