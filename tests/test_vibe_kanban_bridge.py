"""
Tests for Vibe Kanban Bridge
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from antigravity.vibe_kanban_bridge import VibeBoardClient, TaskModel, AgentOrchestrator

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.fixture
def mock_client():
    with patch("httpx.AsyncClient") as mock:
        yield mock

@pytest.mark.anyio
async def test_create_task(mock_client):
    # Setup mock response
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "id": "TASK-123",
        "title": "Test Task",
        "description": "Desc",
        "agent_assigned": "planner",
        "status": "todo",
        "priority": "P1",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    mock_response.raise_for_status = MagicMock()
    
    # Mock the post method of the client instance
    client_instance = AsyncMock()
    client_instance.post.return_value = mock_response
    mock_client.return_value = client_instance

    client = VibeBoardClient()
    # Manually attach mock instance because VibeBoardClient creates it in __init__
    client.client = client_instance 
    
    task = await client.create_task("Test Task", "Desc", "planner", "P1")
    
    assert task.id == "TASK-123"
    assert task.title == "Test Task"
    assert task.agent_assigned == "planner"

@pytest.mark.anyio
async def test_list_tasks(mock_client):
    mock_response = MagicMock()
    mock_response.json.return_value = [
        {
            "id": "1", "title": "T1", "agent_assigned": "planner", "status": "todo", "priority": "P1",
            "created_at": datetime.now().isoformat(), "updated_at": datetime.now().isoformat()
        },
        {
            "id": "2", "title": "T2", "agent_assigned": "money-maker", "status": "in_progress", "priority": "P2",
            "created_at": datetime.now().isoformat(), "updated_at": datetime.now().isoformat()
        }
    ]
    mock_response.raise_for_status = MagicMock()
    
    client_instance = AsyncMock()
    client_instance.get.return_value = mock_response
    mock_client.return_value = client_instance

    client = VibeBoardClient()
    client.client = client_instance
    
    tasks = await client.list_tasks()
    assert len(tasks) == 2
    assert tasks[0].title == "T1"

@pytest.mark.anyio
async def test_orchestrator_workload(mock_client):
    mock_response = MagicMock()
    mock_response.json.return_value = [
        {"id": "1", "title": "T1", "agent_assigned": "planner", "status": "in_progress", "priority": "P1", "created_at": datetime.now().isoformat(), "updated_at": datetime.now().isoformat()},
        {"id": "2", "title": "T2", "agent_assigned": "planner", "status": "todo", "priority": "P1", "created_at": datetime.now().isoformat(), "updated_at": datetime.now().isoformat()},
        {"id": "3", "title": "T3", "agent_assigned": "money-maker", "status": "done", "priority": "P1", "created_at": datetime.now().isoformat(), "updated_at": datetime.now().isoformat()}
    ]
    mock_response.raise_for_status = MagicMock()
    
    client_instance = AsyncMock()
    client_instance.get.return_value = mock_response
    
    client = VibeBoardClient()
    client.client = client_instance
    
    orchestrator = AgentOrchestrator(client)
    workload = await orchestrator.get_agent_workload()
    
    assert workload["planner"] == 2
    assert workload["money-maker"] == 0 # Done tasks don't count as workload
