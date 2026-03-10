---
name: agentic-ai-frameworks
description: "Expert in multi-agent AI frameworks for 2026. Covers LangGraph (graph-based, production-grade), CrewAI (role-based, 44k GitHub stars), AG2/AutoGen (conversational multi-agent), OpenAI Agents SDK (built-in tool calling), Pydantic AI (type-safe), Google ADK (Gemini-optimized), Amazon Bedrock Agents. Selection matrix: CrewAI = easy start, LangGraph = max flexibility/production, ADK = Gemini optimized. A2A protocol for cross-framework agent communication. MCP for tool integration. Use when: multi-agent, agentic AI, LangGraph, CrewAI, AutoGen, AG2, OpenAI Agents, Google ADK, Pydantic AI, agent orchestration, agent memory, agent observability, Langfuse, LangSmith."
source: research-driven-2026
---

# Agentic AI Frameworks — Multi-Agent Patterns (2026)

> 2026 framework landscape: LangGraph powers LinkedIn/Uber in production; CrewAI has 44k GitHub stars and is used by 60% of Fortune 500 for role-based automation; Google ADK launched Q1 2026 for Gemini-native agentic workflows; OpenAI Agents SDK replaced Assistants API as the primary OpenAI agent primitive.

## When to Activate

- User asks which AI agent framework to choose for their use case
- Building multi-agent systems: orchestrator + specialist agents
- Need persistent state, human-in-the-loop, or long-running agent workflows
- Integrating agents with tools via MCP (Model Context Protocol)
- Cross-framework agent communication via A2A protocol
- Agent observability: tracing, debugging, cost tracking with Langfuse or LangSmith

## Framework Selection Matrix

| Framework | Best For | Language | Stars | Production Use |
|-----------|----------|----------|-------|----------------|
| **LangGraph** | Complex stateful workflows, max control | Python, JS | 12k | LinkedIn, Uber, Klarna |
| **CrewAI** | Role-based teams, quick start | Python | 44k | Fortune 500, SMBs |
| **AG2 (AutoGen v0.4)** | Conversational multi-agent, research | Python | 40k | Microsoft Research |
| **OpenAI Agents SDK** | OpenAI-first, built-in tracing | Python | 8k | OpenAI ecosystem |
| **Pydantic AI** | Type-safe, FastAPI-style | Python | 7k | Type-strict teams |
| **Google ADK** | Gemini-optimized, Vertex AI native | Python | 4k | Google Cloud shops |
| **Amazon Bedrock Agents** | AWS-native, no-code option | Python/Console | N/A | AWS-first orgs |

**Decision rule:**
- Prototype fast → **CrewAI**
- Production stateful with cycles → **LangGraph**
- Gemini 2.5 Pro/Flash → **Google ADK**
- Type safety critical → **Pydantic AI**
- AWS/Bedrock locked → **Amazon Bedrock Agents**

## Architecture Patterns

### LangGraph — Stateful Supervisor Pattern

```python
from langgraph.graph import StateGraph, START, END
from langgraph.types import Command
from typing import Annotated, TypedDict, Literal
from langchain_core.messages import HumanMessage, AIMessage
from langchain_anthropic import ChatAnthropic

class AgentState(TypedDict):
    messages: Annotated[list, lambda x, y: x + y]  # reducer: append messages
    current_agent: str
    task_complete: bool
    iteration_count: int

def supervisor_node(state: AgentState) -> Command[Literal["researcher", "writer", "reviewer", END]]:
    """Supervisor decides which agent to call next (or end)."""
    llm = ChatAnthropic(model="claude-opus-4-6")
    SUPERVISOR_PROMPT = """You are orchestrating a team. Based on messages, decide:
    - "researcher" — needs more information
    - "writer" — ready to draft content
    - "reviewer" — draft ready for review
    - "FINISH" — task complete
    Output ONLY the next agent name."""

    response = llm.invoke([
        {"role": "system", "content": SUPERVISOR_PROMPT},
        *[{"role": m["role"], "content": m["content"]} for m in state["messages"][-5:]]
    ])
    next_agent = response.content.strip().upper()

    if next_agent == "FINISH" or state["iteration_count"] > 10:
        return Command(goto=END)
    return Command(
        goto=next_agent.lower(),
        update={"iteration_count": state["iteration_count"] + 1}
    )

def researcher_node(state: AgentState) -> AgentState:
    llm = ChatAnthropic(model="claude-sonnet-4-6")
    response = llm.invoke([
        {"role": "system", "content": "You are a researcher. Find relevant information."},
        *state["messages"]
    ])
    return {"messages": [{"role": "assistant", "content": f"[RESEARCH]: {response.content}"}]}

# Build graph
builder = StateGraph(AgentState)
builder.add_node("supervisor", supervisor_node)
builder.add_node("researcher", researcher_node)
# ... add writer, reviewer nodes
builder.add_edge(START, "supervisor")
# supervisor uses Command for routing — no explicit conditional edges needed

graph = builder.compile(
    checkpointer=MemorySaver()  # persistent state across interrupts
)

# Run with thread_id for persistent memory
config = {"configurable": {"thread_id": "session-123"}}
result = graph.invoke(
    {"messages": [{"role": "user", "content": "Research and write about quantum computing"}],
     "iteration_count": 0, "task_complete": False},
    config=config
)
```

### Google ADK — Gemini-Native Multi-Agent

```python
# Google Agent Development Kit (ADK) — GA Q1 2026
# pip install google-adk

from google.adk.agents import Agent, SequentialAgent, ParallelAgent
from google.adk.tools import google_search, code_execution
from google.adk.sessions import InMemorySessionService

# Define specialist agents
research_agent = Agent(
    name="researcher",
    model="gemini-2.5-pro",  # Gemini 2.5 Pro with 1M context
    instruction="""You are a research specialist. Use google_search to find
    accurate, up-to-date information. Always cite sources.""",
    tools=[google_search],
)

analysis_agent = Agent(
    name="analyst",
    model="gemini-2.5-flash",  # Flash for speed/cost efficiency
    instruction="Analyze research findings and produce structured insights.",
    tools=[code_execution],  # Can run Python for data analysis
)

# Orchestrator agent — routes to sub-agents
orchestrator = Agent(
    name="orchestrator",
    model="gemini-2.5-pro",
    instruction="""You coordinate research and analysis tasks.
    Delegate to 'researcher' for information gathering,
    'analyst' for data analysis and insights.""",
    sub_agents=[research_agent, analysis_agent],
)

# ADK Runner
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

session_service = InMemorySessionService()
runner = Runner(
    agent=orchestrator,
    app_name="research-pipeline",
    session_service=session_service,
)

# Streaming execution
async def run_research(query: str):
    session = await session_service.create_session(app_name="research-pipeline")
    async for event in runner.run_async(
        user_id="user-1",
        session_id=session.id,
        new_message={"role": "user", "parts": [{"text": query}]}
    ):
        if event.is_final_response():
            print(event.text)
```

### OpenAI Agents SDK — Built-in Handoffs

```python
# OpenAI Agents SDK (replaces Assistants API v2)
# pip install openai-agents

from agents import Agent, Runner, handoff, tool
from agents.tracing import trace

@tool
async def search_web(query: str) -> str:
    """Search the web for current information."""
    # Implement with Tavily, Exa, or Bing Search API
    ...

@tool
async def write_report(content: str, format: str) -> str:
    """Format and save a report."""
    ...

# Specialist agents
researcher = Agent(
    name="Researcher",
    instructions="You research topics thoroughly using web search.",
    tools=[search_web],
)

writer = Agent(
    name="Writer",
    instructions="You write clear, professional reports from research.",
    tools=[write_report],
)

# Orchestrator with handoffs
orchestrator = Agent(
    name="Orchestrator",
    instructions="""You coordinate research and writing tasks.
    - Use 'transfer_to_researcher' when information gathering is needed
    - Use 'transfer_to_writer' when ready to create the report""",
    handoffs=[
        handoff(researcher, tool_name_override="transfer_to_researcher"),
        handoff(writer, tool_name_override="transfer_to_writer"),
    ],
)

# Run with built-in OpenAI tracing (no extra setup)
with trace("research-workflow"):
    result = await Runner.run(
        orchestrator,
        "Research the impact of CSRD on European SMEs and write a 1-page summary"
    )
    print(result.final_output)
```

### Pydantic AI — Type-Safe Agent Patterns

```python
# pip install pydantic-ai

from pydantic_ai import Agent
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic import BaseModel
from typing import Annotated

# Structured output with Pydantic validation
class MarketAnalysis(BaseModel):
    company: str
    market_size_usd_bn: float
    growth_rate_percent: float
    key_competitors: list[str]
    recommendation: Annotated[str, "BUY, HOLD, or SELL only"]
    confidence: Annotated[float, "0.0 to 1.0"]

# Type-safe agent — always returns validated MarketAnalysis
analyst_agent = Agent(
    model=AnthropicModel("claude-opus-4-6"),
    result_type=MarketAnalysis,
    system_prompt="""You are a market analyst. Analyze companies and return
    structured analysis with exact numeric values.""",
)

# Run — output is always a validated MarketAnalysis instance
async def analyze_company(company_name: str) -> MarketAnalysis:
    result = await analyst_agent.run(
        f"Analyze {company_name} — market size, growth, competitors, recommendation"
    )
    return result.data  # type: MarketAnalysis — fully validated

# Dependency injection for shared resources
from pydantic_ai import RunContext
from dataclasses import dataclass

@dataclass
class AgentDeps:
    db_conn: AsyncConnection
    api_client: httpx.AsyncClient

agent_with_deps = Agent(
    model=AnthropicModel("claude-opus-4-6"),
    deps_type=AgentDeps,  # injected into every tool call
    result_type=MarketAnalysis,
)

@agent_with_deps.tool
async def fetch_financials(ctx: RunContext[AgentDeps], ticker: str) -> dict:
    """Fetch real financial data for analysis."""
    return await ctx.deps.api_client.get(f"/financials/{ticker}")
```

### Agent Observability — Langfuse Integration

```python
# pip install langfuse langchain

from langfuse import Langfuse
from langfuse.callback import CallbackHandler
from langchain_anthropic import ChatAnthropic

langfuse = Langfuse(
    public_key=os.environ["LANGFUSE_PUBLIC_KEY"],
    secret_key=os.environ["LANGFUSE_SECRET_KEY"],
    host="https://cloud.langfuse.com",  # or self-hosted
)

# Auto-trace LangChain/LangGraph via callback
langfuse_handler = CallbackHandler()

# LangGraph with tracing
config = {
    "configurable": {"thread_id": "session-123"},
    "callbacks": [langfuse_handler],  # captures all LLM calls + costs
}
result = graph.invoke(user_input, config=config)

# Manual spans for non-LangChain frameworks
with langfuse.span(name="agent-workflow", input={"query": query}) as span:
    # Execute agent
    result = await my_agent.run(query)
    span.end(output=result, metadata={"tokens": result.usage})

# CrewAI tracing (built-in Langfuse support in CrewAI 0.70+)
from crewai import Crew
crew = Crew(
    agents=[...],
    tasks=[...],
    verbose=True,
    # Langfuse auto-detected from environment variables
)
```

### A2A Protocol — Cross-Framework Agent Communication

```python
# A2A (Agent-to-Agent) Protocol — Google open standard 2026
# Allows agents from different frameworks to communicate
# spec: https://google-a2a.github.io/A2A/

from a2a.server import A2AServer, AgentCard
from a2a.types import Message, TextPart, Task

# Expose any agent as A2A-compatible server
agent_card = AgentCard(
    name="carbon-calculator-agent",
    description="Calculate GHG emissions for activities",
    url="https://carbon-agent.example.com",
    version="1.0.0",
    capabilities={"streaming": True, "push_notifications": False},
    skills=[{
        "id": "calculate_emissions",
        "name": "Calculate GHG Emissions",
        "description": "Calculate Scope 1/2/3 emissions from activity data",
        "input_modes": ["text"],
        "output_modes": ["text"],
    }]
)

# Any LangGraph/CrewAI/ADK agent can call this via standard HTTP
# POST /tasks/send {"message": {"role": "user", "parts": [{"text": "..."}]}}
```

### MCP Tool Integration

```python
# Model Context Protocol — universal tool integration
# Works with LangGraph, CrewAI, OpenAI Agents, ADK, Pydantic AI

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langchain_mcp_adapters.tools import load_mcp_tools

async def get_mcp_tools():
    """Load tools from MCP server into LangChain-compatible format."""
    server_params = StdioServerParameters(
        command="npx",
        args=["-y", "@modelcontextprotocol/server-filesystem", "/data"],
    )
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await load_mcp_tools(session)  # LangChain Tool objects
            return tools

# Use MCP tools in LangGraph
tools = await get_mcp_tools()
tool_node = ToolNode(tools)
```

## Key Technologies & APIs

- **LangGraph 0.3+**: `pip install langgraph` — `https://langchain-ai.github.io/langgraph/`; `MemorySaver` for SQLite persistence, `PostgresSaver` for production
- **CrewAI 0.80+**: `pip install crewai` — `https://docs.crewai.com`; Flows for event-driven workflows (0.70+)
- **AG2 (AutoGen v0.4)**: `pip install pyautogen` — `https://ag2ai.github.io/ag2/`; `GroupChat` + `AssistantAgent`
- **OpenAI Agents SDK 0.0.x**: `pip install openai-agents` — `https://openai.github.io/openai-agents-python/`
- **Pydantic AI 0.0.x**: `pip install pydantic-ai` — `https://ai.pydantic.dev`; supports OpenAI, Anthropic, Gemini, Groq
- **Google ADK**: `pip install google-adk` — `https://google.github.io/adk-docs/`; Vertex AI + Gemini optimized
- **Langfuse**: `pip install langfuse` — `https://langfuse.com`; open-source LLM observability, cost tracking, eval
- **LangSmith**: `pip install langsmith` — `https://smith.langchain.com`; LangChain's native tracing
- **A2A Protocol**: `https://google-a2a.github.io/A2A/` — cross-framework agent-to-agent communication
- **MCP (Model Context Protocol)**: `https://modelcontextprotocol.io` — universal tool/resource protocol for agents

## Implementation Checklist

- [ ] Select framework using matrix: use case → complexity → team familiarity
- [ ] For LangGraph: define `TypedDict` state with reducers before building nodes
- [ ] For CrewAI: write detailed `role` + `goal` + `backstory` (vague roles = poor results)
- [ ] Set up Langfuse or LangSmith before first run — tracing reveals 80% of issues
- [ ] Implement max_iterations guard in all agent loops (default: 10)
- [ ] Use MCP for tool integration — avoids rebuilding tool wrappers per framework
- [ ] Test with `human_in_the_loop` interrupts early — add later = architecture refactor
- [ ] Benchmark: token cost per task end-to-end before choosing model (GPT-4o vs Claude Sonnet = 3–5× cost difference)
- [ ] Configure structured output (Pydantic models) for all agent outputs — prevents downstream parsing failures

## Best Practices

- **State over conversation history** — LangGraph `TypedDict` state is more reliable than appending raw messages; store structured data (counts, flags, extracted entities) in state
- **Supervisor with max iterations** — always add `iteration_count` to state and terminate at 10–15 iterations; agentic loops without hard caps run forever on edge cases
- **Model selection per role** — orchestrators need strong reasoning (Claude Opus, GPT-4o); specialists can use faster/cheaper models (Claude Sonnet, Gemini Flash); 3–5× cost reduction
- **Tracing from day 1** — Langfuse captures every LLM call, token count, and latency; impossible to optimize cost/quality without this data
- **Human-in-the-loop for high-risk actions** — use LangGraph `interrupt()` or CrewAI `human_input=True` for irreversible actions (send email, write to DB, call external API)

## Anti-Patterns

- **Full conversation history as context** — passing 50+ messages to each agent call is expensive and degrades quality; summarize or use structured state instead
- **CrewAI for real-time streaming UX** — CrewAI is batch-oriented; for streaming responses to UI, use LangGraph with `astream_events` or OpenAI Agents SDK streaming
- **AutoGen GroupChat for production** — GroupChat's unstructured conversation is hard to debug; use explicit routing (LangGraph Command or CrewAI hierarchical) in production
- **Single framework for entire platform** — use A2A protocol to let different teams own different agents in their preferred framework; avoid forcing one framework on all teams

## References

- LangGraph Docs: `https://langchain-ai.github.io/langgraph/`
- CrewAI Docs: `https://docs.crewai.com`
- Google ADK Docs: `https://google.github.io/adk-docs/`
- OpenAI Agents SDK: `https://openai.github.io/openai-agents-python/`
- Pydantic AI Docs: `https://ai.pydantic.dev`
- AG2 (AutoGen v0.4): `https://ag2ai.github.io/ag2/`
- Langfuse Docs: `https://langfuse.com/docs`
- A2A Protocol Spec: `https://google-a2a.github.io/A2A/`
- MCP Spec: `https://modelcontextprotocol.io/introduction`
