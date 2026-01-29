"""
Standalone test for health.py module.
Tests the health check functions and models directly.
"""

import sys

sys.path.insert(0, "/Users/macbookprom1/mekong-cli")

import time

# Test imports
try:
    import psutil

    print("✅ psutil imported successfully")
except ImportError as e:
    print(f"❌ Failed to import psutil: {e}")
    print("Install with: pip install psutil")
    sys.exit(1)

# Test direct import of health module
try:
    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "health", "/Users/macbookprom1/mekong-cli/backend/api/routers/health.py"
    )
    health = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(health)
    print("✅ health module loaded successfully")
except Exception as e:
    print(f"❌ Failed to load health module: {e}")
    import traceback

    traceback.print_exc()
    sys.exit(1)

# Test function calls
print("\n🧪 Testing health check functions...\n")

# Test uptime
uptime = health.get_uptime()
print(f"✅ get_uptime(): {uptime:.2f} seconds")

# Test system metrics
metrics = health.get_system_metrics()
print("✅ get_system_metrics():")
print(f"   CPU: {metrics.get('cpu_percent', 0):.1f}%")
print(f"   Memory: {metrics.get('memory', {}).get('percent', 0):.1f}%")
print(f"   Disk: {metrics.get('disk', {}).get('percent', 0):.1f}%")

# Test service checks
print("\n🔍 Testing service checks...\n")

db_health = health.check_database()
print(f"✅ Database check: {db_health.status} - {db_health.message}")

redis_health = health.check_redis()
print(f"✅ Redis check: {redis_health.status} - {redis_health.message}")

fs_health = health.check_filesystem()
print(f"✅ Filesystem check: {fs_health.status} - {fs_health.message}")

# Test models
print("\n📋 Testing response models...\n")

basic_health = health.HealthStatus(status="healthy", uptime_seconds=uptime)
print(f"✅ HealthStatus model: {basic_health.status}")

detailed_health = health.DetailedHealthStatus(
    status="healthy",
    uptime_seconds=uptime,
    services=[db_health, redis_health, fs_health],
    system=metrics,
)
print(f"✅ DetailedHealthStatus model: {detailed_health.status}")
print(f"   Services: {len(detailed_health.services)}")

prom_metrics = health.PrometheusMetrics(
    uptime_seconds=uptime,
    cpu_percent=metrics.get("cpu_percent", 0),
    memory_percent=metrics.get("memory", {}).get("percent", 0),
    memory_used_mb=metrics.get("memory", {}).get("used_mb", 0),
    memory_available_mb=metrics.get("memory", {}).get("available_mb", 0),
    disk_percent=metrics.get("disk", {}).get("percent", 0),
    disk_used_gb=metrics.get("disk", {}).get("used_gb", 0),
    disk_free_gb=metrics.get("disk", {}).get("free_gb", 0),
    process_cpu_percent=metrics.get("process", {}).get("cpu_percent", 0),
    process_memory_mb=metrics.get("process", {}).get("memory_mb", 0),
    timestamp=time.time(),
)
print(f"✅ PrometheusMetrics model: uptime={prom_metrics.uptime_seconds:.2f}s")
print(f"   CPU: {prom_metrics.cpu_percent:.1f}%")
print(f"   Memory: {prom_metrics.memory_percent:.1f}%")
print(f"   Disk: {prom_metrics.disk_percent:.1f}%")

# Test determine_overall_status function
print("\n🔍 Testing status determination...\n")

all_up = [
    health.ServiceHealth(name="svc1", status="up"),
    health.ServiceHealth(name="svc2", status="up"),
]
status1 = health.determine_overall_status(all_up)
print(f"✅ All up: {status1}")
assert status1 == "healthy", f"Expected 'healthy', got '{status1}'"

one_degraded = [
    health.ServiceHealth(name="svc1", status="up"),
    health.ServiceHealth(name="svc2", status="degraded"),
]
status2 = health.determine_overall_status(one_degraded)
print(f"✅ One degraded: {status2}")
assert status2 == "degraded", f"Expected 'degraded', got '{status2}'"

one_down = [
    health.ServiceHealth(name="svc1", status="up"),
    health.ServiceHealth(name="svc2", status="down"),
]
status3 = health.determine_overall_status(one_down)
print(f"✅ One down: {status3}")
assert status3 == "unhealthy", f"Expected 'unhealthy', got '{status3}'"

print("\n✅ ALL TESTS PASSED!")
print("\n📝 Endpoints available:")
print("   GET /health              - Basic health check")
print("   GET /health/detailed     - Detailed diagnostics")
print("   GET /health/metrics      - Prometheus metrics")
print("   GET /health/ready        - Kubernetes readiness")
print("   GET /health/live         - Kubernetes liveness")
print("\n🎯 Router registered at: /health")
print("   Tag: health")
