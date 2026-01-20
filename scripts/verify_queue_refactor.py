"""
Verification script for Distributed Queue Refactor.
"""
import sys
import time
import os

# Add project root to path
sys.path.insert(0, os.getcwd())

from antigravity.infrastructure.distributed_queue import (
    submit_job,
    get_next_job,
    complete_job,
    get_queue_stats,
    JobPriority,
    JobStatus
)

def test_queue_flow():
    print("Testing Distributed Queue Refactor...")

    # 1. Submit a job
    print("\n1. Submitting Job...")
    job_id = submit_job(
        name="test_job",
        data={"value": 123},
        priority=JobPriority.HIGH
    )
    print(f"   Job submitted with ID: {job_id}")

    if not job_id:
        print("❌ Failed to submit job")
        return False

    # 2. Check stats
    stats = get_queue_stats()
    print(f"\n2. Queue Stats: Total={stats.total_jobs}, Pending={stats.pending_jobs}")
    if stats.pending_jobs < 1:
        print("❌ Stats mismatch: Pending jobs should be >= 1")
        return False

    # 3. Process job
    print("\n3. Processing Job...")
    # Simulate a worker picking up the job
    worker_id = "test_verifier_1"
    job = get_next_job(worker_id=worker_id, timeout=1.0)

    if not job:
        print("❌ Failed to get job")
        return False

    print(f"   Picked up job: {job.job_id} ({job.name})")
    print(f"   Job Data: {job.data}")

    if job.job_id != job_id:
        print(f"❌ Job ID mismatch: Expected {job_id}, got {job.job_id}")
        return False

    # 4. Complete job
    print("\n4. Completing Job...")
    complete_job(job.job_id, result="success", worker_id=worker_id)

    # 5. Check final stats
    stats = get_queue_stats()
    print(f"\n5. Final Stats: Completed={stats.completed_jobs}, Pending={stats.pending_jobs}")

    if stats.completed_jobs < 1:
        print("❌ Stats mismatch: Completed jobs should be >= 1")
        return False

    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if test_queue_flow():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
