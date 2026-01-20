"""
Vertical Auditor
================
Centralized compliance and security auditor for all verticals.
"""
import logging
from typing import Any, Dict, List, Union

from .fintech import FintechEngine, SecurityAudit
from .healthcare import ComplianceCheck, HealthcareEngine
from .saas import SaasEngine

logger = logging.getLogger(__name__)

class VerticalAuditor:
    """Orchestrates audits across specific verticals."""

    def __init__(self):
        self.healthcare = HealthcareEngine()
        self.fintech = FintechEngine()
        self.saas = SaasEngine()

    def audit_system(self, vertical: str, system_config: Dict[str, Any]) -> Dict[str, Any]:
        """Run a comprehensive audit for a specific vertical."""
        vertical = vertical.lower()
        results = {
            "vertical": vertical,
            "timestamp": "2026-01-20T23:45:00Z",
            "passed": False,
            "checks": []
        }

        if vertical == "healthcare":
            checks: List[ComplianceCheck] = self.healthcare.audit_compliance(system_config)
            results["checks"] = [
                {"id": c.check_id, "name": c.name, "passed": c.passed, "details": c.details}
                for c in checks
            ]
            results["passed"] = all(c.passed for c in checks)

        elif vertical == "fintech":
            audits: List[SecurityAudit] = self.fintech.audit_security(system_config)
            results["checks"] = [
                {"id": a.check_id, "severity": a.severity, "passed": a.passed, "remediation": a.remediation}
                for a in audits
            ]
            results["passed"] = all(a.passed for a in audits)

        elif vertical == "saas":
            # SaaS 'audit' is more about configuration validity
            risk = self.saas.check_churn_risk(system_config.get("metrics", {}))
            results["checks"] = [{"id": "S-001", "name": "Churn Risk Assessment", "passed": True, "details": f"Risk Level: {risk}"}]
            results["passed"] = True

        else:
            results["error"] = f"Unknown vertical: {vertical}"

        logger.info(f"Audit completed for {vertical}: {'PASSED' if results['passed'] else 'FAILED'}")
        return results
