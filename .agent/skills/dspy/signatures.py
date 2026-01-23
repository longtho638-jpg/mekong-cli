"""
DSPy Signatures for AgencyOS Prompt Patterns
Integrates with prompt-engineer.md patterns
"""

from typing import List, Optional

import dspy

# ============= Core Signatures =============


class ZeroShotQA(dspy.Signature):
    """Zero-shot question answering without examples."""

    question = dspy.InputField(desc="The question to answer")
    answer = dspy.OutputField(desc="Direct, concise answer")


class FewShotQA(dspy.Signature):
    """Few-shot QA with examples for context."""

    examples = dspy.InputField(desc="List of example Q&A pairs as context")
    question = dspy.InputField(desc="The question to answer")
    answer = dspy.OutputField(desc="Answer following the example pattern")


class ChainOfThought(dspy.Signature):
    """Reason step-by-step before answering."""

    question = dspy.InputField()
    reasoning = dspy.OutputField(desc="Step-by-step reasoning process")
    answer = dspy.OutputField(desc="Final answer based on reasoning")


class TreeOfThought(dspy.Signature):
    """Explore multiple reasoning paths."""

    question = dspy.InputField()
    path_a = dspy.OutputField(desc="First reasoning approach")
    path_b = dspy.OutputField(desc="Alternative reasoning approach")
    evaluation = dspy.OutputField(desc="Which path is better and why")
    answer = dspy.OutputField(desc="Final answer from best path")


# ============= AgencyOS Specific Signatures =============


class CodeReview(dspy.Signature):
    """Review code for issues and improvements."""

    code = dspy.InputField(desc="Code to review")
    language = dspy.InputField(desc="Programming language")
    issues = dspy.OutputField(desc="List of issues found")
    suggestions = dspy.OutputField(desc="Improvement suggestions")
    score = dspy.OutputField(desc="Code quality score 1-10")


class ContentGeneration(dspy.Signature):
    """Generate marketing/blog content."""

    topic = dspy.InputField(desc="Content topic")
    tone = dspy.InputField(desc="Writing tone (professional, casual, technical)")
    audience = dspy.InputField(desc="Target audience")
    content = dspy.OutputField(desc="Generated content")
    seo_keywords = dspy.OutputField(desc="Relevant SEO keywords")


class TaskDecomposition(dspy.Signature):
    """Break down complex tasks into subtasks."""

    task = dspy.InputField(desc="Complex task description")
    constraints = dspy.InputField(desc="Time, resource, or other constraints")
    subtasks = dspy.OutputField(desc="List of actionable subtasks")
    dependencies = dspy.OutputField(desc="Dependencies between subtasks")
    estimated_time = dspy.OutputField(desc="Time estimate for each subtask")


class BugAnalysis(dspy.Signature):
    """Analyze bugs and suggest fixes."""

    error_message = dspy.InputField(desc="Error message or bug description")
    code_context = dspy.InputField(desc="Relevant code context")
    root_cause = dspy.OutputField(desc="Identified root cause")
    fix_suggestion = dspy.OutputField(desc="Suggested fix with code")
    prevention = dspy.OutputField(desc="How to prevent similar bugs")


class RevenueOptimization(dspy.Signature):
    """Analyze and optimize revenue strategies."""

    current_metrics = dspy.InputField(desc="Current revenue metrics")
    product_info = dspy.InputField(desc="Product/service details")
    analysis = dspy.OutputField(desc="Revenue analysis")
    opportunities = dspy.OutputField(desc="Growth opportunities")
    action_plan = dspy.OutputField(desc="Prioritized action items")


# ============= DSPy Modules =============


class AgencyOSCoT(dspy.Module):
    """Chain of Thought module for AgencyOS tasks."""

    def __init__(self):
        super().__init__()
        self.cot = dspy.ChainOfThought(ChainOfThought)

    def forward(self, question: str):
        return self.cot(question=question)


class AgencyOSCodeReviewer(dspy.Module):
    """Code review module with reasoning."""

    def __init__(self):
        super().__init__()
        self.reviewer = dspy.ChainOfThought(CodeReview)

    def forward(self, code: str, language: str = "python"):
        return self.reviewer(code=code, language=language)


class AgencyOSContentWriter(dspy.Module):
    """Content generation with SEO optimization."""

    def __init__(self):
        super().__init__()
        self.writer = dspy.ChainOfThought(ContentGeneration)

    def forward(self, topic: str, tone: str = "professional", audience: str = "developers"):
        return self.writer(topic=topic, tone=tone, audience=audience)


class AgencyOSTaskPlanner(dspy.Module):
    """Task decomposition with dependencies."""

    def __init__(self):
        super().__init__()
        self.planner = dspy.ChainOfThought(TaskDecomposition)

    def forward(self, task: str, constraints: str = "none"):
        return self.planner(task=task, constraints=constraints)


# ============= Utility Functions =============


def setup_dspy_gemini():
    """Setup DSPy with Gemini (Antigravity standard)."""
    import os

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")

    lm = dspy.Google("models/gemini-1.5-flash", api_key=api_key)
    dspy.settings.configure(lm=lm)
    return lm


def setup_dspy_litellm(model: str = "gemini/gemini-1.5-flash"):
    """Setup DSPy with LiteLLM for multi-provider support."""
    lm = dspy.LM(model)
    dspy.settings.configure(lm=lm)
    return lm


if __name__ == "__main__":
    # Test the modules
    import sys

    print("🧠 DSPy AgencyOS Signatures loaded successfully!")
    print("\nAvailable Signatures:")
    print("  - ZeroShotQA")
    print("  - FewShotQA")
    print("  - ChainOfThought")
    print("  - TreeOfThought")
    print("  - CodeReview")
    print("  - ContentGeneration")
    print("  - TaskDecomposition")
    print("  - BugAnalysis")
    print("  - RevenueOptimization")
    print("\nAvailable Modules:")
    print("  - AgencyOSCoT")
    print("  - AgencyOSCodeReviewer")
    print("  - AgencyOSContentWriter")
    print("  - AgencyOSTaskPlanner")
