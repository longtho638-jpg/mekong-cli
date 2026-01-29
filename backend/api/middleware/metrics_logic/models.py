"""
Metrics Collector models and global counters.
"""

from prometheus_client import REGISTRY, Counter, Gauge, Histogram

from backend.api.config.settings import settings


def get_or_create_metric(metric_class, name, documentation, labels=None, **kwargs):
    """
    Get an existing metric from the registry or create a new one.
    This prevents 'ValueError: Duplicated timeseries' errors during tests/reloads.
    """
    # Check if metric already exists in registry
    if name in REGISTRY._names_to_collectors:
        collector = REGISTRY._names_to_collectors[name]
        # Verify it's the correct type (optional but good for safety)
        if not isinstance(collector, metric_class):
            # If types mismatch, we might have a collision with a different metric type.
            # In that case, we can't do much but let it fail or log a warning.
            pass
        return collector

    # If not exists, create it
    if labels:
        return metric_class(name, documentation, labels, **kwargs)
    return metric_class(name, documentation, **kwargs)


# HTTP Metrics
http_requests_total = get_or_create_metric(
    Counter,
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code", "tenant_id"],
)

http_request_duration = get_or_create_metric(
    Histogram,
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint", "tenant_id"],
    buckets=settings.metrics_buckets,
)

# Tenant Metrics
active_tenants = get_or_create_metric(Gauge, "active_tenants_total", "Number of active tenants")

tenant_requests_total = get_or_create_metric(
    Counter, "tenant_requests_total", "Total requests per tenant", ["tenant_id", "plan"]
)

# Business Metrics
gumroad_purchases_total = get_or_create_metric(
    Counter, "gumroad_purchases_total", "Total Gumroad purchases", ["product_name", "tenant_id"]
)

user_registrations_total = get_or_create_metric(
    Counter, "user_registrations_total", "Total user registrations", ["source", "tenant_id"]
)

license_validations_total = get_or_create_metric(
    Counter, "license_validations_total", "Total license validations", ["result", "tenant_id"]
)

# System Metrics
cpu_usage = get_or_create_metric(Gauge, "cpu_usage_percent", "CPU usage percentage")

memory_usage = get_or_create_metric(Gauge, "memory_usage_bytes", "Memory usage in bytes")

database_connections = get_or_create_metric(
    Gauge, "database_connections_active", "Active database connections", ["tenant_id"]
)
