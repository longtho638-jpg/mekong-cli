"""
AgencyOS API Routers Package
============================
Tất cả routers cho backend API.
"""

from . import (
    agents,
    campaigns,
    commands,
    crm,
    franchise,
    i18n,
    payments,
    router,
    scheduler,
    vibes,
    vietnam,
    monitor,
    workflow,
    agents_creator,
    swarm,
    audit,
    paypal_webhooks,
    stripe_webhooks,
    gumroad_webhooks,
    kanban,
)

__all__ = [
    "agents",
    "campaigns",
    "commands",
    "crm",
    "franchise",
    "i18n",
    "payments",
    "router",
    "scheduler",
    "vibes",
    "vietnam",
    "monitor",
    "workflow",
    "agents_creator",
    "swarm",
    "audit",
    "paypal_webhooks",
    "stripe_webhooks",
    "gumroad_webhooks",
    "kanban",
]
