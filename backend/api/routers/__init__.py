"""
AgencyOS API Routers Package
============================
Tất cả routers cho backend API.
"""

from . import (
    accounting,
    agents,
    agents_creator,
    analytics,
    audit,
    backup,
    campaigns,
    commands,
    crm,
    dlq,  # Added
    exports,  # Added
    franchise,
    gumroad_webhooks,
    hr,
    i18n,
    inventory,
    jobs,  # Added
    kanban,
    license_production,
    monitor,
    ops,
    payments,
    paypal_webhooks,
    router,
    sales,
    scheduler,
    search, # Added
    stripe_production,
    stripe_webhooks,
    swarm,
    user_preferences,  # Added
    vibes,
    vietnam,
    webhook_health,  # Added
    workflow,
)

__all__ = [
    "accounting",
    "agents",
    "analytics",
    "campaigns",
    "commands",
    "crm",
    "franchise",
    "hr",
    "i18n",
    "inventory",
    "jobs", # Added
    "payments",
    "router",
    "sales",
    "scheduler",
    "search", # Added
    "stripe_production",
    "vibes",
    "vietnam",
    "license_production",
    "monitor",
    "workflow",
    "agents_creator",
    "swarm",
    "audit",
    "backup",
    "paypal_webhooks",
    "stripe_webhooks",
    "gumroad_webhooks",
    "kanban",
    "ops",
    "webhook_health", # Added
    "dlq", # Added
    "user_preferences", # Added
    "exports", # Added
]
