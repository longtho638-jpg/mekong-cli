"""
Models module for backend request/response validation
"""

# Admin
from .admin import (
    AdminAuditLog,
    AdminUser,
    AdminUserUpdate,
    FeatureFlag,
    FeatureFlagCreate,
    FeatureFlagUpdate,
    SystemSetting,
    SystemSettingUpdate,
)
from .agency import Agency
from .agent import AgentResponse, AgentTask
from .agentops import OpsExecuteRequest, OpsExecuteResponse, OpsStatus
from .audit_log import AuditLog
from .client import Client
from .command import CommandRequest, CommandResponse

# Unified Models
from .enums import (
    ABTestStatus,
    AnalyticsEventType,
    ClientStatus,
    InvoiceStatus,
    ProjectStatus,
    TaskPriority,
    TaskStatus,
)
from .invoice import Invoice
from .landing_page import (
    ABTest,
    ABTestCreate,
    ABTestResponse,
    AnalyticsEvent,
    AnalyticsEventCreate,
    LandingPage,
    LandingPageCreate,
    LandingPageResponse,
    LandingPageUpdate,
)
from .project import Project
from .router import RouterRequest, RouterResponse
from .task import Task
from .vibe import VibeRequest, VibeResponse

__all__ = [
    # Core
    "AgentTask",
    "AgentResponse",
    "CommandRequest",
    "CommandResponse",
    "VibeRequest",
    "VibeResponse",
    "RouterRequest",
    "RouterResponse",
    "OpsStatus",
    "OpsExecuteRequest",
    "OpsExecuteResponse",
    # Unified
    "Invoice",
    "InvoiceStatus",
    "Task",
    "TaskStatus",
    "TaskPriority",
    "Project",
    "ProjectStatus",
    "Client",
    "ClientStatus",
    "Agency",
    # Affiliate
    "Affiliate",
    "AffiliateLink",
    "Conversion",
    "Payout",
    "AffiliateStatus",
    "PayoutStatus",
    "ConversionStatus",
    # Admin
    "FeatureFlag",
    "FeatureFlagCreate",
    "FeatureFlagUpdate",
    "SystemSetting",
    "SystemSettingUpdate",
    "AdminUser",
    "AdminUserUpdate",
    "AdminAuditLog",
    "AuditLog",
    # Landing Page
    "LandingPage",
    "LandingPageCreate",
    "LandingPageUpdate",
    "LandingPageResponse",
    "ABTest",
    "ABTestCreate",
    "ABTestResponse",
    "AnalyticsEvent",
    "AnalyticsEventCreate",
    "ABTestStatus",
    "AnalyticsEventType",
    # Rate Limiting
    "IpBlocklist",
    "RateLimitViolation",
]

from .rate_limit import IpBlocklist, RateLimitViolation
