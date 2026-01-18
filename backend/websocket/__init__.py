# WebSocket module for AntigravityKit
from .server import (
    ConnectionManager,
    EventType,
    emit_client_converted,
    emit_data_refresh,
    emit_invoice_paid,
    emit_lead_added,
    emit_lead_qualified,
    emit_vc_score_updated,
    manager,
)

__all__ = [
    "manager",
    "ConnectionManager",
    "EventType",
    "emit_lead_added",
    "emit_lead_qualified",
    "emit_client_converted",
    "emit_invoice_paid",
    "emit_vc_score_updated",
    "emit_data_refresh",
]
