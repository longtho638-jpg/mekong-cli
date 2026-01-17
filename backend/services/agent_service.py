"""
Agent Service - Business logic for agent operations
"""

from typing import Dict, List, Optional, Any
from backend.models.agent import AgentTask, AgentResponse


class AgentService:
    """Service for managing agent operations"""
    
    def __init__(self):
        self.valid_agents = [
            "scout", "editor", "director", "community",
            "market-analyst", "zalo-integrator", "local-copywriter"
        ]
    
    async def list_agents(self) -> Dict[str, Any]:
        """List all available agents with their status"""
        quad_agents = [
            {"name": "Scout", "role": "Thu thập thông tin", "status": "ready"},
            {"name": "Editor", "role": "Biên tập nội dung", "status": "ready"},
            {"name": "Director", "role": "Đạo diễn video", "status": "ready"},
            {"name": "Community", "role": "Đăng bài & tương tác", "status": "ready"},
        ]
        
        mekong_agents = [
            {"name": "Market Analyst", "role": "Phân tích giá nông sản ĐBSCL", "status": "ready"},
            {"name": "Zalo Integrator", "role": "Tích hợp Zalo OA/Mini App", "status": "ready"},
            {"name": "Local Copywriter", "role": "Viết content giọng địa phương", "status": "ready"},
        ]
        
        return {
            "quad_agents": quad_agents,
            "mekong_agents": mekong_agents,
            "total": len(quad_agents) + len(mekong_agents)
        }
    
    async def execute_agent_task(self, task: AgentTask) -> AgentResponse:
        """Execute a task for a specific agent"""
        if task.agent_name.lower() not in self.valid_agents:
            raise ValueError(f"Unknown agent: {task.agent_name}")
        
        # Simulate agent execution - in production would call actual agent
        job_id = "job_" + str(hash(task.task))[-8:]
        
        return AgentResponse(
            status="queued",
            agent=task.agent_name,
            task=task.task,
            estimated_time="30s",
            job_id=job_id
        )