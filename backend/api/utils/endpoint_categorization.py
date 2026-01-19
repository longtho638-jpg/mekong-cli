"""
Unified Endpoint Categorization Logic
======================================

Shared logic for categorizing API endpoints.
Used by metrics.py and rate_limiting.py to avoid duplication.

Binh Pháp: "Nhất Dụng" - Single Source of Truth
"""

import re
from enum import Enum
from typing import Optional


class EndpointCategory(Enum):
    """Endpoint categories for metrics and rate limiting."""

    AUTH = "auth"
    AGENT = "agent"
    VIBE = "vibe"
    WEBHOOK = "webhook"
    HEALTH = "health"
    DOCS = "docs"
    STATIC = "static"
    API = "api"
    CODE = "code"
    CRM = "crm"
    FRANCHISE = "franchise"
    SCHEDULER = "scheduler"
    I18N = "i18n"
    VIETNAM = "vietnam"
    DASHBOARD = "dashboard"
    BACKEND = "backend"


def categorize_endpoint(path: str, method: str = "GET") -> EndpointCategory:
    """
    Unified endpoint categorization logic.

    Used by metrics.py and rate_limiting.py to ensure consistency.

    Args:
        path: Request path (e.g., "/api/auth/login")
        method: HTTP method (e.g., "GET", "POST")

    Returns:
        EndpointCategory enum value

    Examples:
        >>> categorize_endpoint("/health", "GET")
        EndpointCategory.HEALTH
        >>> categorize_endpoint("/api/auth/login", "POST")
        EndpointCategory.AUTH
        >>> categorize_endpoint("/api/vibe/execute", "POST")
        EndpointCategory.VIBE
    """
    # Normalize path
    path = path.lower().strip("/")

    # Exact matches for health/status endpoints
    if path in ["health", "ping", "ready", "healthz", "livez"]:
        return EndpointCategory.HEALTH

    # Documentation endpoints
    if path.startswith("docs") or path.startswith("redoc") or path == "openapi.json":
        return EndpointCategory.DOCS

    # Static files
    if path.startswith("static") or path.startswith("assets"):
        return EndpointCategory.STATIC

    # Prefix-based matching (order matters - most specific first)
    if path.startswith("api/auth") or path.startswith("auth"):
        return EndpointCategory.AUTH

    if path.startswith("api/webhooks") or path.startswith("webhooks"):
        return EndpointCategory.WEBHOOK

    if path.startswith("api/code") or path.startswith("code"):
        return EndpointCategory.CODE

    if path.startswith("api/vibe/agent") or path.startswith("vibe/agent") or path.startswith("api/agents"):
        return EndpointCategory.AGENT

    if path.startswith("api/vibe") or path.startswith("vibe"):
        return EndpointCategory.VIBE

    if path.startswith("api/crm") or path.startswith("crm"):
        return EndpointCategory.CRM

    if path.startswith("api/franchise") or path.startswith("franchise"):
        return EndpointCategory.FRANCHISE

    if path.startswith("api/scheduler") or path.startswith("scheduler"):
        return EndpointCategory.SCHEDULER

    if path.startswith("api/i18n") or path.startswith("i18n"):
        return EndpointCategory.I18N

    if path.startswith("api/vietnam") or path.startswith("vietnam"):
        return EndpointCategory.VIETNAM

    if path.startswith("api/dashboard") or path.startswith("dashboard"):
        return EndpointCategory.DASHBOARD

    if path.startswith("backend"):
        return EndpointCategory.BACKEND

    # Default: treat as generic API
    return EndpointCategory.API


def extract_endpoint_name(path: str) -> str:
    """
    Extract clean endpoint name for metrics.

    Removes IDs, UUIDs, and query parameters to create consistent labels.

    Args:
        path: Request path (e.g., "/api/users/123/posts?page=1")

    Returns:
        Cleaned path (e.g., "/api/users/{id}/posts")

    Examples:
        >>> extract_endpoint_name("/api/users/123/posts")
        '/api/users/{id}/posts'
        >>> extract_endpoint_name("/api/orders/abc-def-123-456")
        '/api/orders/{id}'
        >>> extract_endpoint_name("/api/items?page=1&limit=10")
        '/api/items'
    """
    # Remove query parameters
    path = path.split("?")[0]

    # Replace numeric IDs with placeholder
    path = re.sub(r"/\d+", "/{id}", path)

    # Replace UUIDs (hex patterns with dashes) with placeholder
    path = re.sub(r"/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", "/{id}", path)

    # Replace long hex strings (potential IDs) with placeholder
    path = re.sub(r"/[0-9a-f]{32,}", "/{id}", path)

    # Replace email-like patterns in path
    path = re.sub(r"/[^/]+@[^/]+\.[^/]+", "/{email}", path)

    return path


def should_skip_rate_limit(category: EndpointCategory) -> bool:
    """
    Determine if endpoint should skip rate limiting.

    Args:
        category: Endpoint category

    Returns:
        True if rate limiting should be skipped
    """
    # Health checks and docs don't need rate limiting
    return category in [EndpointCategory.HEALTH, EndpointCategory.DOCS, EndpointCategory.STATIC]


def get_rate_limit_key(category: EndpointCategory) -> str:
    """
    Get rate limit key for endpoint category.

    Maps categories to config keys used in settings.rate_limits_by_plan.

    Args:
        category: Endpoint category

    Returns:
        Rate limit key ("default", "api", "webhooks", "code")
    """
    # Map categories to rate limit keys
    if category == EndpointCategory.WEBHOOK:
        return "webhooks"
    elif category == EndpointCategory.CODE:
        return "code"
    elif category in [EndpointCategory.API, EndpointCategory.AUTH, EndpointCategory.VIBE,
                      EndpointCategory.AGENT, EndpointCategory.CRM, EndpointCategory.FRANCHISE,
                      EndpointCategory.SCHEDULER, EndpointCategory.I18N, EndpointCategory.VIETNAM,
                      EndpointCategory.DASHBOARD, EndpointCategory.BACKEND]:
        return "api"
    else:
        return "default"
