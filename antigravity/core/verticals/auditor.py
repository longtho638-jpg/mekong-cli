"""
Vertical Auditor
================
Centralized compliance and security auditor for all verticals.
"""
import logging
from typing import Any, Dict, List, TypedDict, Union

from .fintech import FintechEngine, FintechSystemConfig, SecurityAudit
from .healthcare import ComplianceCheck, HealthcareEngine, HealthcareSystemConfig
from .saas import SaasEngine, SaasUsageMetrics

logger = logging.getLogger(__name__)


class AuditCheckResult(TypedDict, total=False):
    id: str
    name: str
    passed: bool
    details: str
    severity: str
    remediation: str


class AuditResults(TypedDict, total=False):
    vertical: str
    timestamp: str
    passed: bool
    checks: List[AuditCheckResult]
    error: str


class VerticalAuditor:
    """Orchestrates audits across specific verticals."""

    def __init__(self):
        self.healthcare = HealthcareEngine()
        self.fintech = FintechEngine()
        self.saas = SaasEngine()

    def audit_system(
        self,
        vertical: str,
        system_config: Union[HealthcareSystemConfig, FintechSystemConfig, Dict[str, Any]]
    ) -> AuditResults:
        """Run a comprehensive audit for a specific vertical."""
        vertical = vertical.lower()
        results: AuditResults = {
            "vertical": vertical,
            "timestamp": "2026-01-20T23:45:00Z",
            "passed": False,
            "checks": []
        }

        if vertical == "healthcare":
            # Cast for type safety as we know vertical type here
            hc_config = system_config # type: ignore
            checks: List[ComplianceCheck] = self.healthcare.audit_compliance(hc_config)
            results["checks"] = [
                {"id": c.check_id, "name": c.name, "passed": c.passed, "details": c.details}
                for c in checks
            ]
            results["passed"] = all(c.passed for c in checks)

        elif vertical == "fintech":
            ft_config = system_config # type: ignore
            audits: List[SecurityAudit] = self.fintech.audit_security(ft_config)
            results["checks"] = [
                {"id": a.check_id, "severity": a.severity, "passed": a.passed, "remediation": a.remediation}
                for a in audits
            ]
            results["passed"] = all(a.passed for a in audits)

        elif vertical == "saas":
            # SaaS 'audit' is more about configuration validity
            saas_metrics: SaasUsageMetrics = system_config.get("metrics", {}) # type: ignore
            risk = self.saas.check_churn_risk(saas_metrics)
            results["checks"] = [{"id": "S-001", "name": "Churn Risk Assessment", "passed": True, "details": f"Risk Level: {risk}"}]
            results["passed"] = True

        else:
            results["error"] = f"Unknown vertical: {vertical}"

        logger.info(f"Audit completed for {vertical}: {'PASSED' if results['passed'] else 'FAILED'}")
        return results
