from fastapi import APIRouter, HTTPException

from backend.api.schemas import AgentTask

router = APIRouter(prefix="/api/agents", tags=["Agents"])


@router.get("")
async def get_agents():
    """List all available agents and their status"""
    return {
        "quad_agents": [
            {"name": "Scout", "role": "Thu thập thông tin", "status": "ready"},
            {"name": "Editor", "role": "Biên tập nội dung", "status": "ready"},
            {"name": "Director", "role": "Đạo diễn video", "status": "ready"},
            {"name": "Community", "role": "Đăng bài & tương tác", "status": "ready"},
        ],
        "mekong_agents": [
            {"name": "Market Analyst", "role": "Phân tích giá nông sản ĐBSCL", "status": "ready"},
            {"name": "Zalo Integrator", "role": "Tích hợp Zalo OA/Mini App", "status": "ready"},
            {
                "name": "Local Copywriter",
                "role": "Viết content giọng địa phương",
                "status": "ready",
            },
        ],
        "total": 7,
    }


@router.post("/run")
async def run_agent(task: AgentTask):
    """Run a specific agent with a task"""
    valid_agents = [
        "scout",
        "editor",
        "director",
        "community",
        "market-analyst",
        "zalo-integrator",
        "local-copywriter",
    ]

    if task.agent_name.lower() not in valid_agents:
        raise HTTPException(status_code=400, detail=f"Unknown agent: {task.agent_name}")

    # Simulate agent execution
    return {
        "status": "queued",
        "agent": task.agent_name,
        "task": task.task,
        "estimated_time": "30s",
        "job_id": "job_" + str(hash(task.task))[-8:],
    }
