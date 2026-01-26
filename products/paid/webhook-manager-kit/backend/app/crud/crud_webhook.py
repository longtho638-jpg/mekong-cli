from typing import List, Any
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.webhook import WebhookEndpoint, WebhookEvent, WebhookDelivery
from app.schemas.webhook import WebhookEndpointCreate, WebhookEndpointUpdate, WebhookEventCreate

class CRUDWebhookEndpoint(CRUDBase[WebhookEndpoint, WebhookEndpointCreate, WebhookEndpointUpdate]):
    def get_by_event_type(self, db: Session, event_type: str) -> List[WebhookEndpoint]:
        # SQLite doesn't have robust JSON querying, so we fetch all and filter in python for this MVP kit
        # In a real postgres prod env, we'd use JSONB operators
        all_endpoints = db.query(self.model).filter(self.model.is_active == True).all()
        matching_endpoints = []
        for endpoint in all_endpoints:
            if event_type in endpoint.event_types or "*" in endpoint.event_types:
                matching_endpoints.append(endpoint)
        return matching_endpoints

class CRUDWebhookEvent(CRUDBase[WebhookEvent, WebhookEventCreate, WebhookEventCreate]):
    pass

class CRUDWebhookDelivery(CRUDBase[WebhookDelivery, Any, Any]):
    def get_failed_retriable(self, db: Session) -> List[WebhookDelivery]:
        from datetime import datetime
        return db.query(self.model).filter(
            self.model.success == False,
            self.model.next_retry_at <= datetime.utcnow(),
            self.model.next_retry_at != None
        ).all()

webhook_endpoint = CRUDWebhookEndpoint(WebhookEndpoint)
webhook_event = CRUDWebhookEvent(WebhookEvent)
webhook_delivery = CRUDWebhookDelivery(WebhookDelivery)
