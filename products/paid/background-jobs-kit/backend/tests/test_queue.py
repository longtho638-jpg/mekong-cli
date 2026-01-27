import pytest
from app.core.interfaces import JobStatus

@pytest.mark.asyncio
async def test_redis_is_mocked(queue_service):
    import fakeredis
    # Depending on implementation, queue_service.redis might be the client or wrapped
    assert isinstance(queue_service.redis, fakeredis.FakeStrictRedis) or isinstance(queue_service.redis, fakeredis.FakeRedis)

@pytest.mark.asyncio
async def test_enqueue_job(queue_service):
    # Ensure queue is empty at start
    queue_service.redis.flushall()

    job_id = await queue_service.enqueue("test_task", {"foo": "bar"})
    assert job_id is not None

    stats = await queue_service.get_stats()
    assert stats["pending"] == 1
    assert stats["total_jobs"] == 1

@pytest.mark.asyncio
async def test_dequeue_job(queue_service):
    await queue_service.enqueue("test_task", {"foo": "bar"})
    job = await queue_service.dequeue()

    assert job is not None
    assert job.task_name == "test_task"
    assert job.status == JobStatus.PROCESSING

    stats = await queue_service.get_stats()
    assert stats["pending"] == 0
    assert stats["processing"] == 1

@pytest.mark.asyncio
async def test_complete_job(queue_service):
    job_id = await queue_service.enqueue("test_task", {"foo": "bar"})
    job = await queue_service.dequeue()

    await queue_service.complete_job(job_id, result="success")

    updated_job = await queue_service.get_job(job_id)
    assert updated_job.status == JobStatus.COMPLETED
    assert updated_job.payload["result"] == "success"

    stats = await queue_service.get_stats()
    assert stats["processing"] == 0

@pytest.mark.asyncio
async def test_fail_job_retry(queue_service):
    job_id = await queue_service.enqueue("test_task", {}, max_retries=1)
    job = await queue_service.dequeue()

    # First failure - should retry
    await queue_service.fail_job(job_id, "error 1")

    updated_job = await queue_service.get_job(job_id)
    assert updated_job.status == JobStatus.PENDING
    assert updated_job.retries == 1
    assert updated_job.error == "error 1"

    # Verify it's back in pending queue
    stats = await queue_service.get_stats()
    # Note: In RedisQueue implementation for simplicity we pushed to queue_key,
    # but also check delayed logic if backoff used.
    # In fail_job: if retry, it does pipe.zadd(delayed_key)
    # So pending should be 0, delayed should be 1?
    # Let's check RedisQueue.fail_job again.
    # It puts in delayed_key (zset).
    # So stats["pending"] might be 0, stats["delayed"] 1.
    assert stats["delayed"] == 1
    assert stats["processing"] == 0

@pytest.mark.asyncio
async def test_fail_job_permanent(queue_service):
    job_id = await queue_service.enqueue("test_task", {}, max_retries=0)
    job = await queue_service.dequeue()

    # Failure with 0 retries allowed
    await queue_service.fail_job(job_id, "fatal error")

    updated_job = await queue_service.get_job(job_id)
    assert updated_job.status == JobStatus.FAILED

    stats = await queue_service.get_stats()
    assert stats["failed"] == 1
    assert stats["processing"] == 0
    assert stats["pending"] == 0

@pytest.mark.asyncio
async def test_retry_failed_job(queue_service):
    job_id = await queue_service.enqueue("test_task", {}, max_retries=0)
    job = await queue_service.dequeue()
    await queue_service.fail_job(job_id, "fatal error")

    # Manually retry
    success = await queue_service.retry_job(job_id)
    assert success is True

    updated_job = await queue_service.get_job(job_id)
    assert updated_job.status == JobStatus.PENDING
    assert updated_job.retries == 0

    stats = await queue_service.get_stats()
    assert stats["failed"] == 0
    assert stats["pending"] == 1

@pytest.mark.asyncio
async def test_clear_failed_jobs(queue_service):
    # Create 2 failed jobs
    for _ in range(2):
        job_id = await queue_service.enqueue("test_task", {}, max_retries=0)
        await queue_service.dequeue()
        await queue_service.fail_job(job_id, "error")

    stats = await queue_service.get_stats()
    assert stats["failed"] == 2

    count = await queue_service.clear_failed()
    assert count == 2

    stats = await queue_service.get_stats()
    assert stats["failed"] == 0
