#!/usr/bin/env python3
import argparse
import requests
import time
import sys
from concurrent.futures import ThreadPoolExecutor

def test_endpoint(url, method, count, delay):
    print(f"🚀 Testing {method} {url} with {count} requests...")

    success = 0
    blocked = 0
    errors = 0

    start_time = time.time()

    for i in range(count):
        try:
            if method.upper() == "GET":
                res = requests.get(url)
            elif method.upper() == "POST":
                res = requests.post(url)
            else:
                print(f"Method {method} not supported in CLI test")
                return

            sys.stdout.write(f"\rRequest {i+1}/{count}: Status {res.status_code}")
            sys.stdout.flush()

            if res.status_code == 200 or res.status_code == 201 or res.status_code == 404:
                # 404 is considered "allowed" by rate limiter (it passed the middleware)
                success += 1
            elif res.status_code == 429:
                blocked += 1
            else:
                errors += 1

            if delay > 0:
                time.sleep(delay)

        except Exception as e:
            print(f"\nError: {e}")
            errors += 1

    end_time = time.time()
    duration = end_time - start_time

    print(f"\n\n📊 Results:")
    print(f"Total Requests: {count}")
    print(f"Duration: {duration:.2f}s")
    print(f"✅ Allowed: {success}")
    print(f"⛔ Blocked: {blocked}")
    print(f"⚠️ Errors: {errors}")
    print("-" * 30)

def main():
    parser = argparse.ArgumentParser(description="API Rate Limiter Testing Tool")
    parser.add_argument("--url", type=str, required=True, help="Target URL (e.g., http://localhost:8000/api/v1/test)")
    parser.add_argument("--method", type=str, default="GET", help="HTTP Method")
    parser.add_argument("--count", type=int, default=10, help="Number of requests")
    parser.add_argument("--delay", type=float, default=0.0, help="Delay between requests in seconds")

    args = parser.parse_args()

    test_endpoint(args.url, args.method, args.count, args.delay)

if __name__ == "__main__":
    main()
