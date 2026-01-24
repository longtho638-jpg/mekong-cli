import os
from typing import Optional

import dspy


class GenerateAnswer(dspy.Signature):
    """Answer a question with short factoid answer."""
    question = dspy.InputField()
    answer = dspy.OutputField(desc="often between 1 and 5 words")

class CoT(dspy.Module):
    def __init__(self):
        super().__init__()
        self.prog = dspy.ChainOfThought(GenerateAnswer)

    def forward(self, question):
        return self.prog(question=question)

def setup_dspy():
    # In a real scenario, we might want to use the antigravity proxy or a specific model
    # For now, we'll try to use the environment's configured provider or default to OpenAI/Gemini if env vars are present

    # Check for GEMINI_API_KEY which seems to be the preferred provider in this project (Antigravity)
    if os.getenv("GEMINI_API_KEY"):
        lm = dspy.Google("models/gemini-1.5-flash", api_key=os.getenv("GEMINI_API_KEY"))
    elif os.getenv("OPENAI_API_KEY"):
        lm = dspy.OpenAI(model='gpt-3.5-turbo')
    else:
        # Fallback or error
        print("Warning: No API key found for DSPy. Please set GEMINI_API_KEY or OPENAI_API_KEY.")
        return None

    dspy.settings.configure(lm=lm)
    return lm

def run_dspy_task(question: str) -> str:
    """
    Runs a basic Chain of Thought task using DSPy.
    """
    setup_dspy()

    # Initialize the module
    cot = CoT()

    # Run the module
    try:
        pred = cot(question)
        return pred.answer
    except Exception as e:
        return f"Error running DSPy task: {str(e)}"

if __name__ == "__main__":
    # Test run
    import sys
    if len(sys.argv) > 1:
        q = sys.argv[1]
    else:
        q = "What is the capital of Vietnam?"

    print(f"Question: {q}")
    ans = run_dspy_task(q)
    print(f"Answer: {ans}")
