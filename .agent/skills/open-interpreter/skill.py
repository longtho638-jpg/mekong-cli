import os
import sys

from interpreter import interpreter


def run_interpreter_task(task: str) -> str:
    """
    Runs a task using Open Interpreter.
    Configured to use Gemini via LiteLLM or direct API if supported.
    For this skill, we'll try to use the 'gemini/gemini-1.5-flash' model via LiteLLM
    which Open Interpreter supports.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "Error: GEMINI_API_KEY not found."

    # Configure Interpreter
    interpreter.auto_run = True
    interpreter.llm.model = "gemini/gemini-1.5-flash"
    interpreter.llm.api_key = api_key

    # Optional: Set a system message or safe mode
    # interpreter.safe_mode = "ask" # "off" or "ask" or "auto"

    try:
        # Run the task
        # interpreter.chat() starts an interactive session.
        # interpreter.chat("message") runs a single message.
        messages = interpreter.chat(task)

        # The result is usually a list of messages. We extract the last one.
        if messages and isinstance(messages, list):
            return str(messages[-1])
        return str(messages)

    except Exception as e:
        return f"Error running Open Interpreter task: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        task_input = sys.argv[1]
    else:
        task_input = "Print 'Hello from Open Interpreter' using python."

    print(f"Running Interpreter task: {task_input}")
    result = run_interpreter_task(task_input)
    print(f"Result: {result}")
