"""
Metrics Collector models and global counters.
"""
from prometheus_client import Counter, Gauge, Histogram

from backend.api.config.settings import settings

# HTTP Metrics
http_requests_total = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status_code", "tenant_id"]
)

http_request_duration = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint", "tenant_id"],
    buckets=settings.metrics_buckets,
)

# Tenant Metrics
active_tenants = Gauge("active_tenants_total", "Number of active tenants")
tenant_requests_total = Counter(
    "tenant_requests_total", "Total requests per tenant", ["tenant_id", "plan"]
)

# Business Metrics
gumroad_purchases_total = Counter(
    "gumroad_purchases_total", "Total Gumroad purchases", ["product_name", "tenant_id"]
)
user_registrations_total = Counter(
    "user_registrations_total", "Total user registrations", ["source", "tenant_id"]
)
license_validations_total = Counter(
    "license_validations_total", "Total license validations", ["result", "tenant_id"]
)

# System Metrics
cpu_usage = Gauge("cpu_usage_percent", "CPU usage percentage")
memory_usage = Gauge("memory_usage_bytes", "Memory usage in bytes")
database_connections = Gauge(
    "database_connections_active", "Active database connections", ["tenant_id"]
)
