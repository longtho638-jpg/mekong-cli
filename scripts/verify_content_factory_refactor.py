"""
Verification script for Content Factory Refactor.
"""
import sys
import os
import logging
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.getcwd())

# Configure logging
logging.basicConfig(level=logging.INFO)

from antigravity.core.content_factory import (
    content_factory,
    ContentType,
    ContentStatus,
    ContentIdea,
    ContentPiece
)

def verify_content_factory():
    print("Testing Content Factory Refactor...")

    # Clear state
    content_factory.ideas = []
    content_factory.content_archive = []

    # 1. Test Idea Generation
    print("\n1. Testing Idea Generation...")
    ideas = content_factory.generate_ideas(count=5)

    if len(ideas) != 5:
        print(f"❌ Expected 5 ideas, got {len(ideas)}")
        return False

    if len(content_factory.ideas) != 5:
        print(f"❌ Engine internal state mismatch: {len(content_factory.ideas)} ideas")
        return False

    print(f"   Generated {len(ideas)} ideas. Top idea score: {ideas[0].virality_score}")
    print("   Idea generation verified ✅")

    # 2. Test Content Creation
    print("\n2. Testing Content Creation...")
    idea = ideas[0]
    piece = content_factory.create_post(idea)

    if piece.title != idea.title:
        print(f"❌ Title mismatch. Expected '{idea.title}', got '{piece.title}'")
        return False

    if piece.content_type != idea.content_type:
        print("❌ Content type mismatch")
        return False

    if len(content_factory.content_archive) != 1:
        print("❌ Content not archived")
        return False

    print("   Content creation verified ✅")

    # 3. Test Calendar Generation
    print("\n3. Testing Calendar Generation...")
    # Requesting 7 days should generate more ideas since we only have 5
    calendar = content_factory.get_calendar(days=7)

    if len(calendar) != 7:
        print(f"❌ Expected 7 calendar entries, got {len(calendar)}")
        return False

    if len(content_factory.ideas) < 7:
        print(f"❌ Failed to auto-generate missing ideas. Count: {len(content_factory.ideas)}")
        return False

    print("   Calendar generation verified ✅")

    # 4. Test Stats
    print("\n4. Testing Stats...")
    stats = content_factory.get_stats()

    if stats["inventory"]["drafts_completed"] != 1:
        print("❌ Stats mismatch for drafts")
        return False

    print("   Stats verified ✅")

    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_content_factory():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
