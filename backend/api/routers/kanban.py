import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException
from typing_extensions import TypedDict


class KanbanBoardRow(TypedDict, total=False):
    id: str
    title: str
    description: Optional[str]
    created_at: str
    updated_at: str


class KanbanTaskRow(TypedDict, total=False):
    id: str
    board_id: str
    title: str
    description: Optional[str]
    status: str
    priority: str
    assignee_id: Optional[str]
    tags: List[str]
    due_date: Optional[str]
    created_at: str
    updated_at: str
    order: float
    metadata: Dict[str, Any]


from backend.api.schemas.kanban import (
    CreateCardRequest,
    KanbanBoard,
    KanbanCard,
    KanbanColumn,
    TaskPriority,
    TaskStatus,
    UpdateCardRequest,
)
from backend.core.security.rbac import require_editor, require_viewer
from core.infrastructure.database import get_db

router = APIRouter(prefix="/api/kanban", tags=["Kanban"])

# Fixed columns for now, mirroring the Enum
DEFAULT_COLUMNS = [
    {"id": "todo", "title": "To Do", "status": TaskStatus.TODO, "order": 0},
    {"id": "in_progress", "title": "In Progress", "status": TaskStatus.IN_PROGRESS, "order": 1},
    {"id": "review", "title": "Review", "status": TaskStatus.REVIEW, "order": 2},
    {"id": "done", "title": "Done", "status": TaskStatus.DONE, "order": 3},
]

def _get_board_from_db(board_data: KanbanBoardRow, tasks_data: List[KanbanTaskRow]) -> KanbanBoard:
    """Helper to construct Board object from DB rows."""
    columns = []

    # Group tasks by status
    tasks_by_status: Dict[str, List[KanbanCard]] = {
        status.value: [] for status in TaskStatus
    }

    for task in tasks_data:
        status_val = task.get("status", "todo")
        # Ensure status is valid, default to todo
        if status_val not in tasks_by_status:
            status_val = "todo"

        card = KanbanCard(
            id=str(task["id"]),
            title=task["title"],
            description=task.get("description"),
            status=TaskStatus(status_val),
            priority=TaskPriority(task.get("priority", "medium")),
            assignee_id=task.get("assignee_id"),
            tags=task.get("tags") or [],
            due_date=task.get("due_date"),
            created_at=datetime.fromisoformat(str(task["created_at"]).replace("Z", "+00:00")) if task.get("created_at") else datetime.now(),
            updated_at=datetime.fromisoformat(str(task["updated_at"]).replace("Z", "+00:00")) if task.get("updated_at") else datetime.now(),
            order=float(task.get("order", 0.0)),
            metadata=task.get("metadata") or {}
        )
        tasks_by_status[status_val].append(card)

    # Sort cards by order within status
    for status in tasks_by_status:
        tasks_by_status[status].sort(key=lambda x: x.order)

    # Build columns
    for col_def in DEFAULT_COLUMNS:
        columns.append(KanbanColumn(
            id=col_def["id"],
            title=col_def["title"],
            status=col_def["status"],
            order=col_def["order"],
            cards=tasks_by_status[col_def["status"].value]
        ))

    return KanbanBoard(
        id=str(board_data["id"]),
        title=board_data["title"],
        description=board_data.get("description"),
        columns=columns,
        created_at=datetime.fromisoformat(str(board_data["created_at"]).replace("Z", "+00:00")) if board_data.get("created_at") else datetime.now(),
        updated_at=datetime.fromisoformat(str(board_data["updated_at"]).replace("Z", "+00:00")) if board_data.get("updated_at") else datetime.now(),
    )

@router.get("/boards", response_model=List[KanbanBoard], dependencies=[Depends(require_viewer)])
async def list_boards():
    """List all Kanban boards."""
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    # Fetch boards
    boards_res = db.table("kanban_boards").select("*").execute()
    if not boards_res.data:
        # If no boards, check if we should create a default one (migration logic)
        # For API response, just return empty or create default in DB?
        # Let's create a default one if table is empty to maintain MVP behavior
        try:
            default_board = db.table("kanban_boards").insert({
                "title": "Main Board",
                "description": "Default project board"
            }).execute()
            if default_board.data:
                boards_res.data = default_board.data
        except Exception:
            pass # Maybe table doesn't exist yet or auth issue

    boards = []
    for b_data in boards_res.data:
        # Fetch tasks for this board
        tasks_res = db.table("tasks").select("*").eq("board_id", b_data["id"]).execute()
        boards.append(_get_board_from_db(b_data, tasks_res.data))

    return boards

@router.get("/boards/{board_id}", response_model=KanbanBoard, dependencies=[Depends(require_viewer)])
async def get_board(board_id: str):
    """Get a specific Kanban board."""
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    # Handle "default" alias
    if board_id == "default":
        boards_res = db.table("kanban_boards").select("*").limit(1).execute()
        if not boards_res.data:
             # Create default
            boards_res = db.table("kanban_boards").insert({
                "title": "Main Board",
                "description": "Default project board"
            }).execute()
        board_data = boards_res.data[0]
    else:
        board_res = db.table("kanban_boards").select("*").eq("id", board_id).single().execute()
        if not board_res.data:
            raise HTTPException(status_code=404, detail="Board not found")
        board_data = board_res.data

    # Fetch tasks
    tasks_res = db.table("tasks").select("*").eq("board_id", board_data["id"]).execute()

    return _get_board_from_db(board_data, tasks_res.data)

@router.post("/boards", response_model=KanbanBoard, dependencies=[Depends(require_editor)])
async def create_board(title: str = Body(...), description: str = Body(None)):
    """Create a new Kanban board."""
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    res = db.table("kanban_boards").insert({
        "title": title,
        "description": description
    }).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create board")

    return _get_board_from_db(res.data[0], [])

@router.post("/boards/{board_id}/cards", response_model=KanbanCard, dependencies=[Depends(require_editor)])
async def create_card(board_id: str, card_req: CreateCardRequest):
    """Create a new card in a board."""
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    # Resolve board_id if "default"
    real_board_id = board_id
    if board_id == "default":
        boards_res = db.table("kanban_boards").select("id").limit(1).execute()
        if boards_res.data:
            real_board_id = boards_res.data[0]["id"]
        else:
             # Should create one, but for now error
             raise HTTPException(status_code=404, detail="Default board not found")

    data = {
        "board_id": real_board_id,
        "title": card_req.title,
        "description": card_req.description,
        "status": card_req.status.value if card_req.status else TaskStatus.TODO.value,
        "priority": card_req.priority.value if card_req.priority else TaskPriority.MEDIUM.value,
        "assignee_id": card_req.assignee_id,
        "tags": card_req.tags or [],
        "due_date": card_req.due_date.isoformat() if card_req.due_date else None,
        "order": 0.0 # Default order
        # metadata? tasks table might not have it unless JSONB. Assuming standard fields for now.
    }

    res = db.table("tasks").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create card")

    task = res.data[0]

    return KanbanCard(
        id=str(task["id"]),
        title=task["title"],
        description=task.get("description"),
        status=TaskStatus(task.get("status", "todo")),
        priority=TaskPriority(task.get("priority", "medium")),
        assignee_id=task.get("assignee_id"),
        tags=task.get("tags") or [],
        due_date=task.get("due_date"),
        created_at=datetime.fromisoformat(str(task["created_at"]).replace("Z", "+00:00")) if task.get("created_at") else datetime.now(),
        updated_at=datetime.fromisoformat(str(task["updated_at"]).replace("Z", "+00:00")) if task.get("updated_at") else datetime.now(),
        order=float(task.get("order", 0.0))
    )

@router.put("/cards/{card_id}", response_model=KanbanCard, dependencies=[Depends(require_editor)])
async def update_card(card_id: str, update_req: UpdateCardRequest):
    """Update a card."""
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    data = {}
    if update_req.title is not None:
        data["title"] = update_req.title
    if update_req.description is not None:
        data["description"] = update_req.description
    if update_req.status is not None:
        data["status"] = update_req.status.value
    if update_req.priority is not None:
        data["priority"] = update_req.priority.value
    if update_req.assignee_id is not None:
        data["assignee_id"] = update_req.assignee_id
    if update_req.tags is not None:
        data["tags"] = update_req.tags
    if update_req.due_date is not None:
        data["due_date"] = update_req.due_date.isoformat()
    if update_req.order is not None:
        data["order"] = update_req.order

    data["updated_at"] = datetime.now().isoformat()

    res = db.table("tasks").update(data).eq("id", card_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Card not found")

    task = res.data[0]
    return KanbanCard(
        id=str(task["id"]),
        title=task["title"],
        description=task.get("description"),
        status=TaskStatus(task.get("status", "todo")),
        priority=TaskPriority(task.get("priority", "medium")),
        assignee_id=task.get("assignee_id"),
        tags=task.get("tags") or [],
        due_date=task.get("due_date"),
        created_at=datetime.fromisoformat(str(task["created_at"]).replace("Z", "+00:00")) if task.get("created_at") else datetime.now(),
        updated_at=datetime.fromisoformat(str(task["updated_at"]).replace("Z", "+00:00")) if task.get("updated_at") else datetime.now(),
        order=float(task.get("order", 0.0))
    )

@router.delete("/cards/{card_id}", dependencies=[Depends(require_editor)])
async def delete_card(card_id: str):
    """Delete a card."""
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    db.table("tasks").delete().eq("id", card_id).execute()
    # Supabase delete returns rows if succesful?

    return {"status": "success", "message": "Card deleted"}
