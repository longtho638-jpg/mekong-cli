"""
Test script for TunnelOptimizer performance
=========================================

Tests the new high-performance tunnel with caching, connection pooling,
and latency tracking features.
"""

import asyncio
import time
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.api.tunnel import TunnelOptimizer, get_optimized_tools, get_optimized_status

async def test_tunnel_performance():
    """Test tunnel performance with concurrent requests."""
    
    print("🚀 Testing TunnelOptimizer Performance")
    print("=" * 50)
    
    # Initialize optimizer
    tunnel = TunnelOptimizer()
    
    try:
        # 1. Pre-warm connections
        print("1. Pre-warming connections...")
        start = time.time()
        await tunnel.pre_warm_connections()
        warm_time = time.time() - start
        print(f"   ✅ Connections warmed in {warm_time:.3f}s")
        
        # 2. Test single request
        print("\n2. Testing single request...")
        start = time.time()
        response = await tunnel.request("GET", "/health")
        single_time = time.time() - start
        print(f"   ✅ Single request: {single_time:.3f}s")
        print(f"   📊 Response: {response.get('status', 'unknown')}")
        
        # 3. Test cache performance
        print("\n3. Testing cache performance...")
        # First request (cache miss)
        start = time.time()
        await tunnel.request("GET", "/api/code/status", use_cache=True)
        first_time = time.time() - start
        
        # Second request (cache hit)
        start = time.time()
        await tunnel.request("GET", "/api/code/status", use_cache=True)
        cached_time = time.time() - start
        
        cache_speedup = first_time / cached_time if cached_time > 0 else 0
        print(f"   ✅ First request (cache miss): {first_time:.3f}s")
        print(f"   ⚡ Cached request: {cached_time:.3f}s")
        print(f"   🚀 Cache speedup: {cache_speedup:.1f}x")
        
        # 4. Test concurrent requests
        print("\n4. Testing concurrent requests...")
        requests = [
            {"method": "GET", "endpoint": "/health", "use_cache": False}
            for _ in range(20)
        ]
        
        start = time.time()
        results = await tunnel.batch_requests(requests, max_concurrent=10)
        concurrent_time = time.time() - start
        
        successful = sum(1 for r in results if not isinstance(r, Exception))
        print(f"   ✅ {successful}/{len(requests)} requests successful")
        print(f"   ⚡ Concurrent batch time: {concurrent_time:.3f}s")
        print(f"   📊 Avg per request: {concurrent_time/len(requests):.3f}s")
        
        # 5. Test slow request tracking
        print("\n5. Testing slow request tracking...")
        # Simulate slow request
        start = time.time()
        await tunnel.request("GET", "/api/code/status", use_cache=True, ttl=0.1)
        await asyncio.sleep(0.2)  # Force cache expiry
        await tunnel.request("GET", "/api/code/status", use_cache=True)
        slow_time = time.time() - start
        print(f"   ✅ Slow request test: {slow_time:.3f}s")
        
        # 6. Get comprehensive metrics
        print("\n6. Performance Metrics Summary:")
        metrics = tunnel.get_metrics_summary()
        
        print(f"   📈 Total Requests: {metrics['requests']['total']}")
        print(f"   ✅ Success Rate: {metrics['requests']['success_rate']:.1f}%")
        print(f"   ⚡ Avg Response Time: {metrics['performance']['avg_response_time_ms']:.1f}ms")
        print(f"   🐌 Slow Requests: {metrics['performance']['slow_requests_count']}")
        print(f"   💾 Cache Hit Rate: {metrics['cache']['hit_rate']:.1f}%")
        print(f"   🔗 Connection Reuse Rate: {metrics['connections']['reuse_rate']:.1f}%")
        
        # 7. Test global functions
        print("\n7. Testing global optimized functions...")
        start = time.time()
        await get_optimized_tools()
        tools_time = time.time() - start
        print(f"   ✅ get_optimized_tools(): {tools_time:.3f}s")
        
        start = time.time()
        await get_optimized_status()
        status_time = time.time() - start
        print(f"   ✅ get_optimized_status(): {status_time:.3f}s")
        
        print("\n🎉 Tunnel Performance Test Complete!")
        
        # Performance comparison
        print("\n📊 Performance Comparison:")
        if cached_time > 0:
            print(f"   Cache provides {cache_speedup:.1f}x speedup")
        if concurrent_time > 0:
            print(f"   Concurrency handles {len(requests)} requests in {concurrent_time:.3f}s")
        
        await tunnel.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        await tunnel.close()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_tunnel_performance())
    sys.exit(0 if success else 1)