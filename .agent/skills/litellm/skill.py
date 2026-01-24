import os
import sys

from litellm import completion


def run_litellm_task(prompt: str) -> str:
    """
    Runs a completion task using LiteLLM with Gemini.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        # LiteLLM can also read from GEMINI_API_KEY env var directly if not passed explicitly,
        # but good to check.
        pass

    try:
        # LiteLLM abstracts the provider details.
        # Format: provider/model_name
        model = "gemini/gemini-1.5-flash"

        # If using OpenAI
        # model = "gpt-4o"

        response = completion(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            api_key=api_key
        )

        return response.choices[0].message.content

    except Exception as e:
        return f"Error running LiteLLM task: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        task_input = sys.argv[1]
    else:
        task_input = "What are the benefits of using LiteLLM?"

    print(f"Running LiteLLM task: {task_input}")
    result = run_litellm_task(task_input)
    print(f"Result: {result}")
