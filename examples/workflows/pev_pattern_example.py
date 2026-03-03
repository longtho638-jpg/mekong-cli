#!/usr/bin/env python3
"""
Example: Plan-Execute-Verify (PEV) Pattern

This example demonstrates the core PEV pattern that powers
Mekong CLI's autonomous agent execution.
"""

from mekong.core import RecipePlanner, RecipeExecutor, RecipeVerifier
from mekong.core.llm_client import LLMClient


def main():
    # Initialize components
    llm = LLMClient()
    planner = RecipePlanner(llm)
    executor = RecipeExecutor()
    verifier = RecipeVerifier()

    # Goal: Create a simple Python calculator
    goal = "Create a Python calculator with add, subtract, multiply, divide functions"

    print("=== PHASE 1: PLAN ===")
    recipe = planner.plan(goal)
    print(f"Generated recipe with {len(recipe.steps)} steps:")
    for i, step in enumerate(recipe.steps, 1):
        print(f"  {i}. {step.description}")

    print("\n=== PHASE 2: EXECUTE ===")
    for step in recipe.steps:
        print(f"\nExecuting: {step.description}")
        result = executor.execute(step)
        print(f"Exit code: {result.exit_code}")
        if result.stdout:
            print(f"Output: {result.stdout[:200]}")

    print("\n=== PHASE 3: VERIFY ===")
    verification = verifier.verify(recipe, executor.results)
    print(f"Verification: {'PASSED' if verification.passed else 'FAILED'}")
    print(f"Report: {verification.summary}")

    print("\n✅ PEV pattern demonstration completed!")


if __name__ == "__main__":
    # Note: Requires LLM_API_KEY environment variable
    print("This example requires LLM_API_KEY to be set.")
    print("Set: export LLM_API_KEY=your_key_here\n")
    main()
