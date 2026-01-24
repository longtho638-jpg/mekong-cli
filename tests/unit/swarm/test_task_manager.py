import threading
import time
from antigravity.core.swarm.enums import TaskPriority, TaskStatus
from antigravity.core.swarm.task_manager import TaskManager

import pytest


class TestTaskManager:
    @pytest.fixture
    def task_manager(self):
        return TaskManager()

    def test_submit_task(self, task_manager):
        payload = {"data": "test"}
        task_id = task_manager.submit_task("TestTask", payload, TaskPriority.HIGH)
        
        assert task_id.startswith("task_")
        assert task_id in task_manager.tasks
        task = task_manager.tasks[task_id]
        assert task.name == "TestTask"
        assert task.payload == payload
        assert task.priority == TaskPriority.HIGH
        assert task_id in task_manager.task_queue

    def test_priority_queueing(self, task_manager):
        # Insert in non-priority order
        t_normal = task_manager.submit_task("Normal", {}, TaskPriority.NORMAL)
        t_high = task_manager.submit_task("High", {}, TaskPriority.HIGH)
        t_critical = task_manager.submit_task("Critical", {}, TaskPriority.CRITICAL)
        t_low = task_manager.submit_task("Low", {}, TaskPriority.LOW)
        
        # Priority order: CRITICAL(1), HIGH(2), NORMAL(3), LOW(4)
        assert task_manager.task_queue == [t_critical, t_high, t_normal, t_low]

    def test_get_next_task(self, task_manager):
        assert task_manager.get_next_task() is None
        
        task_id = task_manager.submit_task("Task", {})
        assert task_manager.get_next_task() == task_id
        # Should not remove from queue
        assert task_manager.get_next_task() == task_id

    def test_pop_next_task(self, task_manager):
        task_id = task_manager.submit_task("Task", {})
        popped = task_manager.pop_next_task()
        
        assert popped == task_id
        assert len(task_manager.task_queue) == 0
        assert task_manager.pop_next_task() is None

    def test_remove_task_from_queue(self, task_manager):
        t1 = task_manager.submit_task("T1", {})
        t2 = task_manager.submit_task("T2", {})
        
        task_manager.remove_task_from_queue(t1)
        assert task_manager.task_queue == [t2]

    def test_get_task_result_wait(self, task_manager):
        task_id = task_manager.submit_task("Task", {})
        task = task_manager.tasks[task_id]
        
        def complete_task():
            time.sleep(0.2)
            task.result = "SUCCESS"
            task.status = TaskStatus.COMPLETED
            
        thread = threading.Thread(target=complete_task)
        thread.start()
        
        result = task_manager.get_task_result(task_id, wait=True, timeout=1.0)
        assert result == "SUCCESS"
        thread.join()

    def test_get_task_result_timeout(self, task_manager):
        task_id = task_manager.submit_task("Task", {})
        # Never completes
        result = task_manager.get_task_result(task_id, wait=True, timeout=0.1)
        assert result is None
