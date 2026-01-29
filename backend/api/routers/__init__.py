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
    analytics_realtime,  # Added
    audit,
    backup,
    binh_phap,
    campaigns,
    chatbot,  # Added
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
    llm,  # Added
    monitor,
    notification_preferences,
    notification_templates,
    notifications,
    ops,
    payments,
    paypal_webhooks,
    prompts,  # Added
    push_subscriptions,
    rate_limits,
    router,
    scheduler,
    search,  # Added
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
    "analytics_realtime",  # Added
    "campaigns",
    "chatbot",  # Added
    "commands",
    "crm",
    "franchise",
    "hr",
    "i18n",
    "inventory",
    "jobs",  # Added
    "payments",
    "router",
    "scheduler",
    "search",  # Added
    "stripe_production",
    "vibes",
    "vietnam",
    "license_production",
    "llm",
    "monitor",
    "workflow",
    "agents_creator",
    "swarm",
    "audit",
    "backup",
    "paypal_webhooks",
    "stripe_webhooks",
    "gumroad_webhooks",
    "prompts",  # Added
    "kanban",
    "ops",
    "webhook_health",  # Added
    "rate_limits",
    "binh_phap",
    "dlq",  # Added
    "user_preferences",  # Added
    "exports",  # Added
    "notifications",
    "notification_preferences",
    "notification_templates",
    "push_subscriptions",
]
