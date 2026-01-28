import asyncio
import os
import statistics
import sys
import time

import httpx

# Add project root to path
sys.path.append(os.getcwd())

async def measure_endpoint(url: str, label: str, count: int = 20):
    print(f"\n🚀 Testing {label}: {url}")

    times = []

    async with httpx.AsyncClient() as client:
        # 1. Warm up (Prime the cache)
        print("   Priming cache...")
        start = time.time()
        resp = await client.get(url)
        if resp.status_code != 200:
            print(f"   ⚠️ Error: {resp.status_code}")
            return
        print(f"   First request (Cold): {(time.time() - start)*1000:.2f}ms")

        # 2. Burst requests
        print(f"   Sending {count} requests...")

        for i in range(count):
            start = time.time()
            await client.get(url)
            duration = time.time() - start
            times.append(duration * 1000) # ms

    # Stats
    avg_time = statistics.mean(times)
    min_time = min(times)
    max_time = max(times)
    median_time = statistics.median(times)

    print(f"📊 Results for {label}:")
    print(f"   Requests: {count}")
    print(f"   Avg: {avg_time:.2f}ms")
    print(f"   Min: {min_time:.2f}ms")
    print(f"   Max: {max_time:.2f}ms")
    print(f"   Median: {median_time:.2f}ms")

    if avg_time < 50:
        print("   ✅ SUCCESS: Sub-50ms response time achieved!")
    else:
        print("   ⚠️ WARNING: Average time > 50ms. Caching might not be effective or overhead is high.")

async def run_load_test():
    # Ensure server is running
    url_base = "http://localhost:8000"

    # Test 1: Dashboard Metrics (Cached)
    await measure_endpoint(f"{url_base}/api/dashboard/data/revenue", "Dashboard Metrics (Cached)")

    # Test 2: Landing Pages List (Cached)
    await measure_endpoint(f"{url_base}/api/landing-pages/", "Landing Pages List (Cached)")

    # Test 3: Public Inventory (Cached)
    await measure_endpoint(f"{url_base}/api/v1/inventory/products", "Inventory (Cached)")

    # Test 4: Health Check (Uncached Control)
    await measure_endpoint(f"{url_base}/api/health", "Health Check (Uncached Control)")

if __name__ == "__main__":
    try:
        # Check if backend is running
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', 8000))
        sock.close()

        if result != 0:
            print("❌ Backend is not running on localhost:8000")
            print("   Please run 'uvicorn backend.api.main:app --reload' in a separate terminal.")
            sys.exit(1)

        asyncio.run(run_load_test())
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"Error: {e}")
