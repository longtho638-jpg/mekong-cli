"""
⚡ Data Automation Specialist - Smart Data Ops (Proxy)
================================================
This file is now a proxy for the modularized version in ./automation/
Please import from core.utils.automation instead.
"""
import warnings

from .automation import (
    AutomationWorkflow,
    DataAutomationSpecialist,
    DataImport,
    DataSource,
    IntegrationSync,
    TriggerType,
    WorkflowStatus,
)

# Issue a deprecation warning
warnings.warn(
    "core.utils.data_automation is deprecated. "
    "Use core.utils.automation instead.",
    DeprecationWarning,
    stacklevel=2
)
