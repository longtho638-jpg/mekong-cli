import os
import sys
from agno.agent import Agent
from agno.models.google import Gemini

def run_agno_agent(task: str) -> str:
    """
    Runs an Agno agent with Gemini model.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "Error: GEMINI_API_KEY not found."

    try:
        # Initialize the agent with Gemini Flash for speed/cost
        agent = Agent(
            model=Gemini(id="gemini-1.5-flash", api_key=api_key),
            markdown=True,
            description="You are an intelligent agent powered by Agno framework and Gemini model."
        )

        # Run the agent
        response = agent.run(task)

        # Handle response object
        if hasattr(response, 'content'):
            return response.content
        return str(response)

    except Exception as e:
        return f"Error running Agno agent: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        task_input = sys.argv[1]
    else:
        task_input = "Introduce yourself briefly."

    print(f"Running Agno task: {task_input}")
    result = run_agno_agent(task_input)
    print(f"Result: {result}")
