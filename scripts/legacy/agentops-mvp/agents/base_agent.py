"""
Base Agent Class for AgentOps MVP

All agents inherit from this base class which provides:
- LangChain integration
- OpenAI connection
- Redis queue handling
- Error handling & retries
- Monitoring hooks
"""

from typing import Any, Dict, List, Optional
from abc import ABC, abstractmethod
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from pydantic import BaseModel, Field
import redis
import json
import os
from datetime import datetime

# Attempt to import centralized settings
try:
    from core.config import get_settings
except ImportError:
    try:
        from ...core.config import get_settings
    except ImportError:
        # Fallback to os.getenv wrapper if config module unreachable
        def get_settings():
            class Settings:
                OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
            return Settings()


class AgentConfig(BaseModel):
    """Configuration for an agent"""
    name: str
    description: str
    model: str = "gpt-4"
    temperature: float = 0.7
    max_retries: int = 3
    timeout: int = 30


class AgentTask(BaseModel):
    """Task structure for agent queue"""
    task_id: str
    agent_name: str
    input_data: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.now)
    status: str = "pending"  # pending, running, completed, failed
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class BaseAgent(ABC):
    """
    Base class for all AgentOps agents
    
    WIN³ Framework Integration:
    - Agents execute autonomous tasks
    - Results feed into WIN metrics
    - Failures trigger alerts
    """

    def __init__(self, config: AgentConfig, redis_client: redis.Redis):
        self.config = config
        self.redis = redis_client

        settings = get_settings()

        # Use OpenRouter for cost-effective LLM access
        self.llm = ChatOpenAI(
            model=config.model,
            temperature=config.temperature,
            openai_api_base="https://openrouter.ai/api/v1",
            openai_api_key=settings.OPENROUTER_API_KEY,
            model_kwargs={
                "headers": {
                    "HTTP-Referer": "https://agency-os.com",
                    "X-Title": "Agency OS - AgentOps MVP"
                }
            }
        )

        # Initialize LangChain agent
        self.agent = self._create_agent()

    @abstractmethod
    def _get_system_prompt(self) -> str:
        """
        Define the agent's system prompt
        Each agent type overrides this
        """
        pass

    @abstractmethod
    def _get_tools(self) -> List:
        """
        Define the agent's available tools
        Each agent type defines its specific tools
        """
        pass

    def _create_agent(self) -> AgentExecutor:
        """Create the LangChain agent with tools"""
        prompt = ChatPromptTemplate.from_messages([
            ("system", self._get_system_prompt()),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])

        agent = create_openai_functions_agent(
            llm=self.llm,
            tools=self._get_tools(),
            prompt=prompt
        )

        return AgentExecutor(
            agent=agent,
            tools=self._get_tools(),
            verbose=True,
            max_iterations=5
        )

    async def execute_task(self, task: AgentTask) -> AgentTask:
        """
        Execute a task and return result
        
        WIN³ Impact:
        - Success = contributes to WIN metrics
        - Failure = logged for improvement
        """
        try:
            # Update task status
            task.status = "running"
            self._save_task(task)

            # Execute  with agent
            result = await self.agent.ainvoke({
                "input": self._format_input(task.input_data)
            })

            # Save result
            task.status = "completed"
            task.result = result
            self._save_task(task)

            # Update metrics
            self._record_success()

            return task

        except Exception as e:
            task.status = "failed"
            task.error = str(e)
            self._save_task(task)
            self._record_failure()
            raise

    def _format_input(self, data: Dict[str, Any]) -> str:
        """Format input data for the agent"""
        return json.dumps(data, indent=2)

    def _save_task(self, task: AgentTask):
        """Save task state to Redis"""
        key = f"task:{task.task_id}"
        self.redis.setex(
            key,
            3600,  # 1 hour TTL
            task.json()
        )

    def _record_success(self):
        """Record successful task execution"""
        key = f"agent:{self.config.name}:success_count"
        self.redis.incr(key)

    def _record_failure(self):
        """Record failed task execution"""
        key = f"agent:{self.config.name}:failure_count"
        self.redis.incr(key)

    def get_metrics(self) -> Dict[str, int]:
        """Get agent performance metrics"""
        success_key = f"agent:{self.config.name}:success_count"
        failure_key = f"agent:{self.config.name}:failure_count"

        success = int(self.redis.get(success_key) or 0)
        failure = int(self.redis.get(failure_key) or 0)
        total = success + failure

        return {
            "total_tasks": total,
            "successful": success,
            "failed": failure,
            "success_rate": (success / total * 100) if total > 0 else 0
        }
