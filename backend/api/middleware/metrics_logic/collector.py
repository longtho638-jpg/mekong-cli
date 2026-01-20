"""
Metrics Collector core logic.
"""
import logging
import time

from fastapi import Request, Response

from backend.api.utils.endpoint_categorization import extract_endpoint_name

from .models import (
    active_tenants,
    cpu_usage,
    gumroad_purchases_total,
    http_request_duration,
    http_requests_total,
    license_validations_total,
    memory_usage,
    tenant_requests_total,
    user_registrations_total,
)

logger = logging.getLogger(__name__)

class MetricsCollector:
    def __init__(self):
        self.start_time = time.time()

    def record_request(self, request: Request, response: Response, duration: float):
        method = request.method
        endpoint = extract_endpoint_name(request.url.path)
        status_code = str(response.status_code)
        tenant_id = getattr(request.state, "tenant", {"tenant_id": "unknown"}).tenant_id

        http_requests_total.labels(method=method, endpoint=endpoint, status_code=status_code, tenant_id=tenant_id).inc()
        http_request_duration.labels(method=method, endpoint=endpoint, tenant_id=tenant_id).observe(duration)
        tenant_requests_total.labels(tenant_id=tenant_id, plan="unknown").inc()

    def record_purchase(self, product_name: str, tenant_id: str):
        gumroad_purchases_total.labels(product_name=product_name, tenant_id=tenant_id).inc()

    def record_user_registration(self, source: str, tenant_id: str):
        user_registrations_total.labels(source=source, tenant_id=tenant_id).inc()

    def record_license_validation(self, result: str, tenant_id: str):
        license_validations_total.labels(result=result, tenant_id=tenant_id).inc()

    def update_system_metrics(self):
        try:
            import psutil
            cpu_usage.set(psutil.cpu_percent())
            memory_usage.set(psutil.virtual_memory().used)
        except ImportError: pass

    def update_tenant_metrics(self, tenant_count: int):
        active_tenants.set(tenant_count)
