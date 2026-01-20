"""
Verify Specialization Phase (Vertical Engines)
==============================================
Tests Healthcare, Fintech, and SaaS vertical engines.
"""
import os
import sys
from pathlib import Path

# Add project root to sys.path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from antigravity.core.verticals.auditor import VerticalAuditor
from antigravity.core.verticals.fintech import FintechEngine
from antigravity.core.verticals.healthcare import HealthcareEngine
from antigravity.core.verticals.saas import SaasEngine


def test_healthcare():
    print("🏥 Testing Healthcare Vertical...")
    engine = HealthcareEngine()
    
    # Valid config
    valid_config = {
        "encryption": {"at_rest": True, "in_transit": True},
        "authentication": {"mfa_enabled": True, "audit_logging": True},
        "features": {"telehealth": True},
        "telehealth_config": {"latency_ms": 150}
    }
    checks = engine.audit_compliance(valid_config)
    assert all(c.passed for c in checks), f"Valid healthcare config failed: {checks}"
    
    # Invalid config
    invalid_config = {
        "encryption": {"at_rest": False, "in_transit": True},
        "authentication": {"mfa_enabled": False, "audit_logging": True}
    }
    checks = engine.audit_compliance(invalid_config)
    failed_ids = [c.check_id for c in checks if not c.passed]
    assert "H-001" in failed_ids, "Should have failed encryption check"
    assert "H-003" in failed_ids, "Should have failed MFA check"
    print("   ✅ Healthcare Engine Verified.")

def test_fintech():
    print("💳 Testing Fintech Vertical...")
    engine = FintechEngine()
    
    # Valid config
    valid_config = {
        "data_handling": {"card_tokenization": True},
        "transactions": {"idempotency_keys": True},
        "fraud_detection": {"velocity_checks": True}
    }
    audits = engine.audit_security(valid_config)
    assert all(a.passed for a in audits), f"Valid fintech config failed: {audits}"
    
    # KYC check
    user_data = {"id_verification": True, "liveness_check": True}
    kyc_result = engine.validate_kyc_process(user_data, tier="tier1")
    assert kyc_result["success"] is True
    
    user_data_incomplete = {"id_verification": True}
    kyc_result_fail = engine.validate_kyc_process(user_data_incomplete, tier="tier1")
    assert kyc_result_fail["success"] is False
    print("   ✅ Fintech Engine Verified.")

def test_saas():
    print("☁️ Testing SaaS Vertical...")
    engine = SaasEngine()
    
    # Provisioning
    config = engine.provision_tenant("tenant-123", "growth")
    assert config.tenant_id == "tenant-123"
    assert "advanced" in config.feature_flags
    
    # Proration
    due = engine.calculate_proration(50.0, 100.0, 15)
    assert due == 25.0
    
    # Churn risk
    risk = engine.check_churn_risk({"logins_per_week": 0})
    assert risk == "CRITICAL"
    print("   ✅ SaaS Engine Verified.")

def test_auditor():
    print("🔍 Testing Vertical Auditor...")
    auditor = VerticalAuditor()
    
    # Healthcare Audit
    hc_config = {
        "encryption": {"at_rest": True, "in_transit": True},
        "authentication": {"mfa_enabled": True, "audit_logging": True}
    }
    res = auditor.audit_system("healthcare", hc_config)
    assert res["passed"] is True
    
    # Fintech Audit (Failing)
    ft_config = {"data_handling": {"card_tokenization": False}}
    res = auditor.audit_system("fintech", ft_config)
    assert res["passed"] is False
    print("   ✅ Vertical Auditor Verified.")

if __name__ == "__main__":
    try:
        test_healthcare()
        test_fintech()
        test_saas()
        test_auditor()
        print("\n🚀 ALL SPECIALIZATION VERIFICATIONS PASSED!")
    except Exception as e:
        print(f"\n❌ VERIFICATION FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
