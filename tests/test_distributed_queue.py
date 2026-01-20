"""
Tests for Distributed Queue System.
"""

import pytest
import time
from unittest.mock import MagicMock, patch, ANY
from antigravity.infrastructure.distributed_queue.models import Job, JobStatus, JobPriority, QueueStats
from antigravity.infrastructure.distributed_queue.queue_manager import QueueManager
from antigravity.infrastructure.distributed_queue.backends.memory_backend import MemoryBackend
from antigravity.infrastructure.distributed_queue.backends.redis_backend import RedisBackend
from antigravity.infrastructure.distributed_queue import DistributedQueue

# -----------------------------------------------------------------------------
# Model Tests
# -----------------------------------------------------------------------------

def test_job_defaults():
    job = Job(job_id="", name="test", data={})
    assert job.job_id  # Should be generated
    assert job.status == JobStatus.PENDING
    assert job.priority == JobPriority.NORMAL
    assert job.created_at > 0

def test_job_serialization():
    # Ensure Job is serializable using safe JSON (replaces insecure pickle)
    import json
    job = Job(job_id="123", name="test", data={"a": 1})
    data = json.dumps(job.to_json())
    job2 = Job.from_json(json.loads(data))
    assert job2.job_id == job.job_id
    assert job2.data == job.data
    assert job2.name == job.name
    assert job2.priority == job.priority
    assert job2.status == job.status

# -----------------------------------------------------------------------------
# Memory Backend Tests
# -----------------------------------------------------------------------------

@pytest.fixture
def memory_backend():
    return MemoryBackend()

def test_memory_submit_and_get(memory_backend):
    job = Job(job_id="1", name="test", data="foo")
    assert memory_backend.submit_job(job)

    # Get job
    retrieved = memory_backend.get_next_job("worker1")
    assert retrieved is not None
    assert retrieved.job_id == "1"
    assert retrieved.status == JobStatus.RUNNING
    assert retrieved.worker_id == "worker1"

    # Stats
    stats = memory_backend.get_stats()
    assert stats.running_jobs == 1
    assert stats.pending_jobs == 0

def test_memory_priority(memory_backend):
    # Submit low priority first
    job_low = Job(job_id="low", name="low", data={}, priority=JobPriority.LOW)
    memory_backend.submit_job(job_low)

    # Submit high priority second
    job_high = Job(job_id="high", name="high", data={}, priority=JobPriority.HIGH)
    memory_backend.submit_job(job_high)

    # Should get high priority first
    job1 = memory_backend.get_next_job("w1")
    assert job1.job_id == "high"

    job2 = memory_backend.get_next_job("w1")
    assert job2.job_id == "low"

def test_memory_completion(memory_backend):
    job = Job(job_id="1", name="test", data="foo")
    memory_backend.submit_job(job)
    retrieved = memory_backend.get_next_job("w1")

    memory_backend.complete_job(retrieved, success=True, result="done")

    stats = memory_backend.get_stats()
    assert stats.completed_jobs == 1
    assert stats.running_jobs == 0
    assert retrieved.status == JobStatus.COMPLETED

# -----------------------------------------------------------------------------
# Queue Manager Tests
# -----------------------------------------------------------------------------

def test_manager_fallback():
    # Force Redis failure
    with patch('antigravity.infrastructure.distributed_queue.queue_manager.RedisBackend') as MockRedis:
        instance = MockRedis.return_value
        instance.connect.return_value = False

        manager = QueueManager(redis_url="redis://bad:6379", fallback_to_memory=True)
        assert isinstance(manager.backend, MemoryBackend)
        assert not manager.redis_available

def test_manager_no_fallback():
    with patch('antigravity.infrastructure.distributed_queue.queue_manager.RedisBackend') as MockRedis:
        instance = MockRedis.return_value
        instance.connect.return_value = False

        manager = QueueManager(redis_url="redis://bad:6379", fallback_to_memory=False)
        assert manager.backend is None

def test_manager_flow():
    manager = QueueManager(fallback_to_memory=True)

    # Submit
    jid = manager.submit_job("test", {"x": 1})
    assert jid

    # Get
    job = manager.get_next_job("w1")
    assert job
    assert job.job_id == jid

    # Complete
    manager.complete_job(job, success=True)

    stats = manager.get_stats()
    assert stats.completed_jobs == 1

def test_manager_retry_flow():
    manager = QueueManager(fallback_to_memory=True)

    jid = manager.submit_job("test", {}, priority=JobPriority.HIGH)
    job = manager.get_next_job("w1")

    # Fail with retry
    manager.fail_job(job, "oops", retry=True)

    # Should be re-queued with lower priority (HIGH -> NORMAL)
    # Note: MemoryBackend implementation of requeue puts it in BACKGROUND or specified priority
    # QueueManager logic: min(priority.value + 1, BACKGROUND)
    # HIGH(2) -> NORMAL(3)

    job_retry = manager.get_next_job("w1")
    assert job_retry
    assert job_retry.job_id == jid
    assert job_retry.priority == JobPriority.NORMAL
    assert job_retry.retry_count == 1

# -----------------------------------------------------------------------------
# Facade Tests
# -----------------------------------------------------------------------------

def test_facade_methods():
    dq = DistributedQueue(fallback_to_memory=True)

    # Test global methods
    dq.submit_job("test", {})
    job = dq.get_next_job("w1")
    assert job

    dq.complete_job(job.job_id, success=True)
    assert dq.get_queue_stats().completed_jobs == 1

def test_facade_legacy_completion():
    dq = DistributedQueue(fallback_to_memory=True)
    jid = dq.submit_job("test", {})

    # Simulate picking up job outside of facade (or verifying state)
    job = dq.get_next_job("w1")

    # Complete using just ID (legacy style)
    dq.complete_job(jid, success=True)

    assert dq.get_queue_stats().completed_jobs == 1
