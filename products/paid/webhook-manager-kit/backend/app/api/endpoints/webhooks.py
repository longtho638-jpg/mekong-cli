from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.webhook import WebhookEndpoint, WebhookEndpointCreate, WebhookEndpointUpdate, WebhookDelivery
from app.crud import crud_webhook
from app.models.webhook import WebhookEndpoint as WebhookEndpointModel
import secrets

router = APIRouter()

@router.get("/", response_model=List[WebhookEndpoint])
def read_webhook_endpoints(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve webhook endpoints.
    """
    endpoints = crud_webhook.webhook_endpoint.get_multi(db, skip=skip, limit=limit)
    return endpoints

@router.post("/", response_model=WebhookEndpoint)
def create_webhook_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    endpoint_in: WebhookEndpointCreate,
):
    """
    Create new webhook endpoint.
    """
    # Generate a secret if not provided (though schema doesn't ask for it, we generate it here)
    # The Pydantic model WebhookEndpointCreate doesn't have 'secret', but DB model does.
    # We need to adapt this.

    # We need to manually handle the creation to inject secret
    from app.models.webhook import WebhookEndpoint

    generated_secret = secrets.token_hex(24)

    db_obj = WebhookEndpoint(
        url=str(endpoint_in.url),
        description=endpoint_in.description,
        event_types=endpoint_in.event_types,
        is_active=endpoint_in.is_active,
        secret=generated_secret
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{endpoint_id}", response_model=WebhookEndpoint)
def update_webhook_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    endpoint_id: int,
    endpoint_in: WebhookEndpointUpdate,
):
    """
    Update a webhook endpoint.
    """
    endpoint = crud_webhook.webhook_endpoint.get(db, id=endpoint_id)
    if not endpoint:
        raise HTTPException(status_code=404, detail="Webhook endpoint not found")
    endpoint = crud_webhook.webhook_endpoint.update(db, db_obj=endpoint, obj_in=endpoint_in)
    return endpoint

@router.delete("/{endpoint_id}", response_model=WebhookEndpoint)
def delete_webhook_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    endpoint_id: int,
):
    """
    Delete a webhook endpoint.
    """
    endpoint = crud_webhook.webhook_endpoint.get(db, id=endpoint_id)
    if not endpoint:
        raise HTTPException(status_code=404, detail="Webhook endpoint not found")
    endpoint = crud_webhook.webhook_endpoint.remove(db, id=endpoint_id)
    return endpoint

@router.get("/{endpoint_id}/deliveries", response_model=List[WebhookDelivery])
def read_endpoint_deliveries(
    *,
    db: Session = Depends(deps.get_db),
    endpoint_id: int,
    skip: int = 0,
    limit: int = 100
):
    """
    Get delivery logs for a specific endpoint
    """
    # Quick custom query for this kit
    from app.models.webhook import WebhookDelivery
    deliveries = db.query(WebhookDelivery).filter(
        WebhookDelivery.endpoint_id == endpoint_id
    ).order_by(WebhookDelivery.created_at.desc()).offset(skip).limit(limit).all()
    return deliveries
