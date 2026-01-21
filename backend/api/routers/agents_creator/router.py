from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import json
from pathlib import Path

router = APIRouter(prefix="/agents-creator", tags=["agents-creator"])

class AgentDefinition(BaseModel):
    name: str
    role: str
    description: str
    skills: List[str]
    tools: List[str]
    model: str = "gemini-1.5-pro"

@router.get("/skills")
async def list_available_skills():
    """List available skills from catalog."""
    # In a real app, read from skill registry
    return [
        "web_search", "code_analysis", "content_writing",
        "data_processing", "image_generation", "email_sending"
    ]

@router.post("/create")
async def create_agent(agent: AgentDefinition):
    """Create a new custom agent."""
    # Save to agents directory
    agents_dir = Path("packages/agents/custom")
    agents_dir.mkdir(parents=True, exist_ok=True)

    file_path = agents_dir / f"{agent.name.lower().replace(' ', '_')}.json"

    with open(file_path, "w") as f:
        json.dump(agent.dict(), f, indent=2)

    return {"success": True, "path": str(file_path)}
