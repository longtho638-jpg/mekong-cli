"""
Prometheus Metrics Facade and Middleware Setup.
"""

import time

from fastapi import FastAPI, Request
from fastapi.responses import Response as FastAPIResponse
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from .collector import MetricsCollector

metrics = MetricsCollector()


async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    metrics.record_request(request, response, time.time() - start_time)
    return response


async def get_metrics():
    metrics.update_system_metrics()
    return FastAPIResponse(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


def setup_metrics(app: FastAPI):
    app.middleware("http")(metrics_middleware)
    app.add_route("/metrics", get_metrics)


def record_gumroad_purchase(product_name: str, tenant_id: str = "default"):
    metrics.record_purchase(product_name, tenant_id)


def record_user_registration(source: str = "direct", tenant_id: str = "default"):
    metrics.record_user_registration(source, tenant_id)


def record_license_validation(result: str, tenant_id: str = "default"):
    metrics.record_license_validation(result, tenant_id)


def update_tenant_count(count: int):
    metrics.update_tenant_metrics(count)


__all__ = [
    "setup_metrics",
    "record_gumroad_purchase",
    "record_user_registration",
    "record_license_validation",
    "update_tenant_count",
]
