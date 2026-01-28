import asyncio
import os
import sys
import time

import httpx

# Add project root to path
sys.path.append(os.getcwd())

async def run_load_test():
    # url = "http://localhost:8000/api/health" # This endpoint is usually exempt
    # Actually, the middleware skips /health. Let's use a non-existent endpoint which triggers the global IP limit.
    target_url = "http://localhost:8000/api/load-test-target"

    print(f"🚀 Starting load test against {target_url}")
    print("Goal: Trigger Global IP Rate Limit (100 req/min)")

    async with httpx.AsyncClient() as client:
        # 1. Warm up
        try:
            resp = await client.get(target_url)
            print(f"Initial request status: {resp.status_code}")
        except Exception as e:
            print(f"Server might not be running: {e}")
            print("Please ensure the backend is running on localhost:8000")
            return

        # 2. Burst 150 requests
        print("\n💥 Sending 150 requests in parallel...")
        tasks = []
        start_time = time.time()

        for i in range(150):
            tasks.append(client.get(target_url))

        responses = await asyncio.gather(*tasks, return_exceptions=True)
        duration = time.time() - start_time

        # 3. Analyze results
        success_count = 0
        rate_limited_count = 0
        error_count = 0

        for r in responses:
            if isinstance(r, httpx.Response):
                if r.status_code == 200 or r.status_code == 404: # 404 is fine, means it passed rate limiter
                    success_count += 1
                elif r.status_code == 429:
                    rate_limited_count += 1
                else:
                    error_count += 1
            else:
                error_count += 1

        print(f"\n📊 Results ({duration:.2f}s):")
        print(f"✅ Allowed: {success_count}")
        print(f"⛔ Blocked (429): {rate_limited_count}")
        print(f"❌ Errors: {error_count}")

        if rate_limited_count > 0:
            print("\n✅ SUCCESS: Rate limiting is active and blocking requests!")
        else:
            print("\n⚠️ WARNING: No requests were rate limited. Check configuration.")

if __name__ == "__main__":
    try:
        asyncio.run(run_load_test())
    except KeyboardInterrupt:
        pass
