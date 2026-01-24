import logging
import uuid

# We need basic models. Ideally these should be shared or defined here.
# To avoid circular imports with backend schemas, let's define core models here
# or use dictionaries/dataclasses.
# For now, let's use the same structure as the schemas but as plain classes/dataclasses
# and let the API convert them.
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"

@dataclass
class Card:
    title: str
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    assignee_id: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    due_date: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    order: float = 0.0
    # Link to Swarm Task
    swarm_task_id: Optional[str] = None

@dataclass
class Column:
    id: str
    title: str
    status: TaskStatus
    order: int
    cards: List[Card] = field(default_factory=list)

@dataclass
class Board:
    title: str
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    description: Optional[str] = None
    columns: List[Column] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

class BoardManager:
    _instance = None
    _boards: Dict[str, Board] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(BoardManager, cls).__new__(cls)
            cls._instance._init_default_board()
        return cls._instance

    def _init_default_board(self):
        if "default" not in self._boards:
            default_board = Board(
                id="default",
                title="Main Board",
                description="Default project board",
                columns=[
                    Column(id="todo", title="To Do", status=TaskStatus.TODO, order=0),
                    Column(id="in_progress", title="In Progress", status=TaskStatus.IN_PROGRESS, order=1),
                    Column(id="review", title="Review", status=TaskStatus.REVIEW, order=2),
                    Column(id="done", title="Done", status=TaskStatus.DONE, order=3),
                ]
            )
            self._boards["default"] = default_board

    def get_board(self, board_id: str) -> Optional[Board]:
        return self._boards.get(board_id)

    def list_boards(self) -> List[Board]:
        return list(self._boards.values())

    def create_board(self, title: str, description: str = None) -> Board:
        new_board = Board(
            title=title,
            description=description,
            columns=[
                Column(id="todo", title="To Do", status=TaskStatus.TODO, order=0),
                Column(id="in_progress", title="In Progress", status=TaskStatus.IN_PROGRESS, order=1),
                Column(id="review", title="Review", status=TaskStatus.REVIEW, order=2),
                Column(id="done", title="Done", status=TaskStatus.DONE, order=3),
            ]
        )
        self._boards[new_board.id] = new_board
        return new_board

    def create_card(self, board_id: str, title: str, status: TaskStatus = TaskStatus.TODO,
                   priority: TaskPriority = TaskPriority.MEDIUM, description: str = None,
                   swarm_task_id: str = None) -> Optional[Card]:
        board = self.get_board(board_id)
        if not board:
            return None

        new_card = Card(
            title=title,
            description=description,
            status=status,
            priority=priority,
            swarm_task_id=swarm_task_id
        )

        target_column = next((col for col in board.columns if col.status == status), None)
        if not target_column and board.columns:
             target_column = board.columns[0]
             new_card.status = target_column.status

        if target_column:
            target_column.cards.append(new_card)
            board.updated_at = datetime.now()
            return new_card
        return None

    def update_card_status(self, board_id: str, card_id: str, new_status: TaskStatus) -> Optional[Card]:
        board = self.get_board(board_id)
        if not board:
            return None

        found_card = None
        found_column = None

        for col in board.columns:
            for card in col.cards:
                if card.id == card_id:
                    found_card = card
                    found_column = col
                    break
            if found_card:
                break

        if not found_card:
            return None

        if found_card.status == new_status:
            return found_card

        # Move
        new_column = next((col for col in board.columns if col.status == new_status), None)
        if new_column:
            found_column.cards.remove(found_card)
            found_card.status = new_status
            found_card.updated_at = datetime.now()
            new_column.cards.append(found_card)
            board.updated_at = datetime.now()
            return found_card

        return None

    def sync_task_status(self, swarm_task_id: str, status: str):
        """Sync a Swarm Task status update to the Kanban board."""
        # Find card by swarm_task_id
        # In MVP, we search all boards/cards. In prod, use index/DB.

        # Map Swarm Status to Kanban Status
        # PENDING -> TODO
        # RUNNING -> IN_PROGRESS
        # COMPLETED -> DONE
        # FAILED -> REVIEW (or DONE with tag)

        kanban_status = TaskStatus.TODO
        if status == "PENDING":
            kanban_status = TaskStatus.TODO
        elif status == "RUNNING":
            kanban_status = TaskStatus.IN_PROGRESS
        elif status == "COMPLETED":
            kanban_status = TaskStatus.DONE
        elif status == "FAILED":
            kanban_status = TaskStatus.REVIEW
        else:
            return

        for b in self._boards.values():
            for col in b.columns:
                for card in col.cards:
                    if card.swarm_task_id == swarm_task_id:
                        logger.info(f"Syncing task {swarm_task_id} to status {kanban_status}")
                        self.update_card_status(b.id, card.id, kanban_status)
                        return

