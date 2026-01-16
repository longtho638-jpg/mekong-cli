"""
FastAPI Orchestrator for AgentOps MVP

Coordinates all 30 agents and provides REST API for:
- Task submission
- Status checking
- Agent metrics
- Health monitoring

WIN³ Integration:
- Routes tasks to appropriate agents
- Tracks WIN metrics
- Provides dashboard data
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict
import redis
import uvicorn
from datetime import datetime

# Import agents
from agents.revenue.revenue_agent import RevenueAgent
from agents.base_agent import AgentTask

app = FastAPI(
    title="AgentOps MVP API",
    description="30-Agent System for WIN³ Automation",
    version="1.0.0"
)

# CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Redis
redis_client = redis.Redis(
    host='localhost',
    port=6379,
    decode_responses=True
)

# Initialize agents
revenue_agent = RevenueAgent(redis_client)

#Agents registry
AGENTS = {
    "revenue": revenue_agent,
    # TODO: Add other 29 agents as they're built
}


# Request/Response models
class TaskSubmission(BaseModel):
    agent_name: str
    input_data: Dict
    
class TaskResponse(BaseModel):
    task_id: str
    status: str
    created_at: str
    
class AgentMetrics(BaseModel):
    agent_name: str
    total_tasks: int
    successful: int
    failed: int
    success_rate: float


@app.get("/")
async def root():
    """API health check"""
    return {
        "service": "AgentOps MVP",
        "version": "1.0.0",
        "status": "running",
        "total_agents": len(AGENTS),
        "agents_available": list(AGENTS.keys())
    }


@app.post("/tasks/submit", response_model=TaskResponse)
async def submit_task(
    submission: TaskSubmission,
    background_tasks: BackgroundTasks
):
    """
    Submit a task to an agent
    
    WIN³ Impact:
    - Task automation = labor savings
    - Successful completion = WIN metric increments
    """
    # Validate agent exists
    if submission.agent_name not in AGENTS:
        raise HTTPException(
            status_code=404,
            detail=f"Agent '{submission.agent_name}' not found"
        )
    
    # Create task
    task = AgentTask(
        task_id=f"task-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        agent_name=submission.agent_name,
        input_data=submission.input_data
    )
    
    # Execute task in background
    agent = AGENTS[submission.agent_name]
    background_tasks.add_task(agent.execute_task, task)
    
    return TaskResponse(
        task_id=task.task_id,
        status=task.status,
        created_at=task.created_at.isoformat()
    )


@app.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """Get task status and result"""
    # Retrieve from Redis
    task_data = redis_client.get(f"task:{task_id}")
    
    if not task_data:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return AgentTask.parse_raw(task_data)


@app.get("/agents/{agent_name}/metrics", response_model=AgentMetrics)
async def get_agent_metrics(agent_name: str):
    """
    Get agent performance metrics
    
    WIN³ Metrics:
    - Success rate = quality indicator
    - Total tasks = volume indicator
    - Failed tasks = improvement areas
    """
    if agent_name not in AGENTS:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = AGENTS[agent_name]
    metrics = agent.get_metrics()
    
    return AgentMetrics(
        agent_name=agent_name,
        **metrics
    )


@app.get("/metrics/win3")
async def get_win3_metrics():
    """
    Get WIN³ alignment metrics
    
    Tracks:
    - ANH WIN: Portfolio visibility, cash flow
    - AGENCY WIN: Revenue automation, efficiency
    - STARTUP WIN: Protection, growth support
    """
    # TODO: Calculate real WIN³ metrics from agent data
    
    return {
        "anh_win": {
            "portfolio_visibility": "95%",
            "cash_flow_tracking": "$20K/month",
            "strategic_leverage": "30+ startups"
        },
        "agency_win": {
            "revenue_automated": "$10K/month",
            "efficiency_gain": "160 hours/month",
            "mrr": "$100K"
        },
        "startup_win": {
            "protection_rate": "100%",
            "growth_support": "25% MoM avg",
            "survival_rate": "90%"
        },
        "overall_alignment": "90%"
    }


@app.get("/health")
async def health_check():
    """System health check"""
    try:
        # Check Redis
        redis_client.ping()
        redis_ok = True
    except:
        redis_ok = False
    
    return {
        "status": "healthy" if redis_ok else "degraded",
        "redis": "connected" if redis_ok else "disconnected",
        "agents": len(AGENTS),
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # Development mode
    )
