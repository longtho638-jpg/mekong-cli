
import pytest
import time
from antigravity.core.code_guardian.guardian import CodeGuardian, get_guardian, guarded
from antigravity.core.code_guardian.models import ThreatLevel, GuardianAction

@pytest.fixture
def guardian():
    # Reset singleton for testing if needed, or just create a new instance
    return CodeGuardian(enable_auto_rollback=False)

def test_security_scanning(guardian):
    # SQL Injection
    code_sql = "SELECT * FROM users WHERE id = '" + "1' OR '1'='1" + "'"
    threats = guardian.scan_code(code_sql, source="test_sql")
    assert len(threats) > 0
    assert any(t.type == "sql_injection" for t in threats)
    assert any(t.level == ThreatLevel.CRITICAL for t in threats)

    # Safe code
    code_safe = "print('Hello world')"
    threats = guardian.scan_code(code_safe, source="test_safe")
    assert len(threats) == 0

def test_performance_monitoring(guardian):
    # Establish baseline
    guardian.monitor_metric("response_time", 0.1)
    guardian.monitor_metric("response_time", 0.1)

    # Normal variation
    anomaly = guardian.monitor_metric("response_time", 0.12)
    assert anomaly is None

    # Anomaly (3x baseline)
    anomaly = guardian.monitor_metric("response_time", 0.5)
    assert anomaly is not None
    assert anomaly.metric == "response_time"
    assert anomaly.deviation_percent > 100

def test_rollback_points(guardian, tmp_path):
    # Create a dummy file
    f = tmp_path / "test.txt"
    f.write_text("v1")

    # Create rollback point
    rp_id = guardian.create_rollback_point("v1_point", files=[str(f)])
    assert rp_id is not None

    # Verify it exists in guardian
    assert any(rp.id == rp_id for rp in guardian.rollback_points)

    # Test rollback (simulated in current impl, returns True)
    success = guardian.rollback_to(rp_id)
    assert success is True

def test_guarded_decorator():
    # We need to make sure get_guardian returns a valid instance
    # The decorator uses the global instance

    @guarded(name="test_func")
    def slow_function():
        time.sleep(0.01)
        return "done"

    result = slow_function()
    assert result == "done"

    # Check if metric was recorded
    g = get_guardian()
    # We can't easily check internal baselines without access to private members
    # but we can check if it runs without error
    assert "test_func_execution_time" in g.monitor._baselines
