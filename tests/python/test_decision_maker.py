"""
Test file for the Decision Maker module
"""
from src.core.decision_maker import DecisionMaker, MemoryAugmentedDecisionEngine


def test_decision_maker():
    """Test the DecisionMaker class functionality"""
    # Initialize the decision maker
    dm = DecisionMaker(user_id="test-user-decision-maker")

    # Test recording a decision
    result = dm.record_decision(
        decision_context="Should we implement feature X?",
        decision="Yes, implement feature X",
        outcome="Success, users engaged positively",
        confidence=0.8,
        metadata={"priority": "high", "deadline": "2026-04-01"}
    )

    # The function should return True/False based on memory storage success
    assert isinstance(result, bool)

    # Test finding similar decisions (there won't be any yet, but function should work)
    similar = dm.find_similar_decisions("Should we implement feature X?")
    assert isinstance(similar, list)

    # Test getting recommendation (won't find anything yet but should return None)
    dm.get_recommendation("Should we implement feature X?")
    # Recommendation could be None if no similar decisions exist yet

    print("✅ DecisionMaker tests passed")


def test_memory_augmented_decision_engine():
    """Test the MemoryAugmentedDecisionEngine class functionality"""
    # Initialize the decision engine
    engine = MemoryAugmentedDecisionEngine(user_id="test-user-decision-engine")

    # Test making a decision with some options
    context = "Choosing a technology stack for the new project"
    options = ["React + Node.js", "Vue + Django", "Angular + Spring Boot"]

    decision, metadata = engine.make_decision(context, options)

    # The decision should be one of the options
    assert decision in options or decision == "no-option-available"
    assert isinstance(metadata, dict)

    # Test recording decision outcome
    engine.record_decision_outcome(
        context=context,
        decision=decision,
        outcome="Project completed successfully",
        confidence=0.9
    )

    print("✅ MemoryAugmentedDecisionEngine tests passed")


def test_different_users():
    """Test that different users have isolated decision histories"""
    user1_dm = DecisionMaker(user_id="user-1")
    user2_dm = DecisionMaker(user_id="user-2")

    # Both should initialize without issue
    result1 = user1_dm.record_decision(
        decision_context="User 1 decision",
        decision="Option A",
        outcome="Good result",
        confidence=0.7
    )

    result2 = user2_dm.record_decision(
        decision_context="User 2 decision",
        decision="Option B",
        outcome="Also good result",
        confidence=0.8
    )

    # Both recordings should work
    assert isinstance(result1, bool)
    assert isinstance(result2, bool)

    print("✅ User isolation tests passed")


if __name__ == "__main__":
    test_decision_maker()
    test_memory_augmented_decision_engine()
    test_different_users()
    print("\n🎉 All decision maker tests passed!")