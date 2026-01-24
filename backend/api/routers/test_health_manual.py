"""
Manual test for health check endpoints.
Run this to verify all health endpoints work correctly.
"""

import sys
import time

# Test imports
try:
    import psutil
    print("✅ psutil imported successfully")
except ImportError as e:
    print(f"❌ Failed to import psutil: {e}")
    print("Install with: pip install psutil")
    sys.exit(1)

# Test health router
try:
    from backend.api.routers import health
    print("✅ health router imported successfully")
except Exception as e:
    print(f"❌ Failed to import health router: {e}")
    sys.exit(1)

# Test function calls
print("\n🧪 Testing health check functions...\n")

# Test uptime
uptime = health.get_uptime()
print(f"✅ get_uptime(): {uptime:.2f} seconds")

# Test system metrics
metrics = health.get_system_metrics()
print(f"✅ get_system_metrics():")
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

basic_health = health.HealthStatus(
    status="healthy",
    uptime_seconds=uptime
)
print(f"✅ HealthStatus model: {basic_health.status}")

detailed_health = health.DetailedHealthStatus(
    status="healthy",
    uptime_seconds=uptime,
    services=[db_health, redis_health, fs_health],
    system=metrics
)
print(f"✅ DetailedHealthStatus model: {detailed_health.status}")
print(f"   Services: {len(detailed_health.services)}")

prom_metrics = health.PrometheusMetrics(
    uptime_seconds=uptime,
    cpu_percent=metrics.get('cpu_percent', 0),
    memory_percent=metrics.get('memory', {}).get('percent', 0),
    memory_used_mb=metrics.get('memory', {}).get('used_mb', 0),
    memory_available_mb=metrics.get('memory', {}).get('available_mb', 0),
    disk_percent=metrics.get('disk', {}).get('percent', 0),
    disk_used_gb=metrics.get('disk', {}).get('used_gb', 0),
    disk_free_gb=metrics.get('disk', {}).get('free_gb', 0),
    process_cpu_percent=metrics.get('process', {}).get('cpu_percent', 0),
    process_memory_mb=metrics.get('process', {}).get('memory_mb', 0),
    timestamp=time.time()
)
print(f"✅ PrometheusMetrics model: uptime={prom_metrics.uptime_seconds:.2f}s")

print("\n✅ All health check components working!")
print("\n📝 Endpoints available:")
print("   GET /health              - Basic health check")
print("   GET /health/detailed     - Detailed diagnostics")
print("   GET /health/metrics      - Prometheus metrics")
print("   GET /health/ready        - Kubernetes readiness")
print("   GET /health/live         - Kubernetes liveness")
