import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import sys
from datetime import datetime

# Mock imports if needed (similar to other integration tests)
from backend.api.main import app
from backend.core.security.rbac import require_viewer, require_editor
from backend.api.schemas.kanban import TaskStatus, TaskPriority

# Override authentication dependencies
app.dependency_overrides[require_viewer] = lambda: MagicMock(role="viewer")
app.dependency_overrides[require_editor] = lambda: MagicMock(role="editor")

client = TestClient(app)

@pytest.fixture
def mock_db():
    with patch("backend.api.routers.kanban.get_db") as mock:
        yield mock

def test_kanban_flow(mock_db):
    # Setup mock DB responses
    mock_client = MagicMock()
    mock_db.return_value = mock_client

    # 1. List boards (should have default)
    # Mock response for listing boards
    mock_client.table.return_value.select.return_value.execute.return_value.data = [
        {"id": "default", "title": "Main Board", "description": "Default project board", "created_at": datetime.now().isoformat(), "updated_at": datetime.now().isoformat()}
    ]
    # Mock response for tasks in list_boards loop
    # Just return empty tasks for now to simplify
    # But wait, list_boards iterates and calls table("tasks").select...
    # We need to structure the mock to handle multiple calls or return distinct values

    # Let's simplify and test endpoints individually or with specific mocks per call context if possible,
    # or setup a robust mock chain.

    # For list_boards:
    # 1. table("kanban_boards").select("*").execute() -> returns [board]
    # 2. table("tasks").select("*").eq(..).execute() -> returns []

    def table_side_effect(table_name):
        mock_table = MagicMock()
        if table_name == "kanban_boards":
            mock_table.select.return_value.execute.return_value.data = [
                {"id": "default", "title": "Main Board", "description": "Default project board", "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z"}
            ]
            # Handle insert for default creation case (not hit if select returns data)
            mock_table.insert.return_value.execute.return_value.data = []

            # Handle get specific board
            mock_table.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
                "id": "default", "title": "Main Board", "description": "Default project board", "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z"
            }
            # For create board
            mock_table.insert.return_value.execute.return_value.data = [{
                "id": "new-board", "title": "Project Alpha", "description": "Top secret project", "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z"
            }]

        elif table_name == "tasks":
            mock_table.select.return_value.eq.return_value.execute.return_value.data = []
            # For create card
            mock_table.insert.return_value.execute.return_value.data = [{
                "id": "card-1", "title": "Implement Login", "description": "Add JWT auth", "status": "todo", "priority": "high", "board_id": "new-board", "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z", "order": 0.0
            }]
            # For update card
            mock_table.update.return_value.eq.return_value.execute.return_value.data = [{
                "id": "card-1", "title": "Implement Login", "description": "Add JWT auth", "status": "in_progress", "priority": "high", "board_id": "new-board", "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z", "order": 0.0
            }]

        return mock_table

    mock_client.table.side_effect = table_side_effect

    # 1. List boards
    response = client.get("/api/kanban/boards")
    assert response.status_code == 200
    boards = response.json()
    assert len(boards) >= 1
    assert boards[0]["id"] == "default"

    # 2. Create a new board
    new_board_data = {
        "title": "Project Alpha",
        "description": "Top secret project"
    }
    response = client.post("/api/kanban/boards", json=new_board_data)
    assert response.status_code == 200
    created_board = response.json()
    assert created_board["title"] == "Project Alpha"
    # Note: Mock returns 'new-board' ID

    # 3. Add a card to the new board
    # We need to update the mock for tasks to return the card we just "created"
    # handled in side_effect logic roughly

    card_data = {
        "title": "Implement Login",
        "description": "Add JWT auth",
        "status": "todo",
        "priority": "high",
        "tags": ["auth", "backend"]
    }
    # Mocking board existence check for create_card
    # It calls table("kanban_boards").select("id").limit(1) if default
    # or creates directly if ID provided.

    response = client.post(f"/api/kanban/boards/new-board/cards", json=card_data)
    assert response.status_code == 200
    card = response.json()
    assert card["title"] == "Implement Login"

    # 4. Update card
    update_data = {
        "status": "in_progress"
    }
    response = client.put(f"/api/kanban/cards/card-1", json=update_data)
    assert response.status_code == 200
    updated_card = response.json()
    assert updated_card["status"] == "in_progress"

    # 5. Delete card
    response = client.delete(f"/api/kanban/cards/card-1")
    assert response.status_code == 200
