#!/usr/bin/env python3
"""
Example: Intent Classification (NLU)

Demonstrates how to use Mekong's NLU module to classify
user intents and route to appropriate handlers.
"""

from mekong.core.nlu import IntentClassifier
from mekong.core.memory import MemoryStore


def main():
    # Initialize NLU components
    classifier = IntentClassifier()
    memory = MemoryStore()

    # Example user inputs
    test_cases = [
        "Create a new Python project with FastAPI",
        "Fix the bug in the authentication module",
        "Add unit tests for the user service",
        "Deploy to production",
        "What's the weather today?",  # Out of domain
    ]

    print("=== Intent Classification ===\n")

    for user_input in test_cases:
        # Classify intent
        intent = classifier.classify(user_input)

        print(f"Input: {user_input}")
        print(f"  Intent: {intent['intent']}")
        print(f"  Confidence: {intent['confidence']:.2f}")
        print(f"  Slots: {intent.get('slots', {})}")

        # Check if high confidence (>90%)
        if intent["confidence"] > 0.9:
            print("  → High confidence: Skip planning, execute directly")
        elif intent["confidence"] > 0.7:
            print("  → Medium confidence: Use standard planning")
        else:
            print("  → Low confidence: Full planning required")

        print()

    # Store interaction in memory
    print("=== Storing in Memory ===")
    memory.store(
        entry_type="interaction",
        data={"input": test_cases[0], "intent": "create_project"},
    )
    print("Interaction stored successfully!")

    # Retrieve similar interactions
    similar = memory.search(query="create project", limit=3)
    print(f"\nFound {len(similar)} similar interactions")


if __name__ == "__main__":
    main()
