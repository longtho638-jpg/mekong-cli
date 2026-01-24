"""
Benchmark Core Engines
======================
Measures performance of critical paths in RevenueEngine and AgentSwarm.
"""
import time
import timeit
from concurrent.futures import ThreadPoolExecutor

from antigravity.core.revenue.engine import RevenueEngine
from antigravity.core.swarm.engine import AgentSwarm
from antigravity.core.swarm.enums import AgentRole, TaskPriority

def benchmark_revenue_engine():
    print("\n💰 Benchmarking RevenueEngine...")
    engine = RevenueEngine()

    # 1. Measure Stats Collection (Cached vs Uncached)
    start = time.time()
    for _ in range(100):
        engine.get_stats()
    duration = time.time() - start
    print(f"   get_stats() x100: {duration:.4f}s (Avg: {duration/100:.6f}s)")

    # 2. Measure Invoice Processing (Simulated)
    # Assuming we can mock or add invoices quickly
    # This is a read-heavy benchmark for now based on current implementation

def benchmark_swarm_engine():
    print("\n🤖 Benchmarking AgentSwarm...")
    swarm = AgentSwarm(max_workers=5, enable_metrics=False)

    # Register a dummy agent
    def noop_handler(payload):
        return "ok"

    swarm.register_agent("bench_agent", noop_handler, role=AgentRole.WORKER)
    swarm.start()

    task_count = 100

    try:
        # 1. Submission Throughput
        start = time.time()
        task_ids = []
        for i in range(task_count):
            tid = swarm.submit_task(f"task_{i}", {"data": i}, priority=TaskPriority.HIGH)
            task_ids.append(tid)
        submission_time = time.time() - start
        print(f"   Task Submission x{task_count}: {submission_time:.4f}s ({task_count/submission_time:.2f} tasks/s)")

        # 2. Execution Throughput (Wait for completion)
        # Note: This depends on the worker poll rate (0.1s sleep in loop usually)
        # So we expect it to be slower than raw submission
        start = time.time()
        completed = 0
        while completed < task_count:
            # Check a batch
            pending = 0
            for tid in task_ids:
                res = swarm.get_task_result(tid, wait=False)
                if res is not None:
                    completed += 1
                else:
                    pending += 1
            if pending == 0:
                break
            time.sleep(0.01)

            # Safety break
            if time.time() - start > 10:
                print("   !! Timeout waiting for tasks")
                break

        execution_time = time.time() - start
        print(f"   Task Execution x{task_count}: {execution_time:.4f}s ({task_count/execution_time:.2f} tasks/s)")

    finally:
        swarm.stop()

if __name__ == "__main__":
    print("🚀 Starting Core Benchmarks")
    print("===========================")

    benchmark_revenue_engine()
    benchmark_swarm_engine()

    print("\n✅ Benchmarks Complete")
