from app.services.queue import JobStatus

def test_enqueue_job(queue_service):
    job_id = queue_service.enqueue("test_task", {"foo": "bar"})
    assert job_id is not None

    stats = queue_service.get_stats()
    assert stats["pending"] == 1
    assert stats["total_jobs"] == 1

def test_dequeue_job(queue_service):
    queue_service.enqueue("test_task", {"foo": "bar"})
    job = queue_service.dequeue()

    assert job is not None
    assert job.task_name == "test_task"
    assert job.status == JobStatus.PROCESSING

    stats = queue_service.get_stats()
    assert stats["pending"] == 0
    assert stats["processing"] == 1

def test_complete_job(queue_service):
    job_id = queue_service.enqueue("test_task", {"foo": "bar"})
    job = queue_service.dequeue()

    queue_service.complete_job(job_id, result="success")

    updated_job = queue_service.get_job(job_id)
    assert updated_job["status"] == JobStatus.COMPLETED
    assert updated_job["payload"]["result"] == "success"

    stats = queue_service.get_stats()
    assert stats["processing"] == 0

def test_fail_job_retry(queue_service):
    job_id = queue_service.enqueue("test_task", {}, max_retries=1)
    job = queue_service.dequeue()

    # First failure - should retry
    queue_service.fail_job(job_id, "error 1")

    updated_job = queue_service.get_job(job_id)
    assert updated_job["status"] == JobStatus.PENDING
    assert updated_job["retries"] == 1
    assert updated_job["error"] == "error 1"

    # Verify it's back in pending queue
    stats = queue_service.get_stats()
    assert stats["pending"] == 1
    assert stats["processing"] == 0

def test_fail_job_permanent(queue_service):
    job_id = queue_service.enqueue("test_task", {}, max_retries=0)
    job = queue_service.dequeue()

    # Failure with 0 retries allowed
    queue_service.fail_job(job_id, "fatal error")

    updated_job = queue_service.get_job(job_id)
    assert updated_job["status"] == JobStatus.FAILED

    stats = queue_service.get_stats()
    assert stats["failed"] == 1
    assert stats["processing"] == 0
    assert stats["pending"] == 0

def test_retry_failed_job(queue_service):
    job_id = queue_service.enqueue("test_task", {}, max_retries=0)
    job = queue_service.dequeue()
    queue_service.fail_job(job_id, "fatal error")

    # Manually retry
    success = queue_service.retry_job(job_id)
    assert success is True

    updated_job = queue_service.get_job(job_id)
    assert updated_job["status"] == JobStatus.PENDING
    assert updated_job["retries"] == 0

    stats = queue_service.get_stats()
    assert stats["failed"] == 0
    assert stats["pending"] == 1

def test_clear_failed_jobs(queue_service):
    # Create 2 failed jobs
    for _ in range(2):
        job_id = queue_service.enqueue("test_task", {}, max_retries=0)
        queue_service.dequeue()
        queue_service.fail_job(job_id, "error")

    stats = queue_service.get_stats()
    assert stats["failed"] == 2

    count = queue_service.clear_failed()
    assert count == 2

    stats = queue_service.get_stats()
    assert stats["failed"] == 0
