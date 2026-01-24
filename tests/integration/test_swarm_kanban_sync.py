import time
from antigravity.core.kanban.board_manager import BoardManager
from antigravity.core.kanban.board_manager import TaskStatus as KanbanStatus
from antigravity.core.swarm.engine import AgentSwarm
from antigravity.core.swarm.enums import TaskStatus

import pytest


def test_swarm_kanban_sync():
    # 1. Initialize Swarm and Board Manager
    swarm = AgentSwarm(max_workers=2, enable_metrics=False)
    board_manager = BoardManager()

    # Ensure default board exists
    board = board_manager.get_board("default")
    assert board is not None
    sum(len(col.cards) for col in board.columns)

    # 2. Register a simple agent
    def simple_handler(payload):
        time.sleep(0.5)  # Simulate work
        return f"Processed: {payload}"

    swarm.register_agent("worker-1", simple_handler)

    try:
        # 3. Submit a task
        task_id = swarm.submit_task("Sync Test Task", "test_payload")

        # 4. Verify Card Creation (Status: TODO)
        # Find the card
        found_card = None
        for col in board.columns:
            for card in col.cards:
                if card.swarm_task_id == task_id:
                    found_card = card
                    break

        assert found_card is not None
        assert found_card.title == "Sync Test Task"
        assert found_card.status == KanbanStatus.TODO

        # 5. Start swarm and Wait for Execution (Status: IN_PROGRESS -> DONE)
        swarm.start()
        # We need to poll because it's async in threads

        # Wait for RUNNING
        # Note: It might happen too fast to catch RUNNING reliably in a sleep loop,
        # but we definitely check COMPLETED.

        result = swarm.get_task_result(task_id, wait=True, timeout=5.0)
        assert result == "Processed: test_payload"

        # 6. Verify Card Status is DONE
        # We need to fetch the card again or check the reference if it's updated in place
        # BoardManager updates objects in place.

        # Verify status update
        assert found_card.status == KanbanStatus.DONE

        # Verify it moved to the correct column
        done_col = next(c for c in board.columns if c.id == "done")
        assert found_card in done_col.cards

    finally:
        swarm.stop()

if __name__ == "__main__":
    test_swarm_kanban_sync()
