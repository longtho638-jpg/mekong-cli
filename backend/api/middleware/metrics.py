"""
Prometheus Metrics for Agency OS
================================

Collection of application metrics for monitoring.
Includes HTTP requests, tenant usage, and business metrics.
"""

import time
from typing import Dict, Counter, Histogram, Gauge
from prometheus_client import Counter as PromCounter, Histogram as PromHistogram, Gauge as PromGauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Request, Response
from fastapi.responses import Response as FastAPIResponse
import logging

logger = logging.getLogger(__name__)

# HTTP Metrics
http_requests_total = PromCounter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code', 'tenant_id']
)

http_request_duration = PromHistogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint', 'tenant_id'],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

# Tenant Metrics
active_tenants = PromGauge(
    'active_tenants_total',
    'Number of active tenants'
)

tenant_requests_total = PromCounter(
    'tenant_requests_total',
    'Total requests per tenant',
    ['tenant_id', 'plan']
)

# Business Metrics
gumroad_purchases_total = PromCounter(
    'gumroad_purchases_total',
    'Total Gumroad purchases',
    ['product_name', 'tenant_id']
)

user_registrations_total = PromCounter(
    'user_registrations_total',
    'Total user registrations',
    ['source', 'tenant_id']
)

license_validations_total = PromCounter(
    'license_validations_total',
    'Total license validations',
    ['result', 'tenant_id']
)

# System Metrics
cpu_usage = PromGauge(
    'cpu_usage_percent',
    'CPU usage percentage'
)

memory_usage = PromGauge(
    'memory_usage_bytes',
    'Memory usage in bytes'
)

database_connections = PromGauge(
    'database_connections_active',
    'Active database connections',
    ['tenant_id']
)

class MetricsCollector:
    """Collect and update application metrics."""
    
    def __init__(self):
        self.start_time = time.time()
        
    def record_request(self, request: Request, response: Response, duration: float):
        """Record HTTP request metrics."""
        method = request.method
        endpoint = self._extract_endpoint(request)
        status_code = str(response.status_code)
        tenant_id = getattr(request.state, 'tenant', {'tenant_id': 'unknown'}).tenant_id
        
        # Update counters and histograms
        http_requests_total.labels(
            method=method,
            endpoint=endpoint,
            status_code=status_code,
            tenant_id=tenant_id
        ).inc()
        
        http_request_duration.labels(
            method=method,
            endpoint=endpoint,
            tenant_id=tenant_id
        ).observe(duration)
        
        # Update tenant-specific metrics
        tenant_requests_total.labels(tenant_id=tenant_id, plan='unknown').inc()
        
    def record_purchase(self, product_name: str, tenant_id: str):
        """Record Gumroad purchase."""
        gumroad_purchases_total.labels(
            product_name=product_name,
            tenant_id=tenant_id
        ).inc()
        logger.info(f"Recorded purchase: {product_name} for tenant {tenant_id}")
        
    def record_user_registration(self, source: str, tenant_id: str):
        """Record user registration."""
        user_registrations_total.labels(
            source=source,
            tenant_id=tenant_id
        ).inc()
        logger.info(f"Recorded registration from {source} for tenant {tenant_id}")
        
    def record_license_validation(self, result: str, tenant_id: str):
        """Record license validation."""
        license_validations_total.labels(
            result=result,
            tenant_id=tenant_id
        ).inc()
        
    def update_system_metrics(self):
        """Update system resource metrics."""
        try:
            import psutil
            
            # CPU usage
            cpu_usage.set(psutil.cpu_percent())
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_usage.set(memory.used)
            
            logger.debug("Updated system metrics")
            
        except ImportError:
            logger.warning("psutil not available, system metrics disabled")
        except Exception as e:
            logger.error(f"Error updating system metrics: {e}")
            
    def update_tenant_metrics(self, tenant_count: int):
        """Update tenant metrics."""
        active_tenants.set(tenant_count)
        
    def _extract_endpoint(self, request: Request) -> str:
        """Extract endpoint from request path."""
        path = request.url.path
        
        # Clean up path for metrics
        if "?" in path:
            path = path.split("?")[0]
            
        # Replace IDs with placeholders
        parts = path.split("/")
        for i, part in enumerate(parts):
            if part.isdigit() or "-" in part and len(part) > 10:
                parts[i] = "{id}"
                
        return "/".join(parts)

# Global metrics collector
metrics = MetricsCollector()

# Metrics middleware
async def metrics_middleware(request: Request, call_next):
    """Middleware to collect HTTP metrics."""
    start_time = time.time()
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Record metrics
    metrics.record_request(request, response, duration)
    
    return response

# Metrics endpoint
async def get_metrics():
    """Prometheus metrics endpoint."""
    # Update system metrics before serving
    metrics.update_system_metrics()
    
    # Generate latest metrics
    metrics_data = generate_latest()
    
    return FastAPIResponse(
        content=metrics_data,
        media_type=CONTENT_TYPE_LATEST
    )

# Metrics status endpoint
async def get_metrics_status():
    """Get metrics collection status."""
    return {
        "status": "active",
        "uptime_seconds": int(time.time() - metrics.start_time),
        "metrics": {
            "http_requests_total": http_requests_total._value.get(),
            "active_tenants": active_tenants._value.get(),
            "system_metrics_enabled": True
        }
    }

def setup_metrics(app: FastAPI):
    """Setup metrics collection for FastAPI app."""
    
    # Add middleware
    app.middleware("http")(metrics_middleware)
    
    # Add endpoints
    app.add_route("/metrics", get_metrics)
    app.add_route("/metrics/status", get_metrics_status)
    
    logger.info("Prometheus metrics configured")

# Business metric helper functions
def record_gumroad_purchase(product_name: str, tenant_id: str = "default"):
    """Record Gumroad purchase (for webhook handlers)."""
    metrics.record_purchase(product_name, tenant_id)

def record_user_registration(source: str = "direct", tenant_id: str = "default"):
    """Record user registration."""
    metrics.record_user_registration(source, tenant_id)

def record_license_validation(result: str, tenant_id: str = "default"):
    """Record license validation result."""
    metrics.record_license_validation(result, tenant_id)

def update_tenant_count(count: int):
    """Update active tenant count."""
    metrics.update_tenant_metrics(count)

# Export metrics functions
__all__ = [
    "setup_metrics",
    "record_gumroad_purchase", 
    "record_user_registration",
    "record_license_validation",
    "update_tenant_count"
]