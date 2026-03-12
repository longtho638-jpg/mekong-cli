"""Tests for task_queue module (PriorityTaskQueue).

Covers enqueue/poll, priority ordering, backpressure,
DLQ handling, retry logic, and statistics.
"""

from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.task_queue import (
    PriorityTaskQueue,
    QueuedTask,
    TaskPriority,
)


# ---------------------------------------------------------------------------
# Basic Queue Operations
# ---------------------------------------------------------------------------

class TestBasicOperations:
    def test_empty_queue(self):
        q = PriorityTaskQueue()
        assert q.is_empty is True
        assert q.size == 0
        assert q.poll() is None

    def test_enqueue_and_poll(self):
        q = PriorityTaskQueue()
        task = q.enqueue("t1", "Build project")
        assert task is not None
        assert q.size == 1
        assert q.is_empty is False

        polled = q.poll()
        assert polled is not None
        assert polled.task_id == "t1"
        assert polled.goal == "Build project"
        assert q.is_empty is True

    def test_peek_does_not_remove(self):
        q = PriorityTaskQueue()
        q.enqueue("t1", "Test")
        peeked = q.peek()
        assert peeked is not None
        assert peeked.task_id == "t1"
        assert q.size == 1  # Still there

    def test_peek_empty_returns_none(self):
        q = PriorityTaskQueue()
        assert q.peek() is None

    def test_fifo_same_priority(self):
        q = PriorityTaskQueue()
        q.enqueue("t1", "First")
        q.enqueue("t2", "Second")
        q.enqueue("t3", "Third")

        assert q.poll().task_id == "t1"
        assert q.poll().task_id == "t2"
        assert q.poll().task_id == "t3"


# ---------------------------------------------------------------------------
# Priority Ordering
# ---------------------------------------------------------------------------

class TestPriorityOrdering:
    def test_critical_before_normal(self):
        q = PriorityTaskQueue()
        q.enqueue("t1", "Normal task", priority=TaskPriority.NORMAL)
        q.enqueue("t2", "Critical task", priority=TaskPriority.CRITICAL)
        polled = q.poll()
        assert polled.task_id == "t2"

    def test_high_before_low(self):
        q = PriorityTaskQueue()
        q.enqueue("t1", "Low", priority=TaskPriority.LOW)
        q.enqueue("t2", "High", priority=TaskPriority.HIGH)
        assert q.poll().task_id == "t2"

    def test_full_priority_order(self):
        q = PriorityTaskQueue()
        q.enqueue("bg", "Background", priority=TaskPriority.BACKGROUND)
        q.enqueue("lo", "Low", priority=TaskPriority.LOW)
        q.enqueue("hi", "High", priority=TaskPriority.HIGH)
        q.enqueue("cr", "Critical", priority=TaskPriority.CRITICAL)
        q.enqueue("no", "Normal", priority=TaskPriority.NORMAL)

        order = [q.poll().task_id for _ in range(5)]
        assert order == ["cr", "hi", "no", "lo", "bg"]


# ---------------------------------------------------------------------------
# Backpressure
# ---------------------------------------------------------------------------

class TestBackpressure:
    def test_max_size_enforced(self):
        q = PriorityTaskQueue(max_size=2)
        t1 = q.enqueue("t1", "A")
        t2 = q.enqueue("t2", "B")
        t3 = q.enqueue("t3", "C")  # Should be rejected
        assert t1 is not None
        assert t2 is not None
        assert t3 is None
        assert q.size == 2

    def test_unlimited_queue(self):
        q = PriorityTaskQueue(max_size=0)  # unlimited
        for i in range(100):
            assert q.enqueue(f"t{i}", f"Task {i}") is not None
        assert q.size == 100


# ---------------------------------------------------------------------------
# Task Completion & Failure
# ---------------------------------------------------------------------------

class TestCompletionAndFailure:
    def test_mark_completed(self):
        q = PriorityTaskQueue()
        q.enqueue("t1", "Build")
        task = q.poll()
        q.mark_completed(task)
        stats = q.stats()
        assert stats["total_completed"] == 1

    def test_mark_failed_retries(self):
        q = PriorityTaskQueue()
        q.enqueue("t1", "Deploy", max_attempts=3)
        task = q.poll()

        # First failure → re-enqueued
        retried = q.mark_failed(task, "timeout")
        assert retried is True
        assert q.size == 1
        assert task.attempt == 1

    def test_mark_failed_exhausted_to_dlq(self):
        q = PriorityTaskQueue()
        q.enqueue("t1", "Deploy", max_attempts=2)
        task = q.poll()

        q.mark_failed(task, "error 1")  # attempt 1 → retry
        task = q.poll()
        retried = q.mark_failed(task, "error 2")  # attempt 2 → DLQ
        assert retried is False
        assert q.dlq_size == 1
        assert q.is_empty is True


# ---------------------------------------------------------------------------
# Dead Letter Queue
# ---------------------------------------------------------------------------

class TestDeadLetterQueue:
    def test_get_dlq_empty(self):
        q = PriorityTaskQueue()
        assert q.get_dlq() == []

    def test_dlq_contains_failed_tasks(self):
        q = PriorityTaskQueue()
        q.enqueue("t1", "Build", max_attempts=1)
        task = q.poll()
        q.mark_failed(task, "fatal error")

        dlq = q.get_dlq()
        assert len(dlq) == 1
        assert dlq[0].task.task_id == "t1"
        assert dlq[0].final_error == "fatal error"

    def test_retry_from_dlq(self):
        q = PriorityTaskQueue()
        q.enqueue("t1", "Build", max_attempts=1)
        task = q.poll()
        q.mark_failed(task, "error")
        assert q.dlq_size == 1

        # Retry from DLQ
        result = q.retry_from_dlq("t1")
        assert result is True
        assert q.dlq_size == 0
        assert q.size == 1

        # Task should have reset attempts
        retried = q.poll()
        assert retried.task_id == "t1"
        assert retried.attempt == 0

    def test_retry_from_dlq_not_found(self):
        q = PriorityTaskQueue()
        assert q.retry_from_dlq("nonexistent") is False


# ---------------------------------------------------------------------------
# Statistics
# ---------------------------------------------------------------------------

class TestStatistics:
    def test_initial_stats(self):
        q = PriorityTaskQueue()
        stats = q.stats()
        assert stats["pending"] == 0
        assert stats["dlq"] == 0
        assert stats["total_enqueued"] == 0
        assert stats["total_completed"] == 0
        assert stats["completion_rate"] == 0.0

    def test_stats_after_operations(self):
        q = PriorityTaskQueue()
        q.enqueue("t1", "A")
        q.enqueue("t2", "B")
        task = q.poll()
        q.mark_completed(task)

        stats = q.stats()
        assert stats["total_enqueued"] == 2
        assert stats["total_completed"] == 1
        assert stats["pending"] == 1
        assert stats["completion_rate"] == 50.0


# ---------------------------------------------------------------------------
# Clear
# ---------------------------------------------------------------------------

class TestClear:
    def test_clear_removes_all(self):
        q = PriorityTaskQueue()
        q.enqueue("t1", "A")
        q.enqueue("t2", "B", max_attempts=1)
        task = q.poll()
        q.mark_failed(task, "err")
        assert q.size > 0 or q.dlq_size > 0

        q.clear()
        assert q.size == 0
        assert q.dlq_size == 0


# ---------------------------------------------------------------------------
# QueuedTask Dataclass
# ---------------------------------------------------------------------------

class TestQueuedTask:
    def test_default_values(self):
        task = QueuedTask(
            priority=TaskPriority.NORMAL.value,
            enqueued_at=0.0,
            task_id="t1",
            goal="test",
        )
        assert task.attempt == 0
        assert task.max_attempts == 3
        assert task.source == "manual"
        assert task.payload == {}

    def test_task_with_payload(self):
        q = PriorityTaskQueue()
        task = q.enqueue("t1", "Build", payload={"env": "prod"})
        assert task.payload == {"env": "prod"}

    def test_task_source(self):
        q = PriorityTaskQueue()
        task = q.enqueue("t1", "Build", source="webhook")
        assert task.source == "webhook"
